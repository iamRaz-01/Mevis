import { type Incident, type Assignment, type Task, type ResourceRequest, type AttendanceRecord } from "./context";
import { IncidentEngine } from "./incident-engine";
import { AssignmentEngine } from "./assignment-engine";
import { TaskEngine } from "./task-engine";
import { AttendanceEngine } from "./attendance-engine";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import crypto from "node:crypto";

const logger = new StructuredLogger("BusinessWorkflowOrchestrator");

export class BusinessWorkflowOrchestrator {
  private readonly incidentEngine = new IncidentEngine();
  private readonly assignmentEngine = new AssignmentEngine();
  private readonly taskEngine = new TaskEngine();
  private readonly attendanceEngine = new AttendanceEngine();

  constructor(
    private readonly incidentRepo: any,
    private readonly timelineRepo: any,
    private readonly assignmentRepo: any,
    private readonly taskRepo: any,
    private readonly requestRepo: any,
    private readonly attendanceRepo: any
  ) {}

  async createIncident(severity: string, location: string, description: string): Promise<Incident> {
    const id = `INC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const incident: Incident = {
      id,
      severity,
      location,
      status: "CREATED",
      description,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.incidentRepo.save({
      id: incident.id,
      severity: incident.severity,
      location: incident.location,
      status: incident.status,
      description: incident.description,
      created_at: incident.createdAt,
      updated_at: incident.updatedAt,
    });

    await this.timelineRepo.save({
      id: crypto.randomUUID(),
      incident_id: id,
      event_type: "IncidentCreated",
      message: `Incident created with severity ${severity} at ${location}`,
      timestamp,
    });

    await globalEventBus.publish({
      type: "IncidentCreated",
      timestamp,
      payload: { incidentId: id },
    });

    return incident;
  }

  async transitionIncident(id: string, nextStatus: string): Promise<Incident> {
    const row = await this.incidentRepo.findById(id);
    if (!row) throw new Error(`Incident "${id}" not found.`);

    this.incidentEngine.validateTransition(row.status, nextStatus);

    const timestamp = new Date().toISOString();
    const updated: Incident = {
      id,
      severity: row.severity,
      location: row.location,
      status: nextStatus,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: timestamp,
    };

    await this.incidentRepo.save({
      id: updated.id,
      severity: updated.severity,
      location: updated.location,
      status: updated.status,
      description: updated.description,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });

    await this.timelineRepo.save({
      id: crypto.randomUUID(),
      incident_id: id,
      event_type: nextStatus === "ASSIGNED" ? "IncidentAssigned" : "IncidentStatusChanged",
      message: `Incident status transitioned to ${nextStatus}`,
      timestamp,
    });

    await globalEventBus.publish({
      type: nextStatus === "ASSIGNED" ? "IncidentAssigned" : "IncidentStatusChanged",
      timestamp,
      payload: { incidentId: id },
    });

    return updated;
  }

  async createAssignment(assigneeId: string, targetId: string, reason: string): Promise<Assignment> {
    const existing = await this.assignmentRepo.findAll();
    this.assignmentEngine.validateExclusivity(assigneeId, existing.map((row: any) => ({
      id: row.id,
      assigneeId: row.assignee_id,
      targetId: row.target_id,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));

    const id = `ASN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const assignment: Assignment = {
      id,
      assigneeId,
      targetId,
      reason,
      status: "CREATED",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.assignmentRepo.save({
      id: assignment.id,
      assignee_id: assignment.assigneeId,
      target_id: assignment.targetId,
      reason: assignment.reason,
      status: assignment.status,
      created_at: assignment.createdAt,
      updated_at: assignment.updatedAt,
    });

    await globalEventBus.publish({
      type: "VolunteerAssigned",
      timestamp,
      payload: { assignmentId: id, assigneeId, targetId },
    });

    return assignment;
  }

  async createTask(title: string, description: string, priority: string): Promise<Task> {
    const id = `TSK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const task: Task = {
      id,
      title,
      description,
      status: "CREATED",
      priority,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.taskRepo.save({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
    });

    await globalEventBus.publish({
      type: "TaskCreated",
      timestamp,
      payload: { taskId: id },
    });

    return task;
  }

  async checkInVolunteer(volunteerId: string): Promise<AttendanceRecord> {
    const existing = await this.attendanceRepo.findAll();
    const currentRecords = existing.map((row: any) => ({
      id: row.id,
      volunteerId: row.volunteer_id,
      status: row.status,
      timestamp: row.timestamp,
    }));

    this.attendanceEngine.validateCheckIn(volunteerId, currentRecords);

    const id = `ATT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const record: AttendanceRecord = {
      id,
      volunteerId,
      status: "CHECKED_IN",
      timestamp,
    };

    await this.attendanceRepo.save({
      id: record.id,
      volunteer_id: record.volunteerId,
      status: record.status,
      timestamp: record.timestamp,
    });

    await globalEventBus.publish({
      type: "AttendanceCheckedIn",
      timestamp,
      payload: { volunteerId, recordId: id },
    });

    return record;
  }

  async checkOutVolunteer(volunteerId: string): Promise<AttendanceRecord> {
    const existing = await this.attendanceRepo.findAll();
    const currentRecords = existing.map((row: any) => ({
      id: row.id,
      volunteerId: row.volunteer_id,
      status: row.status,
      timestamp: row.timestamp,
    }));

    this.attendanceEngine.validateCheckOut(volunteerId, currentRecords);

    const checkInRecord = existing.find((r: any) => r.volunteer_id === volunteerId && r.status === "CHECKED_IN");
    if (checkInRecord) {
      await this.attendanceRepo.delete(checkInRecord.id);
    }

    const id = `ATT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const record: AttendanceRecord = {
      id,
      volunteerId,
      status: "CHECKED_OUT",
      timestamp,
    };

    await this.attendanceRepo.save({
      id: record.id,
      volunteer_id: record.volunteerId,
      status: record.status,
      timestamp: record.timestamp,
    });

    await globalEventBus.publish({
      type: "AttendanceCheckedOut",
      timestamp,
      payload: { volunteerId, recordId: id },
    });

    return record;
  }

  async createResourceRequest(resourceId: string, requester: string): Promise<ResourceRequest> {
    const id = `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const request: ResourceRequest = {
      id,
      resourceId,
      status: "REQUESTED",
      requester,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.requestRepo.save({
      id: request.id,
      resource_id: request.resourceId,
      status: request.status,
      requester: request.requester,
      created_at: request.createdAt,
      updated_at: request.updatedAt,
    });

    await globalEventBus.publish({
      type: "ResourceRequested",
      timestamp,
      payload: { requestId: id },
    });

    return request;
  }

  async acceptAssignment(id: string): Promise<Assignment> {
    const row = await this.assignmentRepo.findById(id);
    if (!row) throw new Error(`Assignment "${id}" not found.`);

    this.assignmentEngine.validateTransition(row.status, "ACCEPTED");

    const timestamp = new Date().toISOString();
    const updated: Assignment = {
      id,
      assigneeId: row.assignee_id,
      targetId: row.target_id,
      reason: row.reason,
      status: "ACCEPTED",
      createdAt: row.created_at,
      updatedAt: timestamp,
    };

    await this.assignmentRepo.save({
      id: updated.id,
      assignee_id: updated.assigneeId,
      target_id: updated.targetId,
      reason: updated.reason,
      status: updated.status,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });

    await globalEventBus.publish({
      type: "AssignmentAccepted",
      timestamp,
      payload: { assignmentId: id, assigneeId: row.assignee_id, targetId: row.target_id },
    });

    return updated;
  }

  async rejectAssignment(id: string): Promise<Assignment> {
    const row = await this.assignmentRepo.findById(id);
    if (!row) throw new Error(`Assignment "${id}" not found.`);

    this.assignmentEngine.validateTransition(row.status, "REJECTED");

    const timestamp = new Date().toISOString();
    const updated: Assignment = {
      id,
      assigneeId: row.assignee_id,
      targetId: row.target_id,
      reason: row.reason,
      status: "REJECTED",
      createdAt: row.created_at,
      updatedAt: timestamp,
    };

    await this.assignmentRepo.save({
      id: updated.id,
      assignee_id: updated.assigneeId,
      target_id: updated.targetId,
      reason: updated.reason,
      status: updated.status,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });

    await globalEventBus.publish({
      type: "AssignmentRejected",
      timestamp,
      payload: { assignmentId: id, assigneeId: row.assignee_id, targetId: row.target_id },
    });

    return updated;
  }

  async startTask(id: string): Promise<Task> {
    const row = await this.taskRepo.findById(id);
    if (!row) throw new Error(`Task "${id}" not found.`);

    this.taskEngine.validateTransition(row.status, "IN_PROGRESS");

    const timestamp = new Date().toISOString();
    const updated: Task = {
      id,
      title: row.title,
      description: row.description,
      status: "IN_PROGRESS",
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: timestamp,
    };

    await this.taskRepo.save({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });

    await globalEventBus.publish({
      type: "TaskStarted",
      timestamp,
      payload: { taskId: id },
    });

    return updated;
  }

  async completeTask(id: string): Promise<Task> {
    const row = await this.taskRepo.findById(id);
    if (!row) throw new Error(`Task "${id}" not found.`);

    this.taskEngine.validateTransition(row.status, "COMPLETED");

    const timestamp = new Date().toISOString();
    const updated: Task = {
      id,
      title: row.title,
      description: row.description,
      status: "COMPLETED",
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: timestamp,
    };

    await this.taskRepo.save({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    });

    await globalEventBus.publish({
      type: "TaskCompleted",
      timestamp,
      payload: { taskId: id },
    });

    return updated;
  }

  async raiseSOS(volunteerId: string, reason: string, location: string): Promise<Incident> {
    const timestamp = new Date().toISOString();
    const incidentId = `INC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const incident: Incident = {
      id: incidentId,
      severity: "CRITICAL",
      location,
      status: "CREATED",
      description: `EMERGENCY SOS RAISED by Volunteer "${volunteerId}". Reason: ${reason}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.incidentRepo.save({
      id: incident.id,
      severity: incident.severity,
      location: incident.location,
      status: incident.status,
      description: incident.description,
      created_at: incident.createdAt,
      updated_at: incident.updatedAt,
    });

    await this.timelineRepo.save({
      id: crypto.randomUUID(),
      incident_id: incidentId,
      event_type: "SOSRaised",
      message: `Emergency SOS raised at ${location} for ${reason}`,
      timestamp,
    });

    await globalEventBus.publish({
      type: "SOSRaised",
      timestamp,
      payload: { incidentId, volunteerId, reason, location },
    });

    return incident;
  }

  async updateLocation(volunteerId: string, location: string, coords: [number, number]): Promise<void> {
    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "LocationUpdated",
      timestamp,
      payload: { volunteerId, location, locationCoords: coords },
    });
  }
}
