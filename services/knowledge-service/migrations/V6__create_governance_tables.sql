-- Migration: Create governance policies, audits, and health records tables
CREATE TABLE IF NOT EXISTS governance_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rules_data TEXT NOT NULL, -- JSON serialized compliance thresholds/requirements
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_audit_records (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- e.g., ValidationPassed, PolicyViolation, HealthScoreUpdated
  details TEXT NOT NULL,    -- JSON description
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_health_records (
  id TEXT PRIMARY KEY,
  health_score REAL NOT NULL,
  quality_score REAL NOT NULL,
  freshness_status TEXT NOT NULL, -- 'Fresh', 'Review Soon', 'Stale', 'Expired'
  policy_compliant INTEGER NOT NULL, -- 0 or 1
  explanation TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
