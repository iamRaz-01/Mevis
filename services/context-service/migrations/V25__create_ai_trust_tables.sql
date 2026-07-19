-- Migration: Create AI Trust Runtime tables

CREATE TABLE IF NOT EXISTS trust_packages (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES generation_results(id) ON DELETE CASCADE,
  overall_confidence REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  trust_id TEXT NOT NULL REFERENCES trust_packages(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS response_citations (
  id TEXT PRIMARY KEY,
  trust_id TEXT NOT NULL REFERENCES trust_packages(id) ON DELETE CASCADE,
  reference_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reasoning_traces (
  id TEXT PRIMARY KEY,
  trust_id TEXT NOT NULL REFERENCES trust_packages(id) ON DELETE CASCADE,
  step_description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS confidence_scores (
  id TEXT PRIMARY KEY,
  trust_id TEXT NOT NULL REFERENCES trust_packages(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  score REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS response_feedback (
  id TEXT PRIMARY KEY,
  trust_id TEXT NOT NULL REFERENCES trust_packages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL
);
