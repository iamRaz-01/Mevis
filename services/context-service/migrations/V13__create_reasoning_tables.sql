-- Migration: Create Reasoning Foundation tables
CREATE TABLE IF NOT EXISTS decision_analyses (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL,
  analysis_data_json TEXT NOT NULL,
  reasoning_trace_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
