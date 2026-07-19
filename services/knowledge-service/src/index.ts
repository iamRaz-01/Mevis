import http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import crypto from "node:crypto";
import { loadServiceConfig, loadDatabaseConfig } from "@mevis/infrastructure-configuration";
import { StructuredLogger } from "@mevis/logger";
import { extractContext } from "@mevis/platform-communication";
import { SqliteDatabaseAdapter, SqlMigrationRunner } from "@mevis/platform-data";
import { type StandardResponse } from "@mevis/platform-contracts";
import { RelationalStorageAdapter } from "./storage-port";
import {
  KnowledgeAssetRepository,
  KnowledgeVersionRepository,
  type KnowledgeAssetEntity,
  type KnowledgeVersionEntity,
} from "./repository";

const logger = new StructuredLogger("KnowledgeService");
const serviceConfig = loadServiceConfig("knowledge-service");
const dbConfig = loadDatabaseConfig();

const PORT = serviceConfig.port || 3007;
const DB_FILE = dbConfig.url || path.join(process.cwd(), "mevis.db");
const STORAGE_PATH = process.env.STORAGE_BASE_PATH || "./uploads";

// Initialize core adapters
const dbClient = new SqliteDatabaseAdapter(DB_FILE);
const storageAdapter = new RelationalStorageAdapter(STORAGE_PATH);

const assetRepo = new KnowledgeAssetRepository(dbClient);
const versionRepo = new KnowledgeVersionRepository(dbClient);

interface RequestBody {
  readonly id?: string;
  readonly title?: string;
  readonly domain?: string;
  readonly category?: string;
  readonly ownerId?: string;
  readonly tags?: readonly string[];
  readonly state?: string;
}

// Standard categories and lifecycle list
const VALID_CATEGORIES = new Set([
  "Operations",
  "Medical",
  "Security",
  "Volunteer",
  "Transportation",
  "Venue",
  "Emergency",
  "Technology",
]);

const VALID_LIFECYCLE_STATES = new Set([
  "Draft",
  "Review",
  "Approved",
  "Published",
  "Deprecated",
  "Archived",
]);

import { type StandardError } from "@mevis/platform-contracts";

// Helper to write JSON envelope responses
function sendJson<T>(res: http.ServerResponse, status: number, data?: T, errors?: readonly StandardError[]): void {
  const payload: StandardResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    errors,
  };
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "X-Service": "knowledge-service",
  });
  res.end(body);
}

// Helper to parse JSON request bodies
function readJson(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const bodyStr = Buffer.concat(chunks).toString("utf-8");
        resolve(bodyStr ? JSON.parse(bodyStr) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

// Helper to read raw request streams (for file uploads)
function readBinary(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Security authorization guard
function isAuthorized(role: string | undefined): boolean {
  if (!role) return false;
  return role.includes("ROLE_ADMIN");
}

const server = http.createServer(async (req, res) => {
  const ctx = extractContext(req);
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const segments = url.pathname.split("/").filter(Boolean);

  try {
    // 1. Health Status endpoint
    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { status: "UP", service: "knowledge-service" });
    }

    // 2. POST /api/assets - Register new Knowledge Asset
    if (req.method === "POST" && url.pathname === "/api/assets") {
      if (!isAuthorized(ctx.actorRole)) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "ROLE_ADMIN required." }]);
      }

      const body = (await readJson(req)) as RequestBody;
      if (!body.id || !body.title || !body.domain || !body.category || !body.ownerId) {
        return sendJson(res, 400, undefined, [
          { code: "INVALID_ARGUMENT", message: "Missing required properties: id, title, domain, category, ownerId." },
        ]);
      }

      if (!VALID_CATEGORIES.has(body.category)) {
        return sendJson(res, 400, undefined, [
          { code: "INVALID_CATEGORY", message: `Category must be one of: ${Array.from(VALID_CATEGORIES).join(", ")}` },
        ]);
      }

      const existing = await assetRepo.findById(body.id);
      if (existing) {
        return sendJson(res, 409, undefined, [{ code: "ALREADY_EXISTS", message: `Asset "${body.id}" already registered.` }]);
      }

      const now = new Date().toISOString();
      const asset: KnowledgeAssetEntity = {
        id: body.id,
        title: body.title,
        domain: body.domain,
        category: body.category,
        tags: JSON.stringify(body.tags || []),
        owner_id: body.ownerId,
        lifecycle_state: "Draft",
        created_at: now,
        updated_at: now,
        version: 1,
      };

      const saved = await assetRepo.save(asset);
      return sendJson(res, 201, saved);
    }

    // 3. GET /api/assets - List all Knowledge Assets
    if (req.method === "GET" && url.pathname === "/api/assets") {
      const list = await assetRepo.findAll();
      return sendJson(res, 200, list);
    }

    // 4. GET /api/assets/:id - Retrieve specific Asset details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "assets" && segments[2] && !segments[3]) {
      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }
      return sendJson(res, 200, asset);
    }

    // 5. PUT /api/assets/:id/metadata - Update asset metadata attributes
    if (req.method === "PUT" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "metadata") {
      if (!isAuthorized(ctx.actorRole)) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "ROLE_ADMIN required." }]);
      }

      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }

      const body = (await readJson(req)) as RequestBody;
      const updatedAsset: KnowledgeAssetEntity = {
        ...asset,
        title: body.title || asset.title,
        domain: body.domain || asset.domain,
        category: body.category || asset.category,
        tags: body.tags ? JSON.stringify(body.tags) : asset.tags,
        owner_id: body.ownerId || asset.owner_id,
        updated_at: new Date().toISOString(),
      };

      if (body.category && !VALID_CATEGORIES.has(body.category)) {
        return sendJson(res, 400, undefined, [
          { code: "INVALID_CATEGORY", message: `Category must be one of: ${Array.from(VALID_CATEGORIES).join(", ")}` },
        ]);
      }

      const saved = await assetRepo.save(updatedAsset);
      return sendJson(res, 200, saved);
    }

    // 6. POST /api/assets/:id/versions - Upload a new document version file
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "versions") {
      if (!isAuthorized(ctx.actorRole)) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "ROLE_ADMIN required." }]);
      }

      const assetId = segments[2];
      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const semver = url.searchParams.get("semver");
      const changelog = url.searchParams.get("changelog") || "";
      const createdBy = url.searchParams.get("createdBy") || ctx.actorId || "System";

      if (!semver) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required query param: semver." }]);
      }

      // Check if this semver version already exists for the asset
      const existingVer = await versionRepo.findSpecificVersion(assetId, semver);
      if (existingVer) {
        return sendJson(res, 409, undefined, [
          { code: "ALREADY_EXISTS", message: `Version "${semver}" already exists for asset "${assetId}".` },
        ]);
      }

      const fileContent = await readBinary(req);
      if (fileContent.length === 0) {
        return sendJson(res, 400, undefined, [{ code: "EMPTY_BODY", message: "Cannot upload empty file payload." }]);
      }

      const mimeType = req.headers["content-type"] || "application/octet-stream";
      const filename = `${assetId}_v_${semver}`;

      // Persist raw document stream using Storage Port adapter
      const storageId = await storageAdapter.storeFile(filename, mimeType, fileContent);

      const ver: KnowledgeVersionEntity = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        semver,
        storage_id: storageId,
        changelog,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      };

      const savedVersion = await versionRepo.save(ver);
      return sendJson(res, 201, savedVersion);
    }

    // 7. GET /api/assets/:id/versions - Retrieve version revision history list
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "versions" && !segments[4]) {
      const assetId = segments[2];
      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const list = await versionRepo.findByAssetId(assetId);
      return sendJson(res, 200, list);
    }

    // 8. GET /api/assets/:id/versions/:semver/download - Download specific version file content
    if (
      req.method === "GET" &&
      segments[0] === "api" &&
      segments[1] === "assets" &&
      segments[2] &&
      segments[3] === "versions" &&
      segments[4] &&
      segments[5] === "download"
    ) {
      const assetId = segments[2];
      const semver = segments[4];

      const ver = await versionRepo.findSpecificVersion(assetId, semver);
      if (!ver) {
        return sendJson(res, 404, undefined, [
          { code: "VERSION_NOT_FOUND", message: `Version "${semver}" for asset "${assetId}" not found.` },
        ]);
      }

      const file = await storageAdapter.getFile(ver.storage_id);

      res.writeHead(200, {
        "Content-Type": file.mimeType,
        "Content-Length": file.content.byteLength,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "X-Asset-Id": assetId,
        "X-Version": semver,
      });
      return res.end(file.content);
    }

    // 9. POST /api/assets/:id/lifecycle - Progress lifecycle states
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "lifecycle") {
      if (!isAuthorized(ctx.actorRole)) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "ROLE_ADMIN required." }]);
      }

      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }

      const body = (await readJson(req)) as RequestBody;
      if (!body.state) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: state." }]);
      }

      if (!VALID_LIFECYCLE_STATES.has(body.state)) {
        return sendJson(res, 400, undefined, [
          {
            code: "INVALID_STATE",
            message: `Lifecycle state must be one of: ${Array.from(VALID_LIFECYCLE_STATES).join(", ")}`,
          },
        ]);
      }

      const updatedAsset: KnowledgeAssetEntity = {
        ...asset,
        lifecycle_state: body.state,
        updated_at: new Date().toISOString(),
      };

      const saved = await assetRepo.save(updatedAsset);
      return sendJson(res, 200, saved);
    }

    return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: "Endpoint not found." }]);
  } catch (err) {
    logger.error("Request handling error", { error: err instanceof Error ? err.message : String(err) });
    return sendJson(res, 500, undefined, [
      { code: "INTERNAL_SERVER_ERROR", message: err instanceof Error ? err.message : "Server error." },
    ]);
  }
});

// Gateway Registration Routine
const REGISTRY_URL = process.env.SERVICE_REGISTRY_URL || "http://localhost:8000/api/registry/register";

async function registerWithGateway(): Promise<void> {
  try {
    const response = await fetch(REGISTRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "knowledge-service",
        version: "1.0.0",
        endpoint: `http://localhost:${PORT}`,
      }),
    });
    if (response.ok) {
      logger.info("Successfully registered with Gateway Service Registry.");
    } else {
      logger.warn("Failed registration heartbeat with Gateway Service Registry.", { status: response.status });
    }
  } catch (err) {
    logger.warn("Could not reach Gateway Service Registry for heartbeat.", { error: err instanceof Error ? err.message : String(err) });
  }
}

// Bootstrap routine: Run migrations and start server
async function bootstrap() {
  try {
    // 1. Run sqlite database migrations
    const migrationDir = path.resolve(__dirname, "../../migrations");
    if (fs.existsSync(migrationDir)) {
      const runner = new SqlMigrationRunner(dbClient);
      await runner.runMigrations(migrationDir);
      logger.info("Relational database migrations applied successfully.");
    }

    // 2. Start server listener
    server.listen(PORT, () => {
      logger.info("Knowledge Platform Service workstation started.", {
        port: PORT,
        databaseFile: DB_FILE,
        storagePath: STORAGE_PATH,
      });

      // Periodic registration heartbeats
      registerWithGateway();
      setInterval(registerWithGateway, 15000).unref();
    });
  } catch (err) {
    logger.error("Bootstrap execution failure", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

// Handle termination signals
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM. Cleaning resources and shutting down...");
  // Notify gateway of deregistration
  const deregisterUrl = REGISTRY_URL.replace("/register", "/deregister");
  try {
    await fetch(deregisterUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "knowledge-service",
        endpoint: `http://localhost:${PORT}`,
      }),
    });
  } catch {}
  
  await dbClient.close();
  server.close(() => {
    process.exit(0);
  });
});

if (process.argv[1]?.endsWith("index.js")) {
  bootstrap();
}

export { server, dbClient, assetRepo, versionRepo, storageAdapter };
