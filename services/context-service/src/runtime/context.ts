export type DecisionLifecycleState = 
  | "PUBLISHED" 
  | "PENDING_APPROVAL" 
  | "APPROVED" 
  | "REJECTED" 
  | "EXPIRED" 
  | "ARCHIVED";

export interface TimelineEntry {
  readonly state: DecisionLifecycleState;
  readonly timestamp: string;
  readonly actor: string | null;
  readonly comment: string | null;
}

export interface DecisionRuntimeState {
  readonly id: string;
  readonly lifecycleState: DecisionLifecycleState;
  readonly approver: string | null;
  readonly reviewedAt: string | null;
  readonly timeline: ReadonlyArray<TimelineEntry>;
  readonly updatedAt: string;
}

export interface DecisionSnapshot {
  readonly id: string;
  readonly snapshotData: any;
  readonly createdAt: string;
}

export interface VolunteerOperationalView {
  readonly volunteer: any;
  readonly assignments: any[];
  readonly attendance: any[];
  readonly currentTasks: any[];
}

export interface IncidentOperationalView {
  readonly incident: any;
  readonly timeline: any[];
  readonly assignments: any[];
}

export interface OperationsDashboardView {
  readonly activeIncidentsCount: number;
  readonly openTasksCount: number;
  readonly availableResourcesCount: number;
  readonly checkedInVolunteersCount: number;
}

export interface OperationalAuditLog {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly actionType: string;
  readonly previousValue: string | null;
  readonly newValue: string | null;
  readonly actor: string;
  readonly timestamp: string;
  readonly reason: string | null;
}
