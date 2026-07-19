-- Migration: Create Decision Foundation tables
CREATE TABLE IF NOT EXISTS decision_candidates (
  id TEXT PRIMARY KEY,
  decision_type TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL, -- DETECTED, REGISTERED, CONTEXT_ATTACHED, CONSTRAINTS_ATTACHED, READY_FOR_REASONING
  context_json TEXT NOT NULL,
  constraints_json TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
