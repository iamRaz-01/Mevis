import http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import crypto from "node:crypto";
import { loadServiceConfig, loadDatabaseConfig } from "@mevis/infrastructure-configuration";
import { StructuredLogger } from "@mevis/logger";
import { extractContext } from "@mevis/platform-communication";
import { SqliteDatabaseAdapter, SqlMigrationRunner } from "@mevis/platform-data";
import { type StandardResponse, type StandardError } from "@mevis/platform-contracts";
import { RelationalStorageAdapter } from "./storage-port";
import {
  KnowledgeAssetRepository,
  KnowledgeDocumentRepository,
  DocumentVersionRepository,
  type KnowledgeAssetEntity,
  type KnowledgeDocumentEntity,
  type DocumentVersionEntity,
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
const docRepo = new KnowledgeDocumentRepository(dbClient);
const versionRepo = new DocumentVersionRepository(dbClient);

interface RequestBody {
  readonly id?: string;
  readonly title?: string;
  readonly domain?: string;
  readonly category?: string;
  readonly ownerId?: string;
  readonly tags?: readonly string[];
  readonly state?: string;
  // Governance fields
  readonly source?: string;
  readonly language?: string;
  readonly region?: string;
  readonly audience?: string;
  readonly confidentiality?: string;
  readonly approvalDate?: string;
  readonly expirationDate?: string;
  readonly retentionPolicy?: string;
  // Document mapping
  readonly name?: string;
  readonly mimeType?: string;
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
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
  "Deprecated",
  "Archived",
]);

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

// Permission mapping based on actor role
function getPermissions(role: string | undefined): Set<string> {
  const perms = new Set<string>();
  if (!role) return perms;

  if (role.includes("ROLE_ADMIN")) {
    perms.add("knowledge:create");
    perms.add("knowledge:update");
    perms.add("knowledge:archive");
    perms.add("knowledge:read");
  }
  if (role.includes("ROLE_EVENT_COORDINATOR")) {
    perms.add("knowledge:update");
    perms.add("knowledge:read");
  }
  if (role.includes("ROLE_USER") || role.includes("ROLE_VOLUNTEER") || role.length > 0) {
    perms.add("knowledge:read");
  }
  return perms;
}

function hasPermission(role: string | undefined, requiredPerm: string): boolean {
  const perms = getPermissions(role);
  return perms.has(requiredPerm);
}

// Compute SHA-256 checksum for duplicate check filter
function computeSha256(content: Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
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
      if (!hasPermission(ctx.actorRole, "knowledge:create")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:create permission required." }]);
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
        source: body.source || null,
        language: body.language || null,
        region: body.region || null,
        audience: body.audience || null,
        confidentiality: body.confidentiality || null,
        approval_date: body.approvalDate || null,
        expiration_date: body.expirationDate || null,
        retention_policy: body.retentionPolicy || null,
        created_at: now,
        updated_at: now,
        version: 1,
      };

      const saved = await assetRepo.save(asset);
      return sendJson(res, 201, saved);
    }

    // 3. GET /api/assets - List all Knowledge Assets (with optional filter parameters)
    if (req.method === "GET" && url.pathname === "/api/assets") {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }

      const category = url.searchParams.get("category") || undefined;
      const owner_id = url.searchParams.get("owner") || undefined;
      const tag = url.searchParams.get("tag") || undefined;
      const lifecycle_state = url.searchParams.get("lifecycle") || undefined;

      const list = await assetRepo.findWithFilters({ category, owner_id, tag, lifecycle_state });
      return sendJson(res, 200, list);
    }

    // 4. GET /api/assets/:id - Retrieve specific Asset details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "assets" && segments[2] && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }

      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }
      return sendJson(res, 200, asset);
    }

    // 5. PUT /api/assets/:id/metadata - Update asset metadata attributes (with governance fields)
    if (req.method === "PUT" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "metadata") {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
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
        source: body.source !== undefined ? body.source : asset.source,
        language: body.language !== undefined ? body.language : asset.language,
        region: body.region !== undefined ? body.region : asset.region,
        audience: body.audience !== undefined ? body.audience : asset.audience,
        confidentiality: body.confidentiality !== undefined ? body.confidentiality : asset.confidentiality,
        approval_date: body.approvalDate !== undefined ? body.approvalDate : asset.approval_date,
        expiration_date: body.expirationDate !== undefined ? body.expirationDate : asset.expiration_date,
        retention_policy: body.retentionPolicy !== undefined ? body.retentionPolicy : asset.retention_policy,
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

    // 6. POST /api/assets/:id/documents - Register document format
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "documents" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
      }

      const assetId = segments[2];
      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const body = (await readJson(req)) as RequestBody;
      if (!body.id || !body.name || !body.mimeType) {
        return sendJson(res, 400, undefined, [
          { code: "INVALID_ARGUMENT", message: "Missing required properties: id, name, mimeType." },
        ]);
      }

      const doc: KnowledgeDocumentEntity = {
        id: body.id,
        asset_id: assetId,
        name: body.name,
        mime_type: body.mimeType,
        created_at: new Date().toISOString(),
      };

      const savedDoc = await docRepo.save(doc);
      return sendJson(res, 201, savedDoc);
    }

    // GET /api/assets/:id/documents - Enumerate documents list
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "documents" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }

      const assetId = segments[2];
      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const list = await docRepo.findByAssetId(assetId);
      return sendJson(res, 200, list);
    }

    // 7. POST /api/assets/:id/documents/:docId/versions - Create a new document version file
    if (
      req.method === "POST" &&
      segments[0] === "api" &&
      segments[1] === "assets" &&
      segments[2] &&
      segments[3] === "documents" &&
      segments[4] &&
      segments[5] === "versions"
    ) {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
      }

      const assetId = segments[2];
      const docId = segments[4];

      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const doc = await docRepo.findById(docId);
      if (!doc || doc.asset_id !== assetId) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Document "${docId}" under asset "${assetId}" not found.` }]);
      }

      const semver = url.searchParams.get("semver");
      const changelog = url.searchParams.get("changelog") || "";
      const createdBy = url.searchParams.get("createdBy") || ctx.actorId || "System";
      const parentVersionId = url.searchParams.get("parentVersionId") || null;

      if (!semver) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required query param: semver." }]);
      }

      const fileContent = await readBinary(req);
      if (fileContent.length === 0) {
        return sendJson(res, 400, undefined, [{ code: "EMPTY_BODY", message: "Cannot upload empty file payload." }]);
      }

      // SHA-256 duplicate detection check
      const checksum = computeSha256(fileContent);
      const duplicate = await versionRepo.findByChecksum(checksum);
      if (duplicate) {
        return sendJson(res, 409, undefined, [
          { code: "ALREADY_EXISTS", message: `Document binary with matching SHA-256 checksum ${checksum} already exists in repository.` },
        ]);
      }

      // Check if this semver version already exists for the document
      const existingVer = await versionRepo.findSpecificVersion(docId, semver);
      if (existingVer) {
        return sendJson(res, 409, undefined, [
          { code: "ALREADY_EXISTS", message: `Version "${semver}" already exists for document "${docId}".` },
        ]);
      }

      // Resolve version number sequence
      const existingVersionsList = await versionRepo.findByDocumentId(docId);
      const versionNum = existingVersionsList.length + 1;

      // Persist raw document stream using Storage Port
      const filename = `${docId}_v_${semver}`;
      const storageId = await storageAdapter.storeFile(filename, doc.mime_type, fileContent);
      const storageUri = `storage://${storageId}`;

      const ver: DocumentVersionEntity = {
        id: crypto.randomUUID(),
        document_id: docId,
        semver,
        version_number: versionNum,
        storage_uri: storageUri,
        file_size: fileContent.length,
        checksum_sha256: checksum,
        changelog,
        parent_version_id: parentVersionId,
        created_at: new Date().toISOString(),
        created_by: createdBy,
      };

      const savedVersion = await versionRepo.save(ver);
      return sendJson(res, 201, savedVersion);
    }

    // 8. GET /api/assets/:id/documents/:docId/versions - Retrieve versions history list
    if (
      req.method === "GET" &&
      segments[0] === "api" &&
      segments[1] === "assets" &&
      segments[2] &&
      segments[3] === "documents" &&
      segments[4] &&
      segments[5] === "versions" &&
      !segments[6]
    ) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }

      const assetId = segments[2];
      const docId = segments[4];

      const asset = await assetRepo.findById(assetId);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${assetId}" not found.` }]);
      }

      const doc = await docRepo.findById(docId);
      if (!doc || doc.asset_id !== assetId) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Document "${docId}" under asset "${assetId}" not found.` }]);
      }

      const list = await versionRepo.findByDocumentId(docId);
      return sendJson(res, 200, list);
    }

    // 9. GET /api/assets/:id/documents/:docId/versions/:semver/download - Download specific document file
    if (
      req.method === "GET" &&
      segments[0] === "api" &&
      segments[1] === "assets" &&
      segments[2] &&
      segments[3] === "documents" &&
      segments[4] &&
      segments[5] === "versions" &&
      segments[6] &&
      segments[7] === "download"
    ) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }

      const assetId = segments[2];
      const docId = segments[4];
      const semver = segments[6];

      const ver = await versionRepo.findSpecificVersion(docId, semver);
      if (!ver) {
        return sendJson(res, 404, undefined, [
          { code: "VERSION_NOT_FOUND", message: `Version "${semver}" for document "${docId}" not found.` },
        ]);
      }

      // Extract storage Id from Storage URI (storage://<id>)
      const storageId = ver.storage_uri.replace("storage://", "");
      const file = await storageAdapter.getFile(storageId);

      res.writeHead(200, {
        "Content-Type": file.mimeType,
        "Content-Length": file.content.byteLength,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "X-Asset-Id": assetId,
        "X-Document-Id": docId,
        "X-Version": semver,
        "X-Checksum-SHA256": ver.checksum_sha256,
      });
      return res.end(file.content);
    }

    // 10. POST /api/assets/:id/lifecycle - Progress lifecycle states
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "lifecycle") {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
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

    // 11. POST /api/assets/:id/archive - Archive asset (soft delete)
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "archive") {
      if (!hasPermission(ctx.actorRole, "knowledge:archive")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:archive permission required." }]);
      }

      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }

      const updatedAsset: KnowledgeAssetEntity = {
        ...asset,
        lifecycle_state: "Archived",
        updated_at: new Date().toISOString(),
      };

      const saved = await assetRepo.save(updatedAsset);
      return sendJson(res, 200, saved);
    }

    // 12. POST /api/assets/:id/restore - Restore asset from archive state
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "restore") {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
      }

      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }

      const updatedAsset: KnowledgeAssetEntity = {
        ...asset,
        lifecycle_state: "Draft",
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
    if (!response.ok) {
      logger.warn("Failed registration heartbeat with Gateway Service Registry.", { status: response.status });
    }
  } catch (err) {
    logger.warn("Could not reach Gateway Service Registry for heartbeat.", { error: err instanceof Error ? err.message : String(err) });
  }
}

// Bootstrap routine
async function bootstrap() {
  try {
    const migrationDir = path.resolve(__dirname, "../../migrations");
    if (fs.existsSync(migrationDir)) {
      const runner = new SqlMigrationRunner(dbClient);
      await runner.runMigrations(migrationDir);
      logger.info("Relational database migrations applied successfully.");
    }

    server.listen(PORT, () => {
      logger.info("Knowledge Platform Service workstation started.", {
        port: PORT,
        databaseFile: DB_FILE,
        storagePath: STORAGE_PATH,
      });

      registerWithGateway();
      setInterval(registerWithGateway, 15000).unref();
    });
  } catch (err) {
    logger.error("Bootstrap execution failure", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM. Cleaning resources and shutting down...");
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

export { server, dbClient, assetRepo, docRepo, versionRepo, storageAdapter };
