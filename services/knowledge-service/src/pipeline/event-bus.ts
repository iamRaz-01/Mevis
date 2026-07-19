import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("EventBus");

export interface PlatformEvent {
  readonly type: string;
  readonly timestamp: string;
  readonly payload: Record<string, any>;
}

export interface EventBusPort {
  publish(event: PlatformEvent): Promise<void>;
}

export class InMemoryEventBus implements EventBusPort {
  private readonly listeners = new Map<string, Array<(event: PlatformEvent) => void | Promise<void>>>();

  async publish(event: PlatformEvent): Promise<void> {
    logger.info(`Publishing event of type: ${event.type}`);
    const handlers = this.listeners.get(event.type) || [];
    await Promise.all(
      handlers.map(async handler => {
        try {
          await handler(event);
        } catch (err: any) {
          logger.error(`Error in event listener for ${event.type}:`, { error: err?.message || String(err) });
        }
      })
    );
  }

  subscribe(type: string, handler: (event: PlatformEvent) => void | Promise<void>): void {
    const list = this.listeners.get(type) || [];
    list.push(handler);
    this.listeners.set(type, list);
  }
}

export const globalEventBus = new InMemoryEventBus();
