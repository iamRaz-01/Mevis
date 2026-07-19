-- Migration: Create AI Experience Foundation tables

CREATE TABLE IF NOT EXISTS ai_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  active_incident_id TEXT,
  active_venue_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_text TEXT NOT NULL,
  scope TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tone TEXT NOT NULL,
  capabilities_json TEXT NOT NULL,
  response_constraints TEXT NOT NULL
);
