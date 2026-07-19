-- Migration: Create World Model Entities and Relationships tables
CREATE TABLE IF NOT EXISTS world_entities (
  id TEXT PRIMARY KEY, -- globally unique world identifier, e.g. world:entity:<uuid>
  entity_type TEXT NOT NULL, -- Volunteer, Venue, Gate, Checkpoint, Medical Team, Security Team, Incident Type, Resource, Vehicle, Equipment, Zone, Fan Area
  display_name TEXT NOT NULL,
  parent_entity_id TEXT, -- nullable self-reference to build entity hierarchies
  identity_ref TEXT, -- maps to User / Actor IDs in Identity platform
  metadata_json TEXT NOT NULL, -- JSON serialized capabilities, timeline parameters
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_entity_id) REFERENCES world_entities (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS world_relationships (
  id TEXT PRIMARY KEY,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- ASSIGNED_TO, RESPONSIBLE_FOR, CONNECTED_TO, etc.
  metadata_json TEXT NOT NULL, -- JSON serialized properties
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_entity_id) REFERENCES world_entities (id) ON DELETE CASCADE,
  FOREIGN KEY (target_entity_id) REFERENCES world_entities (id) ON DELETE CASCADE
);
