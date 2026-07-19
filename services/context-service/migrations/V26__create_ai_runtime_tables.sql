-- Migration V26: AI Experience Runtime Platform Tables
-- Provides the persistence layer for the unified AI Experience Runtime:
-- requests, routing, streaming, analytics, audit, and playback.

CREATE TABLE IF NOT EXISTS ai_requests (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  capability TEXT NOT NULL,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  session_id TEXT,
  latency_ms INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_experience_routes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  routed_to TEXT NOT NULL,
  routing_reason TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_streaming_sessions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  opened_at TEXT NOT NULL,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS ai_usage_metrics (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  prompt_size INTEGER NOT NULL DEFAULT 0,
  latency_gateway_ms INTEGER NOT NULL DEFAULT 0,
  latency_reasoning_ms INTEGER NOT NULL DEFAULT 0,
  latency_generation_ms INTEGER NOT NULL DEFAULT 0,
  latency_trust_ms INTEGER NOT NULL DEFAULT 0,
  latency_total_ms INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_prompt_metrics (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  prompt_length INTEGER NOT NULL DEFAULT 0,
  composition_time_ms INTEGER NOT NULL DEFAULT 0,
  context_window_pct REAL NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  request_id TEXT,
  actor_id TEXT,
  capability TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_audit_records (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  capability TEXT NOT NULL,
  model_used TEXT,
  evidence_attached INTEGER NOT NULL DEFAULT 0,
  trust_package_id TEXT,
  response_status TEXT NOT NULL,
  policy_checks_passed INTEGER NOT NULL DEFAULT 1,
  immutable_hash TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_playback_records (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  user_request TEXT NOT NULL,
  reasoning_snapshot TEXT NOT NULL DEFAULT '{}',
  generation_snapshot TEXT NOT NULL DEFAULT '{}',
  trust_snapshot TEXT NOT NULL DEFAULT '{}',
  delivery_metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
