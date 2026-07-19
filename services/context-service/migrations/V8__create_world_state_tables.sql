-- Migration: Create World State synchronization tables
CREATE TABLE IF NOT EXISTS world_ingested_events (
  id TEXT PRIMARY KEY, -- event ID for idempotency deduplication
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  source TEXT NOT NULL,
  event_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS world_latest_states (
  id TEXT PRIMARY KEY, -- entity_id
  state_data TEXT NOT NULL, -- JSON serialized dynamic state (location, status, battery, etc.)
  last_event_id TEXT NOT NULL,
  last_event_time TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS world_state_history (
  id TEXT PRIMARY KEY, -- unique log entry ID (UUID)
  entity_id TEXT NOT NULL,
  state_data TEXT NOT NULL, -- JSON serialized dynamic state
  event_id TEXT NOT NULL,
  event_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS world_snapshots (
  id TEXT PRIMARY KEY, -- unique snapshot ID (UUID)
  snapshot_time TEXT NOT NULL,
  snapshot_data TEXT NOT NULL, -- JSON serialized entire world state map
  created_at TEXT NOT NULL
);
