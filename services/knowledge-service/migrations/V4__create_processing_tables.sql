-- Create Knowledge Processing Pipeline Tables

CREATE TABLE IF NOT EXISTS knowledge_processing_jobs (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  status TEXT NOT NULL, -- Queued | Downloading | Parsing | Cleaning | Normalizing | Chunking | Persisting | Completed | Failed
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS processed_documents (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  parser_used TEXT NOT NULL,
  detected_language TEXT NOT NULL,
  chunk_count INTEGER NOT NULL,
  character_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  processing_version TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  warnings TEXT NOT NULL, -- JSON serialized string list
  processed_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES knowledge_documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS processed_knowledge_chunks (
  id TEXT PRIMARY KEY,
  processed_document_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  section_title TEXT,
  parent_section TEXT,
  heading_level INTEGER,
  previous_chunk_id TEXT,
  next_chunk_id TEXT,
  language TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  character_count INTEGER NOT NULL,
  metadata TEXT NOT NULL, -- JSON serialized schema dict
  FOREIGN KEY (processed_document_id) REFERENCES processed_documents(id) ON DELETE CASCADE
);
