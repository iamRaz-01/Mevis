import { type Broadcast } from "./context";
import crypto from "node:crypto";
import { globalEventBus } from "../world/event-bus";

export class AlertEngine {
  constructor(private readonly broadcastRepo: any) {}

  async triggerEmergencyAlert(title: string, body: string): Promise<Broadcast> {
    const id = `alert_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();
    const alert: Broadcast = {
      id,
      title,
      body,
      priority: "CRITICAL",
      audience: "ALL",
      timestamp,
    };

    await this.broadcastRepo.save({
      id: alert.id,
      title: alert.title,
      body: alert.body,
      priority: alert.priority,
      audience: alert.audience,
      timestamp: alert.timestamp,
    });

    await globalEventBus.publish({
      type: "AlertTriggered",
      timestamp,
      payload: { alertId: id },
    });

    return alert;
  }
}
