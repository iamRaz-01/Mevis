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
  KnowledgeProcessingJobRepository,
  ProcessedDocumentRepository,
  ProcessedKnowledgeChunkRepository,
  CompiledEvidenceBundleRepository,
  EvidenceManifestRepository,
  GovernancePolicyRepository,
  GovernanceAuditRecordRepository,
  GovernanceHealthRecordRepository,
  type KnowledgeAssetEntity,
  type KnowledgeDocumentEntity,
  type DocumentVersionEntity,
  type KnowledgeProcessingJobEntity,
  type ProcessedDocumentEntity,
  type ProcessedKnowledgeChunkEntity,
  type CompiledEvidenceBundleEntity,
  type EvidenceManifestEntity,
  type GovernancePolicyEntity,
  type GovernanceAuditRecordEntity,
  type GovernanceHealthRecordEntity,
} from "./repository";
import { KnowledgeProcessingOrchestrator } from "./pipeline/orchestrator";
import { KnowledgeProcessingWorker, type DocumentVersionRepoPort, type ProcessingJobRepoPort } from "./pipeline/worker";
import { defaultPipelineConfig } from "./pipeline/context";
import { globalEventBus } from "./pipeline/event-bus";

// Search platform capabilities
import { InMemoryTfidfSearchIndex } from "./search/index-port";
import { RetrieverRegistry } from "./search/retriever/registry";
import { KeywordRetriever } from "./search/retriever/keyword";
import { SemanticRetriever } from "./search/retriever/semantic";
import { HybridRetriever } from "./search/retriever/hybrid";
import { KnowledgeSearchOrchestrator } from "./search/orchestrator";
import { type FilterEngineRepoPort, type FilterAssetMetadata } from "./search/filter";

// Evidence platform capabilities
import { 
  EvidenceOrchestrator, 
  type SearchServicePort, 
  type CompiledBundleRepoPort, 
  type ManifestRepoPort 
} from "./evidence/orchestrator";
import { type EvidenceBundle, type EvidenceManifest } from "./evidence/context";
import { type SearchRequest } from "./search/context";

// Governance platform capabilities
import { 
  GovernanceOrchestrator, 
  type GovernanceAssetRepoPort, 
  type GovernanceHealthRepoPort, 
  type GovernanceAuditRepoPort 
} from "./governance/orchestrator";
import { type PolicyRules, defaultPolicyRules } from "./governance/context";




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
const jobRepo = new KnowledgeProcessingJobRepository(dbClient);
const processedDocRepo = new ProcessedDocumentRepository(dbClient);
const chunkRepo = new ProcessedKnowledgeChunkRepository(dbClient);
const bundleRepo = new CompiledEvidenceBundleRepository(dbClient);
const manifestRepo = new EvidenceManifestRepository(dbClient);
const policyRepo = new GovernancePolicyRepository(dbClient);
const auditRepo = new GovernanceAuditRecordRepository(dbClient);
const healthRepo = new GovernanceHealthRecordRepository(dbClient);

// Set up worker and orchestrator wrappers
const orchestrator = new KnowledgeProcessingOrchestrator(
  {
    getFile: async (storageUri: string) => {
      const storageId = storageUri.replace("storage://", "");
      const file = await storageAdapter.getFile(storageId);
      return file.content;
    }
  },
  jobRepo,
  processedDocRepo,
  chunkRepo,
  defaultPipelineConfig
);

const versionRepoWrapper: DocumentVersionRepoPort = {
  getVersionById: async (id: string) => {
    const ver = await versionRepo.findById(id);
    if (!ver) return null;
    const doc = await docRepo.findById(ver.document_id);
    if (!doc) return null;
    return {
      id: ver.id,
      documentId: ver.document_id,
      name: doc.name,
      mimeType: doc.mime_type,
      filePath: ver.storage_uri,
      size: ver.file_size,
    };
  }
};

const jobRepoWrapper: ProcessingJobRepoPort = {
  updateJobStatus: async (jobId: string, status: string, errorMessage?: string) => {
    await jobRepo.updateJobStatus(jobId, status, errorMessage);
  },
  getNextQueuedJob: async () => {
    const job = await jobRepo.getNextQueuedJob();
    if (!job) return null;
    return {
      id: job.id,
      assetId: job.asset_id,
      documentId: job.document_id,
      versionId: job.version_id,
      status: job.status,
      retryCount: job.retry_count,
      errorMessage: job.error_message || undefined,
    };
  }
};

const worker = new KnowledgeProcessingWorker(
  jobRepoWrapper,
  versionRepoWrapper,
  orchestrator,
  2000
);

// 1. Relational port mapping metadata filter checks
const filterRepoPort: FilterEngineRepoPort = {
  getAssetMetadataList: async (assetIds: string[]) => {
    if (assetIds.length === 0) return {};
    const placeholders = assetIds.map(() => "?").join(", ");
    const sql = `SELECT id, category, owner_id, tags, lifecycle_state FROM knowledge_assets WHERE id IN (${placeholders});`;
    const rows = await dbClient.query<any>(sql, assetIds);
    
    const record: Record<string, FilterAssetMetadata> = {};
    for (const row of rows) {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof row.tags === "string" ? JSON.parse(row.tags) : (row.tags || []);
      } catch {}

      record[row.id] = {
        id: row.id,
        category: row.category,
        ownerId: row.owner_id,
        lifecycleState: row.lifecycle_state,
        tags: parsedTags,
      };
    }
    return record;
  }
};

// 2. Search infrastructure instantiations
const searchIndex = new InMemoryTfidfSearchIndex();
const keywordRetriever = new KeywordRetriever(searchIndex);
const semanticRetriever = new SemanticRetriever(searchIndex);
const hybridRetriever = new HybridRetriever(keywordRetriever, semanticRetriever);

const retrieverRegistry = new RetrieverRegistry();
retrieverRegistry.register(keywordRetriever);
retrieverRegistry.register(semanticRetriever);
retrieverRegistry.register(hybridRetriever);

const searchOrchestrator = new KnowledgeSearchOrchestrator(
  searchIndex,
  retrieverRegistry,
  filterRepoPort
);

// 3. Search index loader helper
async function initializeSearchIndex(): Promise<void> {
  try {
    const chunks = await dbClient.query<any>("SELECT * FROM processed_knowledge_chunks;");
    await searchIndex.rebuildIndex(chunks);
    logger.info(`Initialized search index with ${chunks.length} chunks from database.`);
  } catch (err: any) {
    logger.error("Failed to initialize search index", { error: err?.message || String(err) });
  }
}

// 4. Ingestion hook to keep search index in-sync
globalEventBus.subscribe("ProcessingCompleted", async () => {
  logger.info("SearchIndex: Received ProcessingCompleted event, rebuilding search index.");
  await initializeSearchIndex();
});
// 5. Evidence compilation adapters
const searchServiceWrapper: SearchServicePort = {
  search: async (request: SearchRequest) => {
    return await searchOrchestrator.search(request);
  },
  getAllChunks: () => {
    return [...searchIndex.getAllChunks()];
  }
};

const bundleRepoWrapper: CompiledBundleRepoPort = {
  saveBundle: async (id: string, query: string, bundle: EvidenceBundle) => {
    await bundleRepo.save({
      id,
      query,
      bundle_data: JSON.stringify(bundle),
      created_at: new Date().toISOString(),
    });
  },
  findBundleById: async (id: string) => {
    const entity = await bundleRepo.findById(id);
    if (!entity) return null;
    return JSON.parse(entity.bundle_data) as EvidenceBundle;
  }
};

const manifestRepoWrapper: ManifestRepoPort = {
  saveManifest: async (manifest: EvidenceManifest) => {
    await manifestRepo.save({
      id: manifest.id,
      query: manifest.query,
      execution_time_ms: manifest.executionTimeMs,
      retrieved_count: manifest.retrievedCount,
      validated_count: manifest.validatedCount,
      rejected_count: manifest.rejectedCount,
      merged_count: manifest.mergedCount,
      evidence_count: manifest.evidenceCount,
      confidence_avg: manifest.confidenceAvg,
      created_at: manifest.createdAt,
    });
  },
  findManifestById: async (id: string) => {
    const entity = await manifestRepo.findById(id);
    if (!entity) return null;
    return {
      id: entity.id,
      query: entity.query,
      executionTimeMs: entity.execution_time_ms,
      retrievedCount: entity.retrieved_count,
      validatedCount: entity.validated_count,
      rejectedCount: entity.rejected_count,
      mergedCount: entity.merged_count,
      evidenceCount: entity.evidence_count,
      confidenceAvg: entity.confidence_avg,
      createdAt: entity.created_at,
    };
  }
};

const evidenceOrchestrator = new EvidenceOrchestrator(
  searchServiceWrapper,
  filterRepoPort,
  bundleRepoWrapper,
  manifestRepoWrapper
);

// 6. Governance platform adapters
const governanceAssetRepoWrapper: GovernanceAssetRepoPort = {
  findAssetById: async (id: string) => await assetRepo.findById(id),
  findAllAssets: async () => await assetRepo.findAll(),
  findDocsByAssetId: async (assetId: string) => await docRepo.findByAssetId(assetId),
  findVersionsByDocId: async (docId: string) => await versionRepo.findByDocumentId(docId),
  findManifestsByVersionId: async (versionId: string) => {
    const entity = await processedDocRepo.findByVersionId(versionId);
    return entity ? [entity] : [];
  },
  getAllChunks: () => [...searchIndex.getAllChunks()]
};

const governanceHealthRepoWrapper: GovernanceHealthRepoPort = {
  saveHealth: async (record) => {
    await healthRepo.save({
      id: record.asset_id,
      health_score: record.health_score,
      quality_score: record.quality_score,
      freshness_status: record.freshness_status,
      policy_compliant: record.policy_compliant,
      explanation: record.explanation,
      updated_at: record.updated_at,
    });
  },
  findHealthByAssetId: async (assetId: string) => await healthRepo.findById(assetId)
};

const governanceAuditRepoWrapper: GovernanceAuditRepoPort = {
  saveAuditRecord: async (record) => {
    await auditRepo.save({
      id: record.id,
      asset_id: record.assetId,
      event_type: record.eventType,
      details: record.details,
      created_at: record.createdAt,
    });
  },
  findAuditRecordsByAssetId: async (assetId: string) => {
    const rows = await auditRepo.findByAssetId(assetId);
    return rows.map(r => ({
      id: r.id,
      assetId: r.asset_id,
      eventType: r.event_type,
      details: r.details,
      createdAt: r.created_at,
    }));
  }
};

const governanceOrchestrator = new GovernanceOrchestrator(
  governanceAssetRepoWrapper,
  governanceHealthRepoWrapper,
  governanceAuditRepoWrapper
);

async function initializeDefaultGovernancePolicy(): Promise<void> {
  try {
    const existing = await policyRepo.findById("policy_default");
    if (!existing) {
      await policyRepo.save({
        id: "policy_default",
        name: "Default Compliance Governance Policy",
        rules_data: JSON.stringify(defaultPolicyRules),
        created_at: new Date().toISOString(),
      });
      logger.info("Inserted default compliance governance policy rule details.");
    }
  } catch (err: any) {
    logger.error("Failed to initialize default governance policy", { error: err?.message || String(err) });
  }
}


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

      // Create new ingestion pipeline processing job automatically
      const nowStr = new Date().toISOString();
      const job: KnowledgeProcessingJobEntity = {
        id: crypto.randomUUID(),
        asset_id: assetId,
        document_id: docId,
        version_id: savedVersion.id,
        status: "Queued",
        retry_count: 0,
        error_message: null,
        created_at: nowStr,
        updated_at: nowStr,
      };
      await jobRepo.save(job);

      // Publish DocumentUploaded event
      await globalEventBus.publish({
        type: "DocumentUploaded",
        timestamp: nowStr,
        payload: { assetId, documentId: docId, versionId: savedVersion.id },
      });

      // Non-blocking trigger processing next in worker queue
      worker.processNext().catch(err => {
        logger.error("Error triggering processing run from upload:", err);
      });

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

    // GET /api/processing/jobs/:id - Check job status
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "processing" && segments[2] === "jobs" && segments[3] && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const jobId = segments[3];
      const job = await jobRepo.findById(jobId);
      if (!job) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Job "${jobId}" not found.` }]);
      }
      return sendJson(res, 200, job);
    }

    // POST /api/processing/jobs/:id/retry - Trigger retry of a failed/stuck job
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "processing" && segments[2] === "jobs" && segments[3] && segments[4] === "retry") {
      if (!hasPermission(ctx.actorRole, "knowledge:update")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:update permission required." }]);
      }
      const jobId = segments[3];
      const job = await jobRepo.findById(jobId);
      if (!job) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Job "${jobId}" not found.` }]);
      }

      job.status = "Queued";
      job.retry_count += 1;
      job.error_message = null;
      job.updated_at = new Date().toISOString();
      await jobRepo.save(job);

      await globalEventBus.publish({
        type: "RetryScheduled",
        timestamp: new Date().toISOString(),
        payload: { jobId: job.id, assetId: job.asset_id, retryCount: job.retry_count },
      });

      // Trigger background worker
      worker.processNext().catch(err => {
        logger.error("Error triggering worker on retry:", err);
      });

      return sendJson(res, 200, job);
    }

    // GET /api/assets/:id/chunks - List logical chunks for an asset (optional versionId)
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "assets" && segments[2] && segments[3] === "chunks" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const assetId = segments[2];
      const versionId = url.searchParams.get("versionId") || undefined;

      let chunks: ProcessedKnowledgeChunkEntity[] = [];

      if (versionId) {
        chunks = await chunkRepo.findByVersionId(versionId);
      } else {
        const documents = await docRepo.findByAssetId(assetId);
        for (const doc of documents) {
          const versions = await versionRepo.findByDocumentId(doc.id);
          if (versions.length > 0) {
            const latestVer = versions[0];
            const verChunks = await chunkRepo.findByVersionId(latestVer.id);
            chunks.push(...verChunks);
          }
        }
      }

      return sendJson(res, 200, chunks);
    }

    // POST /api/search - General Search
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "search" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.query) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: query." }]);
      }
      const searchRes = await searchOrchestrator.search({
        query: body.query,
        strategy: body.strategy,
        filters: body.filters,
        limit: body.limit,
        offset: body.offset,
      });
      return sendJson(res, 200, searchRes);
    }

    // POST /api/search/semantic - Force Semantic Search
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "search" && segments[2] === "semantic" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.query) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: query." }]);
      }
      const searchRes = await searchOrchestrator.search({
        query: body.query,
        strategy: "semantic",
        filters: body.filters,
        limit: body.limit,
        offset: body.offset,
      });
      return sendJson(res, 200, searchRes);
    }

    // POST /api/search/hybrid - Force Hybrid Search
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "search" && segments[2] === "hybrid" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.query) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: query." }]);
      }
      const searchRes = await searchOrchestrator.search({
        query: body.query,
        strategy: "hybrid",
        filters: body.filters,
        limit: body.limit,
        offset: body.offset,
      });
      return sendJson(res, 200, searchRes);
    }

    // GET /api/search/suggestions - Get autocomplete suggestions
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "search" && segments[2] === "suggestions" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const query = url.searchParams.get("query") || "";
      const limitVal = parseInt(url.searchParams.get("limit") || "5", 10);
      const suggestions = searchOrchestrator.getSuggestions(query, limitVal);
      return sendJson(res, 200, suggestions);
    }

    // POST /api/evidence - Compile search request into bundle
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "evidence" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.query) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: query." }]);
      }
      const bundle = await evidenceOrchestrator.compileFromQuery({
        query: body.query,
        strategy: body.strategy,
        filters: body.filters,
        limit: body.limit,
        offset: body.offset,
      });
      return sendJson(res, 200, bundle);
    }

    // POST /api/evidence/compile - Compile structured candidates array directly
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "evidence" && segments[2] === "compile" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.query || !Array.isArray(body.searchResults)) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameters: query, searchResults." }]);
      }
      const bundle = await evidenceOrchestrator.compileFromCandidates(body.query, body.searchResults);
      return sendJson(res, 200, bundle);
    }

    // GET /api/evidence/:id - Retrieve cached bundle
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "evidence" && segments[2] && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const bundleId = segments[2];
      const bundle = await bundleRepoWrapper.findBundleById(bundleId);
      if (!bundle) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Evidence bundle "${bundleId}" not found.` }]);
      }
      return sendJson(res, 200, bundle);
    }

    // GET /api/evidence/:id/manifest - Retrieve audit manifest
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "evidence" && segments[2] && segments[3] === "manifest" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const bundleId = segments[2];
      const manifest = await manifestRepoWrapper.findManifestById(bundleId);
      if (!manifest) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Evidence manifest for bundle "${bundleId}" not found.` }]);
      }
      return sendJson(res, 200, manifest);
    }

    // GET /api/knowledge - Retrieve authoritative governed asset list
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "knowledge" && !segments[2]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const assets = await assetRepo.findAll();
      const list: any[] = [];
      for (const a of assets) {
        const health = await healthRepo.findById(a.id);
        list.push({
          id: a.id,
          title: a.title,
          category: a.category,
          lifecycleState: a.lifecycle_state,
          healthScore: health ? health.health_score : 1.0,
          qualityScore: health ? health.quality_score : 1.0,
          freshnessStatus: health ? health.freshness_status : "Fresh",
          policyCompliant: health ? health.policy_compliant === 1 : true,
          updatedAt: health ? health.updated_at : a.updated_at,
        });
      }
      return sendJson(res, 200, list);
    }

    // GET /api/knowledge/:id/health - Retrieve health factors explanation details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "knowledge" && segments[2] && segments[3] === "health" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const id = segments[2];
      const health = await healthRepo.findById(id);
      if (!health) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Health record for asset "${id}" not found.` }]);
      }
      return sendJson(res, 200, {
        assetId: health.id,
        healthScore: health.health_score,
        qualityScore: health.quality_score,
        freshnessStatus: health.freshness_status,
        policyCompliant: health.policy_compliant === 1,
        explanation: health.explanation,
        updatedAt: health.updated_at,
      });
    }

    // GET /api/knowledge/:id/audit - Retrieve immutable governance audit records logs
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "knowledge" && segments[2] && segments[3] === "audit" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const id = segments[2];
      const records = await governanceAuditRepoWrapper.findAuditRecordsByAssetId(id);
      return sendJson(res, 200, records);
    }

    // GET /api/knowledge/:id/evidence - Retrieve compiled evidence bundles containing references to asset
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "knowledge" && segments[2] && segments[3] === "evidence" && !segments[4]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const id = segments[2];
      const sql = `SELECT * FROM compiled_evidence_bundles WHERE bundle_data LIKE ?;`;
      const rows = await dbClient.query<any>(sql, [`%${id}%`]);
      return sendJson(res, 200, rows.map(r => JSON.parse(r.bundle_data)));
    }

    // GET /api/knowledge/:id - Retrieve authoritative single asset details
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "knowledge" && segments[2] && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const id = segments[2];
      const asset = await assetRepo.findById(id);
      if (!asset) {
        return sendJson(res, 404, undefined, [{ code: "NOT_FOUND", message: `Asset "${id}" not found.` }]);
      }
      const health = await healthRepo.findById(id);
      return sendJson(res, 200, {
        id: asset.id,
        title: asset.title,
        category: asset.category,
        lifecycleState: asset.lifecycle_state,
        healthScore: health ? health.health_score : 1.0,
        qualityScore: health ? health.quality_score : 1.0,
        freshnessStatus: health ? health.freshness_status : "Fresh",
        policyCompliant: health ? health.policy_compliant === 1 : true,
        explanation: health ? health.explanation : "",
        updatedAt: health ? health.updated_at : asset.updated_at,
      });
    }

    // POST /api/governance/validate - Trigger governance check on single asset
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "validate" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const body = (await readJson(req)) as any;
      if (!body.assetId) {
        return sendJson(res, 400, undefined, [{ code: "INVALID_ARGUMENT", message: "Missing required body parameter: assetId." }]);
      }
      const policyRow = await policyRepo.findById("policy_default");
      const rules = policyRow ? JSON.parse(policyRow.rules_data) as PolicyRules : defaultPolicyRules;
      const result = await governanceOrchestrator.evaluateAsset(body.assetId, rules);
      return sendJson(res, 200, result);
    }

    // POST /api/governance/recheck - Run global governance cycle rechecking all assets
    if (req.method === "POST" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "recheck" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const policyRow = await policyRepo.findById("policy_default");
      const rules = policyRow ? JSON.parse(policyRow.rules_data) as PolicyRules : defaultPolicyRules;
      const manifest = await governanceOrchestrator.evaluateAll(rules);
      return sendJson(res, 200, manifest);
    }

    // GET /api/governance/policies - Retrieve current policy rules data
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "policies" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const policyRow = await policyRepo.findById("policy_default");
      const rules = policyRow ? JSON.parse(policyRow.rules_data) as PolicyRules : defaultPolicyRules;
      return sendJson(res, 200, rules);
    }

    // GET /api/governance/statistics - Retrieve general counts and health averages
    if (req.method === "GET" && segments[0] === "api" && segments[1] === "governance" && segments[2] === "statistics" && !segments[3]) {
      if (!hasPermission(ctx.actorRole, "knowledge:read")) {
        return sendJson(res, 403, undefined, [{ code: "FORBIDDEN", message: "knowledge:read permission required." }]);
      }
      const healths = await healthRepo.findAll();
      const total = healths.length;
      const avgHealth = total > 0 ? healths.reduce((sum, h) => sum + h.health_score, 0) / total : 1.0;
      const nonCompliant = healths.filter(h => h.policy_compliant === 0).length;
      return sendJson(res, 200, {
        totalAssetsGoverned: total,
        averageHealthScore: parseFloat(avgHealth.toFixed(3)),
        nonCompliantAssetsCount: nonCompliant,
      });
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

    server.listen(PORT, async () => {
      logger.info("Knowledge Platform Service workstation started.", {
        port: PORT,
        databaseFile: DB_FILE,
        storagePath: STORAGE_PATH,
      });

      // Hydrate query TF-IDF vectors from storage
      await initializeSearchIndex();

      // Hydrate default governance compliance rules
      await initializeDefaultGovernancePolicy();

      // Start background worker polling loop
      worker.start();

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
  
  worker.stop();
  await dbClient.close();
  server.close(() => {
    process.exit(0);
  });
});

if (process.argv[1]?.endsWith("index.js")) {
  bootstrap();
}

export { server, dbClient, assetRepo, docRepo, versionRepo, storageAdapter, jobRepo, processedDocRepo, chunkRepo, worker, searchIndex, searchOrchestrator, evidenceOrchestrator, governanceOrchestrator };



