-- Migration: Create Operational Runtime Audit table

CREATE TABLE IF NOT EXISTS operational_audit_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  actor TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  reason TEXT
);
