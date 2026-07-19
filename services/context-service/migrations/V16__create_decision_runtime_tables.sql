-- Migration: Create Decision Runtime Platform tables
CREATE TABLE IF NOT EXISTS decision_runtime_states (
  id TEXT PRIMARY KEY,
  lifecycle_state TEXT NOT NULL,
  approver TEXT,
  reviewed_at TEXT,
  timeline_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decision_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_data_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
