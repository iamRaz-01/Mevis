import { type Notification } from "./context";
import crypto from "node:crypto";

export class NotificationEngine {
  constructor(private readonly notificationRepo: any) {}

  async createNotification(
    title: string,
    body: string,
    priority: string,
    sourceEvent: string,
    recipient: string
  ): Promise<Notification> {
    const id = `not_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();
    const notification: Notification = {
      id,
      title,
      body,
      priority,
      sourceEvent,
      recipient,
      timestamp,
      deliveryState: "SENT",
      acknowledgedAt: null,
    };

    await this.notificationRepo.save({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      source_event: notification.sourceEvent,
      recipient: notification.recipient,
      timestamp: notification.timestamp,
      delivery_state: notification.deliveryState,
      acknowledged_at: notification.acknowledgedAt,
    });

    return notification;
  }

  async markAsRead(id: string): Promise<void> {
    const row = await this.notificationRepo.findById(id);
    if (!row) throw new Error(`Notification "${id}" not found.`);
    
    await this.notificationRepo.save({
      ...row,
      delivery_state: "READ",
    });
  }

  async acknowledge(id: string): Promise<void> {
    const row = await this.notificationRepo.findById(id);
    if (!row) throw new Error(`Notification "${id}" not found.`);
    
    await this.notificationRepo.save({
      ...row,
      delivery_state: "ACKNOWLEDGED",
      acknowledged_at: new Date().toISOString(),
    });
  }
}
