// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-auditing
// Immutable, structured audit log emitter.
// Every security-sensitive or operationally significant event flows through
// this package so audit trails are consistent across the entire platform.
// ─────────────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'USER_REGISTERED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_LOGIN_FAILED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'FILE_UPLOADED'
  | 'FILE_DELETED'
  | 'FILE_DOWNLOADED'
  | 'NOTIFICATION_SENT'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_RESOLVED'
  | 'VOLUNTEER_ASSIGNED'
  | 'VOLUNTEER_REMOVED'
  | 'KNOWLEDGE_UPLOADED'
  | 'KNOWLEDGE_DELETED'
  | 'CONFIG_ACCESSED'
  | 'ADMIN_ACTION';

export type AuditOutcome = 'SUCCESS' | 'FAILURE' | 'PARTIAL';

export interface AuditEvent {
  /** Globally unique event identifier. */
  readonly id: string;
  /** ISO-8601 timestamp — assigned by the emitter, not the caller. */
  readonly timestamp: string;
  /** Authenticated actor performing the action (user ID or system identity). */
  readonly actorId: string;
  readonly actorRole?: string;
  readonly action: AuditAction;
  readonly outcome: AuditOutcome;
  /** Target resource / entity affected by this action. */
  readonly resourceType?: string;
  readonly resourceId?: string;
  /** Arbitrary context useful for forensics. Must be serializable. */
  readonly metadata?: Record<string, unknown>;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export type AuditEmitRequest = Omit<AuditEvent, 'id' | 'timestamp'>;

export interface AuditPort {
  emit(event: AuditEmitRequest): Promise<AuditEvent>;
}

/**
 * Stdout JSON audit adapter.
 * Writes structured, newline-delimited JSON to stdout.
 * Each line is a complete, self-describing audit record.
 * In production, pipe stdout to a log aggregator (e.g., Datadog, Splunk, Cloud Logging).
 */
export class StdoutAuditAdapter implements AuditPort {
  async emit(request: AuditEmitRequest): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...request,
    };

    // Write as newline-delimited JSON — structured, parseable by any log sink.
    process.stdout.write(JSON.stringify(event) + '\n');

    return event;
  }
}

/** Default singleton. */
export const audit: AuditPort = new StdoutAuditAdapter();
