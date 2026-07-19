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
