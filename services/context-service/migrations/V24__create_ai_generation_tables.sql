-- Migration: Create AI Generation Runtime tables

CREATE TABLE IF NOT EXISTS generation_requests (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES reasoning_plans(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS generation_results (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES generation_requests(id) ON DELETE CASCADE,
  generated_text TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_invocations (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES generation_requests(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  prompt_sent TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms REAL NOT NULL
);
