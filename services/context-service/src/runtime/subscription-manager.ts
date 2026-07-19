import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("SubscriptionManager");

export class SubscriptionManager {
  private readonly subscribers = new Set<(event: any) => void>();

  constructor() {
    globalEventBus.subscribe("DecisionPublished", (evt) => this.relay(evt));
    globalEventBus.subscribe("ApprovalRequested", (evt) => this.relay(evt));
    globalEventBus.subscribe("DecisionApproved", (evt) => this.relay(evt));
    globalEventBus.subscribe("DecisionRejected", (evt) => this.relay(evt));
  }

  subscribe(callback: (event: any) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private relay(event: any): void {
    logger.info(`Relaying decision runtime event: "${event.type}".`);
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (err: any) {
        logger.error("Relaying error", { error: err?.message || String(err) });
      }
    }
  }
}
