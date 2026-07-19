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
