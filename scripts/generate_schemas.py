import json
import os

SCHEMAS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../ontology/schemas"))
os.makedirs(SCHEMAS_DIR, exist_ok=True)

def write_schema(name, schema_dict):
    filepath = os.path.join(SCHEMAS_DIR, f"{name}.schema.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(schema_dict, f, indent=2)
    print(f"Generated {name}.schema.json")

# Define all JSON schemas (Draft-07 compliant)

# 1. Volunteer
write_schema("volunteer", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Volunteer",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^vol_[a-zA-Z0-9_-]+$" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "role_scope": { "type": "string", "enum": ["VOLUNTEER"] },
    "assigned_gate_id": { "type": ["string", "null"] },
    "language_preferences": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["id", "first_name", "last_name", "role_scope", "language_preferences"],
  "additionalProperties": False
})

# 2. Supervisor
write_schema("supervisor", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Supervisor",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^sup_[a-zA-Z0-9_-]+$" },
    "first_name": { "type": "string" },
    "last_name": { "type": "string" },
    "assigned_zone_id": { "type": "string" }
  },
  "required": ["id", "first_name", "last_name", "assigned_zone_id"],
  "additionalProperties": False
})

# 3. Coordinator
write_schema("coordinator", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Coordinator",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^coo_[a-zA-Z0-9_-]+$" },
    "station_id": { "type": "string" }
  },
  "required": ["id", "station_id"],
  "additionalProperties": False
})

# 4. Venue
write_schema("venue", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Venue",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^ven_[a-zA-Z0-9_-]+$" },
    "name": { "type": "string" },
    "location": { "type": "string" }
  },
  "required": ["id", "name", "location"],
  "additionalProperties": False
})

# 5. Zone
write_schema("zone", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Zone",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^zon_[a-zA-Z0-9_-]+$" },
    "venue_id": { "type": "string" },
    "name": { "type": "string" }
  },
  "required": ["id", "venue_id", "name"],
  "additionalProperties": False
})

# 6. Gate
write_schema("gate", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Gate",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^gat_[a-zA-Z0-9_-]+$" },
    "zone_id": { "type": "string" },
    "status": { "type": "string", "enum": ["Open", "Restrictive", "Closed"] }
  },
  "required": ["id", "zone_id", "status"],
  "additionalProperties": False
})

# 7. Incident
write_schema("incident", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Incident",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^inc_[0-9]{4}_[0-9]+$" },
    "venue_id": { "type": "string" },
    "zone_id": { "type": "string" },
    "gate_id": { "type": ["string", "null"] },
    "classification": { 
      "type": "string", 
      "enum": ["LOST_CHILD", "MEDICAL_EMERGENCY", "CROWD_SURGE", "GATE_CLOSURE", "SEVERE_WEATHER", "TRANSPORT_DISRUPTION", "SECURITY_BREACH", "ACCESSIBILITY_BOTTLENECK"] 
    },
    "severity": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    "status": { 
      "type": "string", 
      "enum": ["Detected", "Assessed", "RecommendationReady", "HumanApproved", "HumanRejected", "Actioned", "Resolved", "Learned"] 
    }
  },
  "required": ["id", "venue_id", "zone_id", "classification", "severity", "status"],
  "additionalProperties": False
})

# 8. Shift
write_schema("shift", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Shift",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^shf_[a-zA-Z0-9_-]+$" },
    "start_time": { "type": "string", "format": "date-time" },
    "end_time": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "start_time", "end_time"],
  "additionalProperties": False
})

# 9. Task
write_schema("task", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Task",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^tsk_[a-zA-Z0-9_-]+$" },
    "incident_id": { "type": "string" },
    "assigned_volunteer_id": { "type": "string" },
    "description": { "type": "string" },
    "status": { "type": "string", "enum": ["Assigned", "Acknowledged", "InProgress", "Completed", "Failed"] }
  },
  "required": ["id", "incident_id", "assigned_volunteer_id", "description", "status"],
  "additionalProperties": False
})

# 10. Recommendation
write_schema("recommendation", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Recommendation",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^rec_[a-zA-Z0-9_-]+$" },
    "incident_id": { "type": "string" },
    "proposed_actions": { 
      "type": "array", 
      "items": { "type": "string" } 
    },
    "supporting_evidence_ids": { 
      "type": "array", 
      "items": { "type": "string" } 
    },
    "confidence_score": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
  },
  "required": ["id", "incident_id", "proposed_actions", "supporting_evidence_ids", "confidence_score"],
  "additionalProperties": False
})

# 11. SOP
write_schema("sop", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SOP",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^sop_[a-zA-Z0-9_-]+$" },
    "title": { "type": "string" },
    "version": { "type": "string" }
  },
  "required": ["id", "title", "version"],
  "additionalProperties": False
})

# 12. Policy
write_schema("policy", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Policy",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^pol_[a-zA-Z0-9_-]+$" },
    "name": { "type": "string" },
    "type": { "type": "string", "enum": ["SAFETY", "AUDIT", "COMPLIANCE"] }
  },
  "required": ["id", "name", "type"],
  "additionalProperties": False
})

# 13. Evidence
write_schema("evidence", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Evidence",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^evd_[a-zA-Z0-9_-]+$" },
    "source_type": { "type": "string", "enum": ["SOP", "RELATIONAL_FACT"] },
    "content": { "type": "string" }
  },
  "required": ["id", "source_type", "content"],
  "additionalProperties": False
})

# 14. Observation
write_schema("observation", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Observation",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^obs_[a-zA-Z0-9_-]+$" },
    "source": { "type": "string", "enum": ["VOLUNTEER", "SENSOR"] },
    "raw_content": { "type": "string" }
  },
  "required": ["id", "source", "raw_content"],
  "additionalProperties": False
})

# 15. Decision
write_schema("decision", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Decision",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^dec_[a-zA-Z0-9_-]+$" },
    "operator_id": { "type": "string" },
    "recommendation_id": { "type": "string" },
    "action_taken": { "type": "string" }
  },
  "required": ["id", "operator_id", "recommendation_id", "action_taken"],
  "additionalProperties": False
})

# 16. Context
write_schema("context", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Context",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^ctx_[a-zA-Z0-9_-]+$" },
    "timestamp": { "type": "string", "format": "date-time" },
    "incident_id": { "type": "string" }
  },
  "required": ["id", "timestamp", "incident_id"],
  "additionalProperties": False
})

# 17. Approval
write_schema("approval", {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Approval",
  "type": "object",
  "properties": {
    "id": { "type": "string", "pattern": "^app_[a-zA-Z0-9_-]+$" },
    "supervisor_id": { "type": "string" },
    "recommendation_id": { "type": "string" }
  },
  "required": ["id", "supervisor_id", "recommendation_id"],
  "additionalProperties": False
})
