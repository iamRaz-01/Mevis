-- Knowledge Repository Schema Migrations

CREATE TABLE IF NOT EXISTS knowledge_assets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS knowledge_versions (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  semver TEXT NOT NULL,
  storage_id TEXT NOT NULL,
  changelog TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES knowledge_assets(id) ON DELETE CASCADE
);
