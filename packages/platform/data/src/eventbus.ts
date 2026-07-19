import { getRequestContext } from '@mevis/platform-communication';
import { type PlatformEvent } from '@mevis/platform-contracts';

export type EventHandler<T = unknown> = (event: PlatformEvent<T>) => Promise<void> | void;

export interface EventBus {
  publish<T = unknown>(
    eventType: string,
    payload: T,
    metadata?: Partial<
      Omit<PlatformEvent<T>, 'eventId' | 'eventType' | 'occurredAt' | 'correlationId' | 'payload'>
    >,
  ): Promise<void>;
  subscribe<T = unknown>(eventType: string, handler: EventHandler<T>): void;
  registerDlqHandler(handler: (event: PlatformEvent, error: Error) => Promise<void> | void): void;
}

export class LocalEventBusAdapter implements EventBus {
  private readonly handlers = new Map<string, EventHandler<unknown>[]>();
  private dlqHandler?: (event: PlatformEvent, error: Error) => Promise<void> | void;
  private readonly maxRetries = 3;

  publish<T = unknown>(
    eventType: string,
    payload: T,
    metadata?: Partial<
      Omit<PlatformEvent<T>, 'eventId' | 'eventType' | 'occurredAt' | 'correlationId' | 'payload'>
    >,
  ): Promise<void> {
    const ctx = getRequestContext();
    const event: PlatformEvent<T> = {
      eventId: crypto.randomUUID(),
      eventType,
      aggregateId: metadata?.aggregateId || 'unknown',
      occurredAt: new Date().toISOString(),
      version: metadata?.version || 1,
      sourceService: metadata?.sourceService || 'unknown',
      correlationId: ctx.correlationId || crypto.randomUUID(),
      payload,
    };

    // Dispatch asynchronously to emulate a real distributed message broker
    setImmediate(async () => {
      // Resolve matches (including simple wildcard '*' support)
      const matchedHandlers: EventHandler<unknown>[] = [];
      for (const [pattern, list] of this.handlers.entries()) {
        if (pattern === eventType || pattern === '*') {
          matchedHandlers.push(...list);
        }
      }

      for (const handler of matchedHandlers) {
        let attempt = 0;
        let success = false;
        let lastError: Error | null = null;

        while (attempt < this.maxRetries && !success) {
          attempt++;
          try {
            await handler(event);
            success = true;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            // Backoff delay before retry
            if (attempt < this.maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
            }
          }
        }

        if (!success && lastError) {
          // Route to DLQ if all retries fail
          if (this.dlqHandler) {
            try {
              await this.dlqHandler(event, lastError);
            } catch (dlqErr) {
              process.stderr.write(
                `[EventBus DLQ Crash]: Failed to handle DLQ message: ${
                  dlqErr instanceof Error ? dlqErr.message : String(dlqErr)
                }\n`,
              );
            }
          } else {
            process.stderr.write(
              `[EventBus Error]: Event ${event.eventId} failed subscriber on "${eventType}" and no DLQ is registered. Error: ${lastError.message}\n`,
            );
          }
        }
      }
    });

    return Promise.resolve();
  }

  subscribe<T = unknown>(eventType: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler as unknown as EventHandler<unknown>);
    this.handlers.set(eventType, list);
  }

  registerDlqHandler(handler: (event: PlatformEvent, error: Error) => Promise<void> | void): void {
    this.dlqHandler = handler;
  }
}
