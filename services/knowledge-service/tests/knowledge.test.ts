import { test, describe, before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { SqliteDatabaseAdapter, SqlMigrationRunner } from "@mevis/platform-data";

const TEST_DB = path.join(__dirname, "test_knowledge.db");
const TEST_STORAGE = path.join(__dirname, "test_uploads");
const PORT = 3020;

// Set env vars globally at file evaluation time
process.env.DB_URL = TEST_DB;
process.env.STORAGE_BASE_PATH = TEST_STORAGE;

describe("Knowledge Repository End-to-End Tests", () => {
  let server: http.Server;
  let dbClient: SqliteDatabaseAdapter;

  before(async () => {
    // 1. Setup folders and DB
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_STORAGE, { recursive: true });

    // Dynamic import to guarantee env variables are loaded by server
    const serverModule = await import("../src/index.js");
    server = serverModule.server;
    dbClient = serverModule.dbClient;

    // Run migrations
    const migrationDir = path.resolve(__dirname, "../../migrations");
    const runner = new SqlMigrationRunner(dbClient);
    await runner.runMigrations(migrationDir);

    // Start local server
    await new Promise<void>((resolve) => {
      server.listen(PORT, () => {
        resolve();
      });
    });
  });

  after(async () => {
    await dbClient.close();
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    // Cleanup files
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
  });

  interface TestPayload {
    readonly success?: boolean;
    readonly errors?: ReadonlyArray<{ readonly code: string; readonly message: string }>;
    readonly data?: unknown;
  }

  // Helper fetch request
  async function makeRequest(
    method: string,
    pathname: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; payload: TestPayload; rawBody: Buffer }> {
    return new Promise((resolve, reject) => {
      const opt = {
        hostname: "localhost",
        port: PORT,
        path: pathname,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      const req = http.request(opt, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          let parsed: unknown = null;
          try {
            parsed = JSON.parse(raw.toString("utf-8"));
          } catch {}
          resolve({ status: res.statusCode || 500, payload: parsed as TestPayload, rawBody: raw });
        });
      });

      req.on("error", reject);
      if (body) {
        if (Buffer.isBuffer(body)) {
          req.write(body);
        } else {
          req.write(JSON.stringify(body));
        }
      }
      req.end();
    });
  }

  test("1. Reject registration if client is not an administrator", async () => {
    const res = await makeRequest("POST", "/api/assets", {
      id: "know_sop_evac_01",
      title: "Evacuation SOP",
      domain: "Security",
      category: "Security",
      ownerId: "steward-1",
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.payload.success, false);
    const errors = res.payload.errors;
    assert.ok(errors);
    assert.strictEqual(errors[0]?.code, "FORBIDDEN");
  });

  test("2. Successfully register a new Knowledge Asset with metadata", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets",
      {
        id: "know_sop_evac_01",
        title: "Evacuation SOP",
        domain: "Security",
        category: "Security",
        ownerId: "steward-1",
        tags: ["emergency", "exit", "stadium"],
      },
      { "x-actor-role": "ROLE_ADMIN", "x-actor-id": "admin-1" }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.payload.success, true);
    const data = res.payload.data as { id?: string; lifecycle_state?: string };
    assert.strictEqual(data.id, "know_sop_evac_01");
    assert.strictEqual(data.lifecycle_state, "Draft");
  });

  test("3. Retrieve registered asset detail metadata", async () => {
    const res = await makeRequest("GET", "/api/assets/know_sop_evac_01");
    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { title?: string; category?: string };
    assert.strictEqual(data.title, "Evacuation SOP");
    assert.strictEqual(data.category, "Security");
  });

  test("4. Modify asset metadata fields", async () => {
    const res = await makeRequest(
      "PUT",
      "/api/assets/know_sop_evac_01/metadata",
      {
        title: "Evacuation SOP Updated Title",
        tags: ["emergency", "new-tag"],
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { title?: string; tags?: readonly string[] };
    assert.strictEqual(data.title, "Evacuation SOP Updated Title");
    assert.ok(data.tags?.includes("new-tag"));
  });

  test("5. Progress asset lifecycle transitions", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/lifecycle",
      { state: "Published" },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { lifecycle_state?: string };
    assert.strictEqual(data.lifecycle_state, "Published");
  });

  test("6. Upload a document file version associated with the asset", async () => {
    const docData = Buffer.from("PDF Mock Binary Contents...");
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/versions?semver=1.0.0&changelog=InitialRelease",
      docData,
      {
        "x-actor-role": "ROLE_ADMIN",
        "Content-Type": "application/pdf",
      }
    );

    assert.strictEqual(res.status, 201);
    const data = res.payload.data as { semver?: string; storage_id?: string };
    assert.strictEqual(data.semver, "1.0.0");
    assert.ok(data.storage_id);
  });

  test("7. Download specific uploaded version content payload", async () => {
    const res = await makeRequest("GET", "/api/assets/know_sop_evac_01/versions/1.0.0/download", undefined, {
      "Content-Type": "application/octet-stream",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.rawBody.toString("utf-8"), "PDF Mock Binary Contents...");
  });

  test("8. Retrieve history of uploaded versions", async () => {
    const res = await makeRequest("GET", "/api/assets/know_sop_evac_01/versions");
    assert.strictEqual(res.status, 200);
    const data = res.payload.data as ReadonlyArray<{ semver?: string }>;
    assert.ok(Array.isArray(data));
    assert.strictEqual(data[0]?.semver, "1.0.0");
  });
});
