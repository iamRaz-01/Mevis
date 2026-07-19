-- Enriched Knowledge Repository Schema Migrations

DROP TABLE IF EXISTS knowledge_versions;
DROP TABLE IF EXISTS knowledge_assets;

CREATE TABLE IF NOT EXISTS knowledge_assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  source TEXT,
  language TEXT,
  region TEXT,
  audience TEXT,
  confidentiality TEXT,
  approval_date TEXT,
  expiration_date TEXT,
  retention_policy TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES knowledge_assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  semver TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  storage_uri TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  changelog TEXT,
  parent_version_id TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);
