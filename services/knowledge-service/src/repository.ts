import {
  RelationalRepository,
  type Identifiable,
  type DatabaseClient,
} from "@mevis/platform-data";

export interface KnowledgeAssetEntity extends Identifiable<string> {
  id: string; // matches asset_id
  title: string;
  domain: string;
  category: string;
  tags: string; // serialized JSON array
  owner_id: string;
  lifecycle_state: string; // Draft | Review | Approved | Published | Deprecated | Archived
  created_at: string;
  updated_at: string;
  version: number;
}

export interface KnowledgeVersionEntity extends Identifiable<string> {
  id: string; // UUID
  asset_id: string;
  semver: string; // Major.Minor.Patch
  storage_id: string;
  changelog: string;
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
        "created_at",
        "updated_at",
        "version",
      ],
      "KnowledgeAsset"
    );
  }
}

export class KnowledgeVersionRepository extends RelationalRepository<KnowledgeVersionEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "knowledge_versions",
      ["id", "asset_id", "semver", "storage_id", "changelog", "created_at", "created_by"],
      "KnowledgeVersion"
    );
  }

  async findByAssetId(assetId: string): Promise<KnowledgeVersionEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE asset_id = ? ORDER BY created_at DESC;`;
    return await this.db.query<KnowledgeVersionEntity>(sql, [assetId]);
  }

  async findSpecificVersion(assetId: string, semver: string): Promise<KnowledgeVersionEntity | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE asset_id = ? AND semver = ? LIMIT 1;`;
    const rows = await this.db.query<KnowledgeVersionEntity>(sql, [assetId, semver]);
    return rows[0] || null;
  }
}
