-- Migration: Create Context Validation tables
CREATE TABLE IF NOT EXISTS context_validation_results (
  id TEXT PRIMARY KEY, -- package ID
  health_status TEXT NOT NULL, -- TRUSTED, UNTRUSTED
  health_score REAL NOT NULL,
  manifest_json TEXT NOT NULL, -- JSON serialized validation stages, consistency, completeness, freshness details
  created_at TEXT NOT NULL
);
