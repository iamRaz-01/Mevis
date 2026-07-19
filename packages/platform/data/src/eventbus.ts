export interface EventEnvelope<T = unknown> {
  readonly id: string;
  readonly topic: string;
  readonly payload: T;
  readonly timestamp: string;
}

export type EventHandler<T = unknown> = (envelope: EventEnvelope<T>) => Promise<void> | void;

export interface EventBus {
  publish<T = unknown>(topic: string, payload: T): Promise<void>;
  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): void;
  registerDlqHandler(
    handler: (envelope: EventEnvelope, error: Error) => Promise<void> | void,
  ): void;
}

export class LocalEventBusAdapter implements EventBus {
  private readonly handlers = new Map<string, EventHandler<unknown>[]>();
  private dlqHandler?: (envelope: EventEnvelope, error: Error) => Promise<void> | void;
  private readonly maxRetries = 3;

  publish<T = unknown>(topic: string, payload: T): Promise<void> {
    const envelope: EventEnvelope<T> = {
      id: crypto.randomUUID(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Dispatch asynchronously to emulate a real distributed message broker
    setImmediate(async () => {
      // Resolve matches (including simple wildcard '*' support)
      const matchedHandlers: EventHandler<unknown>[] = [];
      for (const [pattern, list] of this.handlers.entries()) {
        if (pattern === topic || pattern === "*") {
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
            await handler(envelope);
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
              await this.dlqHandler(envelope, lastError);
            } catch (dlqErr) {
              process.stderr.write(
                `[EventBus DLQ Crash]: Failed to handle DLQ message: ${
                  dlqErr instanceof Error ? dlqErr.message : String(dlqErr)
                }\n`,
              );
            }
          } else {
            process.stderr.write(
              `[EventBus Error]: Message ${envelope.id} failed subscriber on "${topic}" and no DLQ is registered. Error: ${lastError.message}\n`,
            );
          }
        }
      }
    });

    return Promise.resolve();
  }

  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(topic) || [];
    list.push(handler as unknown as EventHandler<unknown>);
    this.handlers.set(topic, list);
  }

  registerDlqHandler(
    handler: (envelope: EventEnvelope, error: Error) => Promise<void> | void,
  ): void {
    this.dlqHandler = handler;
  }
}
