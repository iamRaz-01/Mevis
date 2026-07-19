export interface IntegrationEventLog {
  readonly id: string;
  readonly eventType: string;
  readonly payloadJson: string;
  readonly status: string;
  readonly timestamp: string;
  readonly errorMessage: string | null;
}

export interface IntegrationRetryQueue {
  readonly id: string;
  readonly eventId: string;
  readonly retryCount: number;
  readonly nextAttempt: string;
}

export interface VolunteerAvailabilityChangedContract {
  readonly volunteerId: string;
  readonly oldState: string;
  readonly newState: string;
  readonly timestamp: string;
  readonly source: string;
}

export interface IncidentStateChangedContract {
  readonly incidentId: string;
  readonly severity: string;
  readonly status: string;
  readonly location: string;
  readonly timestamp: string;
}
