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

describe("Enriched Knowledge Repository End-to-End Tests", () => {
  let server: http.Server;
  let dbClient: SqliteDatabaseAdapter;

  interface TestPayload {
    readonly success?: boolean;
    readonly errors?: ReadonlyArray<{ readonly code: string; readonly message: string }>;
    readonly data?: unknown;
  }

  before(async () => {
    // Setup clean folders and DB
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_STORAGE, { recursive: true });

    // Dynamic import to guarantee env variables are loaded by server configuration
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
    if (fs.existsSync(TEST_DB)) {
      try { fs.unlinkSync(TEST_DB); } catch {}
    }
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
  });

  // Helper fetch request
  async function makeRequest(
    method: string,
    pathname: string,
    body?: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; payload: TestPayload; rawBody: Buffer; headers: http.IncomingHttpHeaders }> {
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
          resolve({
            status: res.statusCode || 500,
            payload: parsed as TestPayload,
            rawBody: raw,
            headers: res.headers,
          });
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

  test("1. Reject registration if permission-based check fails", async () => {
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

  test("2. Successfully register a new Knowledge Asset with full governance metadata", async () => {
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
        source: "FIFA Directive",
        language: "en",
        region: "Stadium-A",
        audience: "Security Personnel",
        confidentiality: "Internal",
        approvalDate: "2026-07-01T12:00:00Z",
        expirationDate: "2027-07-01T12:00:00Z",
        retentionPolicy: "Retain 5 years",
      },
      { "x-actor-role": "ROLE_ADMIN", "x-actor-id": "admin-1" }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.payload.success, true);
    const data = res.payload.data as { id?: string; lifecycle_state?: string; confidentiality?: string };
    assert.strictEqual(data.id, "know_sop_evac_01");
    assert.strictEqual(data.lifecycle_state, "Draft");
    assert.strictEqual(data.confidentiality, "Internal");
  });

  test("3. Retrieve registered assets and verify tag and category query filtering", async () => {
    const res = await makeRequest("GET", "/api/assets?category=Security&tag=exit", undefined, {
      "x-actor-role": "ROLE_ADMIN",
    });
    assert.strictEqual(res.status, 200);
    const data = res.payload.data as ReadonlyArray<{ id?: string; title?: string }>;
    assert.ok(Array.isArray(data));
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0]?.id, "know_sop_evac_01");
  });

  test("4. Modify asset metadata fields", async () => {
    const res = await makeRequest(
      "PUT",
      "/api/assets/know_sop_evac_01/metadata",
      {
        title: "Evacuation SOP Updated Title",
        confidentiality: "Confidential",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 200);
    const data = res.payload.data as { title?: string; confidentiality?: string };
    assert.strictEqual(data.title, "Evacuation SOP Updated Title");
    assert.strictEqual(data.confidentiality, "Confidential");
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

  test("6. Register a document format under the asset", async () => {
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents",
      {
        id: "doc_pdf_01",
        name: "evacuation_plan_pdf",
        mimeType: "application/pdf",
      },
      { "x-actor-role": "ROLE_ADMIN" }
    );

    assert.strictEqual(res.status, 201);
    const data = res.payload.data as { id?: string; name?: string };
    assert.strictEqual(data.id, "doc_pdf_01");
    assert.strictEqual(data.name, "evacuation_plan_pdf");
  });

  test("7. Upload a document file version associated with the document format", async () => {
    const docData = Buffer.from("PDF Mock Binary Contents...");
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions?semver=1.0.0&changelog=InitialRelease",
      docData,
      {
        "x-actor-role": "ROLE_ADMIN",
        "Content-Type": "application/pdf",
      }
    );

    assert.strictEqual(res.status, 201);
    const data = res.payload.data as { semver?: string; file_size?: number; storage_uri?: string };
    assert.strictEqual(data.semver, "1.0.0");
    assert.strictEqual(data.file_size, docData.length);
    assert.ok(data.storage_uri?.startsWith("storage://"));
  });

  test("8. Download specific uploaded version content payload", async () => {
    const res = await makeRequest("GET", "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions/1.0.0/download", undefined, {
      "x-actor-role": "ROLE_USER",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.rawBody.toString("utf-8"), "PDF Mock Binary Contents...");
    assert.ok(res.headers["x-checksum-sha256"]);
  });

  test("9. Reject duplicate document versions with the same checksum hash", async () => {
    const docData = Buffer.from("PDF Mock Binary Contents...");
    const res = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/documents/doc_pdf_01/versions?semver=1.0.1&changelog=DuplicateTest",
      docData,
      {
        "x-actor-role": "ROLE_ADMIN",
        "Content-Type": "application/pdf",
      }
    );

    assert.strictEqual(res.status, 409);
    const errors = res.payload.errors;
    assert.ok(errors);
    assert.strictEqual(errors[0]?.code, "ALREADY_EXISTS");
  });

  test("10. Verify Archive and Restore soft-delete routes", async () => {
    // 1. Soft-delete / Archive asset
    const archiveRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/archive",
      undefined,
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(archiveRes.status, 200);
    const archiveData = archiveRes.payload.data as { lifecycle_state?: string };
    assert.strictEqual(archiveData.lifecycle_state, "Archived");

    // 2. Restore asset
    const restoreRes = await makeRequest(
      "POST",
      "/api/assets/know_sop_evac_01/restore",
      undefined,
      { "x-actor-role": "ROLE_ADMIN" }
    );
    assert.strictEqual(restoreRes.status, 200);
    const restoreData = restoreRes.payload.data as { lifecycle_state?: string };
    assert.strictEqual(restoreData.lifecycle_state, "Draft");
  });
});
