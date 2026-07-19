import { 
  RelationalRepository, 
  type Identifiable, 
  type DatabaseClient 
} from "@mevis/platform-data";

export interface WorldEntityEntity extends Identifiable<string> {
  id: string; // world entity ID (globally unique)
  entity_type: string;
  display_name: string;
  parent_entity_id: string | null;
  identity_ref: string | null;
  metadata_json: string;
  created_at: string;
}

export interface WorldRelationshipEntity extends Identifiable<string> {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  metadata_json: string;
  created_at: string;
}

export class WorldEntityRepository extends RelationalRepository<WorldEntityEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_entities",
      ["id", "entity_type", "display_name", "parent_entity_id", "identity_ref", "metadata_json", "created_at"],
      "WorldEntity"
    );
  }
}

export class WorldRelationshipRepository extends RelationalRepository<WorldRelationshipEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_relationships",
      ["id", "source_entity_id", "target_entity_id", "relationship_type", "metadata_json", "created_at"],
      "WorldRelationship"
    );
  }
}

export interface WorldIngestedEventEntity extends Identifiable<string> {
  id: string; // eventId
  entity_id: string;
  event_type: string;
  event_time: string;
  payload_json: string;
  source: string;
  event_version: string;
  created_at: string;
}

export interface WorldLatestStateEntity extends Identifiable<string> {
  id: string; // entity_id
  state_data: string;
  last_event_id: string;
  last_event_time: string;
  updated_at: string;
}

export interface WorldStateHistoryEntity extends Identifiable<string> {
  id: string; // UUID
  entity_id: string;
  state_data: string;
  event_id: string;
  event_time: string;
  created_at: string;
}

export interface WorldSnapshotEntity extends Identifiable<string> {
  id: string;
  snapshot_time: string;
  snapshot_data: string;
  created_at: string;
}

export class WorldIngestedEventRepository extends RelationalRepository<WorldIngestedEventEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_ingested_events",
      ["id", "entity_id", "event_type", "event_time", "payload_json", "source", "event_version", "created_at"],
      "WorldIngestedEvent"
    );
  }
}

export class WorldLatestStateRepository extends RelationalRepository<WorldLatestStateEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_latest_states",
      ["id", "state_data", "last_event_id", "last_event_time", "updated_at"],
      "WorldLatestState"
    );
  }
}

export class WorldStateHistoryRepository extends RelationalRepository<WorldStateHistoryEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_state_history",
      ["id", "entity_id", "state_data", "event_id", "event_time", "created_at"],
      "WorldStateHistory"
    );
  }

  async findByEntityId(entityId: string): Promise<WorldStateHistoryEntity[]> {
    const sql = `SELECT * FROM ${this.tableName} WHERE entity_id = ? ORDER BY event_time ASC;`;
    return await this.db.query<WorldStateHistoryEntity>(sql, [entityId]);
  }
}

export class WorldSnapshotRepository extends RelationalRepository<WorldSnapshotEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "world_snapshots",
      ["id", "snapshot_time", "snapshot_data", "created_at"],
      "WorldSnapshot"
    );
  }
}

export interface ContextPackageEntity extends Identifiable<string> {
  id: string;
  situation_id: string;
  package_data_json: string;
  manifest_json: string;
  created_at: string;
}

export interface ContextSituationEntity extends Identifiable<string> {
  id: string;
  title: string;
  severity: string;
  status: string;
  entities_involved: string;
  created_at: string;
}

export class ContextPackageRepository extends RelationalRepository<ContextPackageEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "context_packages",
      ["id", "situation_id", "package_data_json", "manifest_json", "created_at"],
      "ContextPackage"
    );
  }
}

export class ContextSituationRepository extends RelationalRepository<ContextSituationEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "context_situations",
      ["id", "title", "severity", "status", "entities_involved", "created_at"],
      "ContextSituation"
    );
  }
}

export interface ContextValidationEntity extends Identifiable<string> {
  id: string; // packageId
  health_status: string;
  health_score: number;
  manifest_json: string;
  created_at: string;
}

export class ContextValidationRepository extends RelationalRepository<ContextValidationEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "context_validation_results",
      ["id", "health_status", "health_score", "manifest_json", "created_at"],
      "ContextValidation"
    );
  }
}

export interface DigitalTwinSnapshotEntity extends Identifiable<string> {
  id: string;
  snapshot_data_json: string;
  created_at: string;
}

export class DigitalTwinSnapshotRepository extends RelationalRepository<DigitalTwinSnapshotEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "digital_twin_snapshots",
      ["id", "snapshot_data_json", "created_at"],
      "DigitalTwinSnapshot"
    );
  }
}

export interface DecisionCandidateEntity extends Identifiable<string> {
  id: string;
  decision_type: string;
  lifecycle_state: string;
  context_json: string;
  constraints_json: string;
  manifest_json: string;
  created_at: string;
}

export class DecisionCandidateRepository extends RelationalRepository<DecisionCandidateEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "decision_candidates",
      ["id", "decision_type", "lifecycle_state", "context_json", "constraints_json", "manifest_json", "created_at"],
      "DecisionCandidate"
    );
  }
}

export interface DecisionAnalysisEntity extends Identifiable<string> {
  id: string;
  decision_id: string;
  analysis_data_json: string;
  reasoning_trace_json: string;
  created_at: string;
}

export class DecisionAnalysisRepository extends RelationalRepository<DecisionAnalysisEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "decision_analyses",
      ["id", "decision_id", "analysis_data_json", "reasoning_trace_json", "created_at"],
      "DecisionAnalysis"
    );
  }
}

export interface DecisionPackageEntity extends Identifiable<string> {
  id: string;
  decision_id: string;
  package_data_json: string;
  created_at: string;
}

export class DecisionPackageRepository extends RelationalRepository<DecisionPackageEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "decision_packages",
      ["id", "decision_id", "package_data_json", "created_at"],
      "DecisionPackage"
    );
  }
}

export interface TrustedDecisionEntity extends Identifiable<string> {
  id: string;
  decision_id: string;
  decision_package_id: string;
  decision_data_json: string;
  governance_manifest_json: string;
  created_at: string;
}

export class TrustedDecisionRepository extends RelationalRepository<TrustedDecisionEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "trusted_decisions",
      ["id", "decision_id", "decision_package_id", "decision_data_json", "governance_manifest_json", "created_at"],
      "TrustedDecision"
    );
  }
}

export interface DecisionRuntimeStateEntity extends Identifiable<string> {
  id: string;
  lifecycle_state: string;
  approver: string | null;
  reviewed_at: string | null;
  timeline_json: string;
  updated_at: string;
}

export class DecisionRuntimeStateRepository extends RelationalRepository<DecisionRuntimeStateEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "decision_runtime_states",
      ["id", "lifecycle_state", "approver", "reviewed_at", "timeline_json", "updated_at"],
      "DecisionRuntimeState"
    );
  }
}

export interface DecisionSnapshotEntity extends Identifiable<string> {
  id: string;
  snapshot_data_json: string;
  created_at: string;
}

export class DecisionSnapshotRepository extends RelationalRepository<DecisionSnapshotEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "decision_snapshots",
      ["id", "snapshot_data_json", "created_at"],
      "DecisionSnapshot"
    );
  }
}export interface OrganizationEntity extends Identifiable<string> {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export class OrganizationRepository extends RelationalRepository<OrganizationEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "organizations", ["id", "name", "parent_id", "created_at"], "Organization");
  }
}

export interface VenueEntity extends Identifiable<string> {
  id: string;
  name: string;
  created_at: string;
}

export class VenueRepository extends RelationalRepository<VenueEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "venues", ["id", "name", "created_at"], "Venue");
  }
}

export interface VenueZoneEntity extends Identifiable<string> {
  id: string;
  venue_id: string;
  name: string;
}

export class VenueZoneRepository extends RelationalRepository<VenueZoneEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "venue_zones", ["id", "venue_id", "name"], "VenueZone");
  }
}

export interface VenueGateEntity extends Identifiable<string> {
  id: string;
  venue_id: string;
  zone_id: string | null;
  name: string;
}

export class VenueGateRepository extends RelationalRepository<VenueGateEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "venue_gates", ["id", "venue_id", "zone_id", "name"], "VenueGate");
  }
}

export interface TeamEntity extends Identifiable<string> {
  id: string;
  name: string;
  organization_id: string;
  capabilities_json: string;
  created_at: string;
}

export class TeamRepository extends RelationalRepository<TeamEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "teams", ["id", "name", "organization_id", "capabilities_json", "created_at"], "Team");
  }
}

export interface VolunteerEntity extends Identifiable<string> {
  id: string;
  name: string;
  email: string;
  team_id: string | null;
  organization_id: string;
  certifications_json: string;
  languages_json: string;
  created_at: string;
}

export class VolunteerRepository extends RelationalRepository<VolunteerEntity, string> {
  constructor(db: DatabaseClient) {
    super(
      db,
      "volunteers",
      ["id", "name", "email", "team_id", "organization_id", "certifications_json", "languages_json", "created_at"],
      "Volunteer"
    );
  }
}

export interface ResourceEntity extends Identifiable<string> {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  capabilities_json: string;
  created_at: string;
}

export class ResourceRepository extends RelationalRepository<ResourceEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "resources", ["id", "name", "category", "serial_number", "capabilities_json", "created_at"], "Resource");
  }
}

export interface IncidentEntity extends Identifiable<string> {
  id: string;
  severity: string;
  location: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export class IncidentRepository extends RelationalRepository<IncidentEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "incidents", ["id", "severity", "location", "status", "description", "created_at", "updated_at"], "Incident");
  }
}

export interface IncidentTimelineEntity extends Identifiable<number> {
  id: number;
  incident_id: string;
  event_type: string;
  message: string;
  timestamp: string;
}

export class IncidentTimelineRepository extends RelationalRepository<IncidentTimelineEntity, number> {
  constructor(db: DatabaseClient) {
    super(db, "incident_timelines", ["id", "incident_id", "event_type", "message", "timestamp"], "IncidentTimeline");
  }
}

export interface AssignmentEntity extends Identifiable<string> {
  id: string;
  assignee_id: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class AssignmentRepository extends RelationalRepository<AssignmentEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "assignments", ["id", "assignee_id", "target_id", "reason", "status", "created_at", "updated_at"], "Assignment");
  }
}

export interface TaskEntity extends Identifiable<string> {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export class TaskRepository extends RelationalRepository<TaskEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "tasks", ["id", "title", "description", "status", "priority", "created_at", "updated_at"], "Task");
  }
}

export interface ResourceRequestEntity extends Identifiable<string> {
  id: string;
  resource_id: string;
  status: string;
  requester: string;
  created_at: string;
  updated_at: string;
}

export class ResourceRequestRepository extends RelationalRepository<ResourceRequestEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "resource_requests", ["id", "resource_id", "status", "requester", "created_at", "updated_at"], "ResourceRequest");
  }
}

export interface AttendanceRecordEntity extends Identifiable<string> {
  id: string;
  volunteer_id: string;
  status: string;
  timestamp: string;
}

export class AttendanceRecordRepository extends RelationalRepository<AttendanceRecordEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "attendance_records", ["id", "volunteer_id", "status", "timestamp"], "AttendanceRecord");
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?;`;
    await this.db.execute(sql, [id]);
  }
}

export interface IntegrationEventLogEntity extends Identifiable<string> {
  id: string;
  event_type: string;
  payload_json: string;
  status: string;
  timestamp: string;
  error_message: string | null;
}

export class IntegrationEventLogRepository extends RelationalRepository<IntegrationEventLogEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "integration_event_logs", ["id", "event_type", "payload_json", "status", "timestamp", "error_message"], "IntegrationEventLog");
  }
}

export interface IntegrationRetryQueueEntity extends Identifiable<string> {
  id: string;
  event_id: string;
  retry_count: number;
  next_attempt: string;
}

export class IntegrationRetryQueueRepository extends RelationalRepository<IntegrationRetryQueueEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "integration_retry_queue", ["id", "event_id", "retry_count", "next_attempt"], "IntegrationRetryQueue");
  }
}

export interface NotificationEntity extends Identifiable<string> {
  id: string;
  title: string;
  body: string;
  priority: string;
  source_event: string;
  recipient: string;
  timestamp: string;
  delivery_state: string;
  acknowledged_at: string | null;
}

export class NotificationRepository extends RelationalRepository<NotificationEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "notifications", ["id", "title", "body", "priority", "source_event", "recipient", "timestamp", "delivery_state", "acknowledged_at"], "Notification");
  }
}

export interface BroadcastEntity extends Identifiable<string> {
  id: string;
  title: string;
  body: string;
  priority: string;
  audience: string;
  timestamp: string;
}

export class BroadcastRepository extends RelationalRepository<BroadcastEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "broadcasts", ["id", "title", "body", "priority", "audience", "timestamp"], "Broadcast");
  }
}

export interface AnnouncementEntity extends Identifiable<string> {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

export class AnnouncementRepository extends RelationalRepository<AnnouncementEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "announcements", ["id", "title", "body", "timestamp"], "Announcement");
  }
}

export interface ConversationMessageEntity extends Identifiable<string> {
  id: string;
  context_type: string;
  context_id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export class ConversationMessageRepository extends RelationalRepository<ConversationMessageEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "conversation_messages", ["id", "context_type", "context_id", "sender", "message", "timestamp"], "ConversationMessage");
  }
}

export interface OperationalAuditLogEntity extends Identifiable<string> {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  previous_value: string | null;
  new_value: string | null;
  actor: string;
  timestamp: string;
  reason: string | null;
}

export class OperationalAuditLogRepository extends RelationalRepository<OperationalAuditLogEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "operational_audit_logs", ["id", "entity_type", "entity_id", "action_type", "previous_value", "new_value", "actor", "timestamp", "reason"], "OperationalAuditLog");
  }
}

export interface AiSessionEntity extends Identifiable<string> {
  id: string;
  user_id: string;
  role: string;
  active_incident_id: string | null;
  active_venue_id: string | null;
  created_at: string;
}

export class AiSessionRepository extends RelationalRepository<AiSessionEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "ai_sessions", ["id", "user_id", "role", "active_incident_id", "active_venue_id", "created_at"], "AiSession");
  }

  async delete(id: string): Promise<void> {
    await this.db.execute("DELETE FROM ai_sessions WHERE id = ?;", [id]);
  }
}

export interface ConversationEntity extends Identifiable<string> {
  id: string;
  session_id: string;
  title: string;
  created_at: string;
}

export class ConversationRepository extends RelationalRepository<ConversationEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "conversations", ["id", "session_id", "title", "created_at"], "Conversation");
  }
}

export interface AiConversationMessageEntity extends Identifiable<string> {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  timestamp: string;
}

export class AiConversationMessageRepository extends RelationalRepository<AiConversationMessageEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "ai_conversation_messages", ["id", "conversation_id", "role", "content", "timestamp"], "ConversationMessage");
  }
}

export interface UserMemoryEntity extends Identifiable<string> {
  id: string;
  user_id: string;
  memory_text: string;
  scope: string;
  created_at: string;
}

export class UserMemoryRepository extends RelationalRepository<UserMemoryEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "user_memories", ["id", "user_id", "memory_text", "scope", "created_at"], "UserMemory");
  }
}

export interface AiPersonaEntity extends Identifiable<string> {
  id: string;
  name: string;
  tone: string;
  capabilities_json: string;
  response_constraints: string;
}

export class AiPersonaRepository extends RelationalRepository<AiPersonaEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "ai_personas", ["id", "name", "tone", "capabilities_json", "response_constraints"], "AiPersona");
  }
}

export interface ReasoningPlanEntity extends Identifiable<string> {
  id: string;
  session_id: string;
  query: string;
  intent: string;
  status: string;
  created_at: string;
}

export class ReasoningPlanRepository extends RelationalRepository<ReasoningPlanEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "reasoning_plans", ["id", "session_id", "query", "intent", "status", "created_at"], "ReasoningPlan");
  }
}

export interface ReasoningStepEntity extends Identifiable<string> {
  id: string;
  plan_id: string;
  step_index: number;
  description: string;
  status: string;
  target_engine: string;
}

export class ReasoningStepRepository extends RelationalRepository<ReasoningStepEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "reasoning_steps", ["id", "plan_id", "step_index", "description", "status", "target_engine"], "ReasoningStep");
  }
}

export interface DetectedIntentEntity extends Identifiable<string> {
  id: string;
  query: string;
  intent_type: string;
  confidence: number;
  created_at: string;
}

export class DetectedIntentRepository extends RelationalRepository<DetectedIntentEntity, string> {
  constructor(db: DatabaseClient) {
    super(db, "detected_intents", ["id", "query", "intent_type", "confidence", "created_at"], "DetectedIntent");
  }
}
