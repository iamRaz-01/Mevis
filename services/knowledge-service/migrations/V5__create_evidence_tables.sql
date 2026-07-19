-- Migration: Create compiled evidence and manifests tables
CREATE TABLE IF NOT EXISTS compiled_evidence_bundles (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  bundle_data TEXT NOT NULL, -- JSON serialized evidence items, citations, confidence, etc.
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_manifests (
  id TEXT PRIMARY KEY, -- Matches the bundle ID
  query TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  retrieved_count INTEGER NOT NULL,
  validated_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  merged_count INTEGER NOT NULL,
  evidence_count INTEGER NOT NULL,
  confidence_avg REAL NOT NULL,
  created_at TEXT NOT NULL
);
