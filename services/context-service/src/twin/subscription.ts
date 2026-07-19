import { type DigitalTwinContext } from "./context";
import { type EventBusPort } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SubscriptionManager");

export type SubscriptionCallback = (twin: DigitalTwinContext) => Promise<void> | void;

export class SubscriptionManager {
  private readonly callbacks = new Set<SubscriptionCallback>();

  constructor(private readonly eventBus: EventBusPort) {
    this.eventBus.subscribe("TwinUpdated", async () => {
      logger.info("TwinUpdated event captured. Ready to notify subscription channels.");
    });
  }

  subscribe(cb: SubscriptionCallback): () => void {
    this.callbacks.add(cb);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  async dispatch(twin: DigitalTwinContext): Promise<void> {
    for (const cb of this.callbacks) {
      try {
        await cb(twin);
      } catch (err: any) {
        logger.error("Error dispatching subscription callback:", { error: err?.message || String(err) });
      }
    }
  }
}
