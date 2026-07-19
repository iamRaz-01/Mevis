-- Migration: Create Operational Intelligence Integration tables

CREATE TABLE IF NOT EXISTS integration_event_logs (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS integration_retry_queue (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES integration_event_logs(id),
  retry_count INTEGER NOT NULL,
  next_attempt TEXT NOT NULL
);
