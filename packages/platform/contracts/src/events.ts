export interface PlatformEvent<T = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly version: number;
  readonly sourceService: string;
  readonly correlationId: string;
  readonly payload: T;
}
