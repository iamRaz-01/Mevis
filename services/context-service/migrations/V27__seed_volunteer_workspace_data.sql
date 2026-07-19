-- Seed default organization, team, and volunteer for the workspace
INSERT OR IGNORE INTO organizations (id, name, parent_id, created_at)
VALUES ('ORG-01', 'FIFA Operations Group', NULL, '2026-07-19T00:00:00Z');

INSERT OR IGNORE INTO teams (id, name, organization_id, capabilities_json, created_at)
VALUES ('TEAM-01', 'Medical Response Team', 'ORG-01', '["MEDICAL", "FIRST_AID", "PATROL"]', '2026-07-19T00:00:00Z');

INSERT OR IGNORE INTO venues (id, name, created_at)
VALUES ('VENUE-01', 'Lusail Stadium', '2026-07-19T00:00:00Z');

INSERT OR IGNORE INTO venue_zones (id, venue_id, name)
VALUES ('ZONE-01', 'VENUE-01', 'Zone A');

INSERT OR IGNORE INTO venue_gates (id, venue_id, zone_id, name)
VALUES ('GATE-01', 'VENUE-01', 'ZONE-01', 'Gate A1');

-- Ensure default volunteer record exists
INSERT OR IGNORE INTO volunteers (id, name, email, team_id, organization_id, certifications_json, languages_json, created_at)
VALUES (
  'u-vol',
  'Abdul Al-Farooq',
  'abdul.lead@mevis.io',
  'TEAM-01',
  'ORG-01',
  '["FIRST_AID", "CPR", "AED"]',
  '["Arabic", "English", "French"]',
  '2026-07-19T00:00:00Z'
);

-- Seed an active incident
INSERT OR IGNORE INTO incidents (id, severity, location, status, description, created_at, updated_at)
VALUES (
  'INC-01',
  'HIGH',
  'Gate A1 Bottleneck',
  'ASSIGNED',
  'Crowd surge bottleneck causing minor distress. Medical standby requested.',
  '2026-07-19T08:10:00Z',
  '2026-07-19T08:15:00Z'
);

-- Seed assignment linking u-vol to the incident
INSERT OR IGNORE INTO assignments (id, assignee_id, target_id, reason, status, created_at, updated_at)
VALUES (
  'ASN-VOL-01',
  'u-vol',
  'INC-01',
  'Emergency medical responder standby and crowd flow observation.',
  'ACTIVE',
  '2026-07-19T08:15:00Z',
  '2026-07-19T08:15:00Z'
);

-- Seed tasks for u-vol
INSERT OR IGNORE INTO tasks (id, title, description, status, priority, created_at, updated_at)
VALUES (
  'TSK-01',
  'Equipment Inspection',
  'Verify first-aid kit readiness, AED batteries check, and communication headset sync.',
  'CREATED',
  'HIGH',
  '2026-07-19T08:00:00Z',
  '2026-07-19T08:00:00Z'
);

INSERT OR IGNORE INTO tasks (id, title, description, status, priority, created_at, updated_at)
VALUES (
  'TSK-02',
  'Medical Patrol Loop',
  'Perform medical sweep patrols around Gate A1 outer perimeter.',
  'CREATED',
  'MEDIUM',
  '2026-07-19T08:30:00Z',
  '2026-07-19T08:30:00Z'
);

INSERT OR IGNORE INTO tasks (id, title, description, status, priority, created_at, updated_at)
VALUES (
  'TSK-03',
  'Incident Standby',
  'Standby at Medical Station Alpha for potential casualties.',
  'CREATED',
  'HIGH',
  '2026-07-19T08:45:00Z',
  '2026-07-19T08:45:00Z'
);

-- Seed initial notifications
INSERT OR IGNORE INTO notifications (id, title, body, priority, source_event, recipient, timestamp, delivery_state, acknowledged_at)
VALUES (
  'NTF-01',
  'Shift Started',
  'Welcome to your shift. Please check in using the shift card check-in action.',
  'INFO',
  'ShiftStarted',
  'u-vol',
  '2026-07-19T08:00:00Z',
  'DELIVERED',
  NULL
);

INSERT OR IGNORE INTO notifications (id, title, body, priority, source_event, recipient, timestamp, delivery_state, acknowledged_at)
VALUES (
  'NTF-02',
  'Crowd Advisory',
  'Gate A1 experiencing high incoming flow. Maintain high vigilance.',
  'HIGH',
  'CrowdAlert',
  'u-vol',
  '2026-07-19T08:20:00Z',
  'DELIVERED',
  NULL
);
