-- Migration: Create Digital Twin tables
CREATE TABLE IF NOT EXISTS digital_twin_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_data_json TEXT NOT NULL, -- Serialized complete DigitalTwinContext
  created_at TEXT NOT NULL
);
