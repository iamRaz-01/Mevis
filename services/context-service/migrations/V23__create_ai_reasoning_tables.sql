-- Migration: Create AI Reasoning Orchestrator tables

CREATE TABLE IF NOT EXISTS reasoning_plans (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reasoning_steps (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES reasoning_plans(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  target_engine TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS detected_intents (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TEXT NOT NULL
);
