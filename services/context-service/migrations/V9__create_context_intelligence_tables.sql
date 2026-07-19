-- Migration: Create Context Assembly and Situations tables
CREATE TABLE IF NOT EXISTS context_packages (
  id TEXT PRIMARY KEY, -- package ID
  situation_id TEXT NOT NULL,
  package_data_json TEXT NOT NULL, -- JSON serialized facts, relationships, evidence, metadata
  manifest_json TEXT NOT NULL, -- JSON serialized sources, selected entities, compression stats
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS context_situations (
  id TEXT PRIMARY KEY, -- situation ID
  title TEXT NOT NULL, -- e.g., Medical Emergency
  severity TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  status TEXT NOT NULL, -- ACTIVE, RESOLVED
  entities_involved TEXT NOT NULL, -- JSON serialized array of involved entity IDs
  created_at TEXT NOT NULL
);
