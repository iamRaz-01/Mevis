import {
  RelationalRepository,
  type Identifiable,
  type DatabaseClient,
} from "@mevis/platform-data";

export interface KnowledgeAssetEntity extends Identifiable<string> {
  id: string; // asset_id
  title: string;
  domain: string;
  category: string;
  tags: string; // serialized JSON list
  owner_id: string;
  lifecycle_state: string; // Draft | Submitted | Under Review | Approved | Published | Deprecated | Archived
  source?: string | null;
  language?: string | null;
  region?: string | null;
  audience?: string | null;
  confidentiality?: string | null;
  approval_date?: string | null;
  expiration_date?: string | null;
  retention_policy?: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface KnowledgeDocumentEntity extends Identifiable<string> {
  id: string; // document_id (UUID)
  asset_id: string;
  name: string;
  mime_type: string;
  created_at: string;
}

export interface DocumentVersionEntity extends Identifiable<string> {
  id: string; // version_id (UUID)
  document_id: string;
  semver: string;
  version_number: number;
  storage_uri: string;
  file_size: number;
  checksum_sha256: string;
  changelog?: string | null;
  parent_version_id?: string | null;
  created_at: string;
  created_by: string;
}

export class KnowledgeAssetRepository extends RelationalRepository<KnowledgeAssetEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "knowledge_assets",
      [
        "id",
        "title",
        "domain",
        "category",
        "tags",
        "owner_id",
        "lifecycle_state",
        "source",
        "language",
        "region",
        "audience",
        "confidentiality",
        "approval_date",
        "expiration_date",
        "retention_policy",
        "created_at",
        "updated_at",
        "version",
      ],
      "KnowledgeAsset"
    );
  }

  async findWithFilters(filters: {
    category?: string;
    owner_id?: string;
    tag?: string;
    lifecycle_state?: string;
  }): Promise<KnowledgeAssetEntity[]> {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params: unknown[] = [];

    if (filters.category) {
      sql += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.owner_id) {
      sql += " AND owner_id = ?";
      params.push(filters.owner_id);
    }
    if (filters.lifecycle_state) {
      sql += " AND lifecycle_state = ?";
      params.push(filters.lifecycle_state);
    }

    const rows = await this.db.query<KnowledgeAssetEntity>(sql, params);

    // Filter by tag in memory since tags are JSON stringified list
    if (filters.tag) {
      return rows.filter((asset) => {
        try {
          const tagsList = JSON.parse(asset.tags) as string[];
          return tagsList.includes(filters.tag!);
        } catch {
          return false;
        }
      });
    }

    return rows;
  }
}

export class KnowledgeDocumentRepository extends RelationalRepository<KnowledgeDocumentEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "knowledge_documents",
      ["id", "asset_id", "name", "mime_type", "created_at"],
      "KnowledgeDocument"
    );
  }

  async findByAssetId(assetId: string): Promise<KnowledgeDocumentEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE asset_id = ?;`;
    return await this.db.query<KnowledgeDocumentEntity>(sql, [assetId]);
  }
}

export class DocumentVersionRepository extends RelationalRepository<DocumentVersionEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "document_versions",
      [
        "id",
        "document_id",
        "semver",
        "version_number",
        "storage_uri",
        "file_size",
        "checksum_sha256",
        "changelog",
        "parent_version_id",
        "created_at",
        "created_by",
      ],
      "DocumentVersion"
    );
  }

  async findByDocumentId(documentId: string): Promise<DocumentVersionEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE document_id = ? ORDER BY version_number DESC;`;
    return await this.db.query<DocumentVersionEntity>(sql, [documentId]);
  }

  async findSpecificVersion(documentId: string, semver: string): Promise<DocumentVersionEntity | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE document_id = ? AND semver = ? LIMIT 1;`;
    const rows = await this.db.query<DocumentVersionEntity>(sql, [documentId, semver]);
    return rows[0] || null;
  }

  async findByChecksum(checksumSha256: string): Promise<DocumentVersionEntity | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE checksum_sha256 = ? LIMIT 1;`;
    const rows = await this.db.query<DocumentVersionEntity>(sql, [checksumSha256]);
    return rows[0] || null;
  }
}

export interface KnowledgeProcessingJobEntity extends Identifiable<string> {
  id: string;
  asset_id: string;
  document_id: string;
  version_id: string;
  status: string; // Queued | Downloading | Parsing | Cleaning | Normalizing | Chunking | Persisting | Completed | Failed
  retry_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessedDocumentEntity extends Identifiable<string> {
  id: string;
  asset_id: string;
  document_id: string;
  version_id: string;
  parser_used: string;
  detected_language: string;
  chunk_count: number;
  character_count: number;
  word_count: number;
  checksum_sha256: string;
  processing_version: string;
  duration_ms: number;
  warnings: string; // serialized JSON list
  processed_at: string;
}

export interface ProcessedKnowledgeChunkEntity extends Identifiable<string> {
  id: string;
  processed_document_id: string;
  asset_id: string;
  version_id: string;
  chunk_index: number;
  text: string;
  section_title?: string | null;
  parent_section?: string | null;
  heading_level?: number | null;
  previous_chunk_id?: string | null;
  next_chunk_id?: string | null;
  language: string;
  word_count: number;
  character_count: number;
  metadata: string; // serialized JSON string
}

export class KnowledgeProcessingJobRepository extends RelationalRepository<KnowledgeProcessingJobEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "knowledge_processing_jobs",
      ["id", "asset_id", "document_id", "version_id", "status", "retry_count", "error_message", "created_at", "updated_at"],
      "KnowledgeProcessingJob"
    );
  }

  async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    const sql = `
      UPDATE ${this.tableName}
      SET status = ?, error_message = ?, updated_at = ?
      WHERE id = ?;
    `;
    await this.db.execute(sql, [status, errorMessage || null, new Date().toISOString(), jobId]);
  }

  async getNextQueuedJob(): Promise<KnowledgeProcessingJobEntity | null> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE status = 'Queued'
      ORDER BY created_at ASC
      LIMIT 1;
    `;
    const rows = await this.db.query<KnowledgeProcessingJobEntity>(sql);
    return rows[0] || null;
  }

  async findByVersionId(versionId: string): Promise<KnowledgeProcessingJobEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE version_id = ?;`;
    return await this.db.query<KnowledgeProcessingJobEntity>(sql, [versionId]);
  }
}

export class ProcessedDocumentRepository extends RelationalRepository<ProcessedDocumentEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "processed_documents",
      [
        "id",
        "asset_id",
        "document_id",
        "version_id",
        "parser_used",
        "detected_language",
        "chunk_count",
        "character_count",
        "word_count",
        "checksum_sha256",
        "processing_version",
        "duration_ms",
        "warnings",
        "processed_at",
      ],
      "ProcessedDocument"
    );
  }

  async findByVersionId(versionId: string): Promise<ProcessedDocumentEntity | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE version_id = ? LIMIT 1;`;
    const rows = await this.db.query<ProcessedDocumentEntity>(sql, [versionId]);
    return rows[0] || null;
  }

  async saveProcessedDocument(entity: ProcessedDocumentEntity): Promise<void> {
    await this.save(entity);
  }
}

export class ProcessedKnowledgeChunkRepository extends RelationalRepository<ProcessedKnowledgeChunkEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "processed_knowledge_chunks",
      [
        "id",
        "processed_document_id",
        "asset_id",
        "version_id",
        "chunk_index",
        "text",
        "section_title",
        "parent_section",
        "heading_level",
        "previous_chunk_id",
        "next_chunk_id",
        "language",
        "word_count",
        "character_count",
        "metadata",
      ],
      "ProcessedKnowledgeChunk"
    );
  }

  async saveChunks(chunks: ProcessedKnowledgeChunkEntity[]): Promise<void> {
    for (const chunk of chunks) {
      await this.save(chunk);
    }
  }

  async findByVersionId(versionId: string): Promise<ProcessedKnowledgeChunkEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE version_id = ? ORDER BY chunk_index ASC;`;
    return await this.db.query<ProcessedKnowledgeChunkEntity>(sql, [versionId]);
  }
}

export interface CompiledEvidenceBundleEntity {
  id: string;
  query: string;
  bundle_data: string;
  created_at: string;
}

export interface EvidenceManifestEntity {
  id: string;
  query: string;
  execution_time_ms: number;
  retrieved_count: number;
  validated_count: number;
  rejected_count: number;
  merged_count: number;
  evidence_count: number;
  confidence_avg: number;
  created_at: string;
}

export class CompiledEvidenceBundleRepository extends RelationalRepository<CompiledEvidenceBundleEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "compiled_evidence_bundles",
      ["id", "query", "bundle_data", "created_at"],
      "CompiledEvidenceBundle"
    );
  }
}

export class EvidenceManifestRepository extends RelationalRepository<EvidenceManifestEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "evidence_manifests",
      [
        "id",
        "query",
        "execution_time_ms",
        "retrieved_count",
        "validated_count",
        "rejected_count",
        "merged_count",
        "evidence_count",
        "confidence_avg",
        "created_at",
      ],
      "EvidenceManifest"
    );
  }
}

export interface GovernancePolicyEntity {
  id: string;
  name: string;
  rules_data: string;
  created_at: string;
}

export interface GovernanceAuditRecordEntity {
  id: string;
  asset_id: string;
  event_type: string;
  details: string;
  created_at: string;
}

export interface GovernanceHealthRecordEntity extends Identifiable<string> {
  id: string; // matches asset_id (primary key)
  health_score: number;
  quality_score: number;
  freshness_status: string;
  policy_compliant: number;
  explanation: string;
  updated_at: string;
}

export class GovernancePolicyRepository extends RelationalRepository<GovernancePolicyEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "governance_policies", ["id", "name", "rules_data", "created_at"], "GovernancePolicy");
  }
}

export class GovernanceAuditRecordRepository extends RelationalRepository<GovernanceAuditRecordEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "governance_audit_records",
      ["id", "asset_id", "event_type", "details", "created_at"],
      "GovernanceAuditRecord"
    );
  }

  async findByAssetId(assetId: string): Promise<GovernanceAuditRecordEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE asset_id = ? ORDER BY created_at DESC;`;
    return await this.db.query<GovernanceAuditRecordEntity>(sql, [assetId]);
  }
}

export class GovernanceHealthRecordRepository extends RelationalRepository<GovernanceHealthRecordEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "governance_health_records",
      ["id", "health_score", "quality_score", "freshness_status", "policy_compliant", "explanation", "updated_at"],
      "GovernanceHealthRecord"
    );
  }
}


