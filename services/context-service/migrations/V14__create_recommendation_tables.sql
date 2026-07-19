-- Migration: Create Recommendation Foundation tables
CREATE TABLE IF NOT EXISTS decision_packages (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  package_data_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
