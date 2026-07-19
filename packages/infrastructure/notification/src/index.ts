// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-notification
// Unified notification router. Business services submit a NotificationRequest
// through a stable port; the adapter routes to email/SMS/webhook/in-app
// channels without exposing delivery details to callers.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in-app' | 'webhook';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationRecipient {
  readonly id: string;
  readonly email?: string;
  readonly phone?: string;
  readonly deviceToken?: string;
  readonly webhookUrl?: string;
}

export interface NotificationRequest {
  readonly id?: string;
  readonly recipients: NotificationRecipient[];
  readonly channels: NotificationChannel[];
  readonly subject: string;
  readonly body: string;
  readonly priority: NotificationPriority;
  readonly metadata?: Record<string, unknown>;
}

export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'partial';

export interface NotificationResult {
  readonly id: string;
  readonly status: NotificationStatus;
  readonly deliveredChannels: NotificationChannel[];
  readonly failedChannels: NotificationChannel[];
  readonly timestamp: string;
}

export interface NotificationPort {
  send(request: NotificationRequest): Promise<NotificationResult>;
}

export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * Console / log-based notification adapter.
 * In development/test this records notifications to stdout.
 * Swap for SMTP, Twilio, Firebase adapters without changing consumers.
 */
export class ConsoleNotificationAdapter implements NotificationPort {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const id = request.id ?? crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // In real implementations each channel would dispatch differently.
    // Here we emit structured logs as the observable side-effect.
    process.stdout.write(
      JSON.stringify({
        level: 'info',
        service: 'notification',
        event: 'notification_dispatched',
        notificationId: id,
        subject: request.subject,
        recipientCount: request.recipients.length,
        channels: request.channels,
        priority: request.priority,
        timestamp,
        metadata: request.metadata ?? {},
      }) + '\n',
    );

    return {
      id,
      status: 'sent',
      deliveredChannels: request.channels,
      failedChannels: [],
      timestamp,
    };
  }
}
