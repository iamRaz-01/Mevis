export interface Incident {
  readonly id: string;
  readonly severity: string;
  readonly location: string;
  readonly status: string;
  readonly description: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IncidentTimelineEntry {
  readonly id: string;
  readonly incidentId: string;
  readonly eventType: string;
  readonly message: string;
  readonly timestamp: string;
}

export interface Assignment {
  readonly id: string;
  readonly assigneeId: string;
  readonly targetId: string;
  readonly reason: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly priority: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ResourceRequest {
  readonly id: string;
  readonly resourceId: string;
  readonly status: string;
  readonly requester: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AttendanceRecord {
  readonly id: string;
  readonly volunteerId: string;
  readonly status: string;
  readonly timestamp: string;
}
