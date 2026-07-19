-- Migration: Create Governance Foundation tables
CREATE TABLE IF NOT EXISTS trusted_decisions (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  decision_package_id TEXT NOT NULL,
  decision_data_json TEXT NOT NULL,
  governance_manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
