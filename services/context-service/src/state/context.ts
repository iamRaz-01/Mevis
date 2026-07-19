export interface NormalizedEvent {
  readonly eventId: string;
  readonly entityId: string;
  readonly eventType: string;
  readonly eventTime: string; // normalized ISO-8601
  readonly payload: Record<string, any>;
  readonly source: string;
  readonly version: string;
}

export interface EntityState {
  readonly entityId: string;
  readonly stateData: Record<string, any>; // location, status, battery, lastSeen, etc.
  readonly lastEventId: string;
  readonly lastEventTime: string;
  readonly updatedAt: string;
}

export interface WorldStateContext {
  readonly incomingEvent: NormalizedEvent;
  readonly targetEntityId: string;
  readonly currentState: EntityState | null;
  readonly timeline: {
    readonly eventTime: string;
    readonly processingTime: string;
  };
}

export interface SyncManifest {
  readonly eventsProcessed: number;
  readonly entitiesUpdated: number;
  readonly conflictsDetected: number;
  readonly duplicatesIgnored: number;
  readonly snapshotsGenerated: number;
  readonly latencyMs: number;
  readonly createdAt: string;
}
