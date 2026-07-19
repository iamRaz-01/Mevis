import { globalEventBus } from "../world/event-bus";
import crypto from "node:crypto";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("AuditEngine");

export class AuditEngine {
  constructor(private readonly auditRepo: any) {}

  subscribeEvents(): void {
    const events = [
      "IncidentCreated",
      "IncidentStatusChanged",
      "VolunteerAssigned",
      "AttendanceCheckedIn",
      "AttendanceCheckedOut",
      "TaskCreated",
    ];

    for (const type of events) {
      globalEventBus.subscribe(type, async (evt) => {
        await this.logAuditRecord(evt.type, evt.payload);
      });
    }
  }

  private async logAuditRecord(eventType: string, payload: any): Promise<void> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    let entityId = payload.incidentId || payload.volunteerId || payload.taskId || payload.assignmentId || "SYSTEM";
    let entityType = "SYSTEM";
    if (eventType.startsWith("Incident")) entityType = "Incident";
    else if (eventType.startsWith("Volunteer") || eventType.startsWith("Attendance")) entityType = "Volunteer";
    else if (eventType.startsWith("Task")) entityType = "Task";

    await this.auditRepo.save({
      id,
      entity_type: entityType,
      entity_id: entityId,
      action_type: eventType,
      previous_value: null,
      new_value: JSON.stringify(payload),
      actor: "ROLE_ADMIN",
      timestamp,
      reason: `Automated audit log of ${eventType} event.`,
    });

    logger.info(`Logged audit trail record "${id}" for action "${eventType}".`);
  }
}
