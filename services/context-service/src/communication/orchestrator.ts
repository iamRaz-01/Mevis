import { RecipientResolver } from "./recipient-resolver";
import { NotificationEngine } from "./notification-engine";
import { BroadcastEngine } from "./broadcast-engine";
import { AlertEngine } from "./alert-engine";
import { CollaborationEngine } from "./collaboration-engine";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("OperationalCommunicationOrchestrator");

export class OperationalCommunicationOrchestrator {
  private readonly resolver = new RecipientResolver();
  readonly notifications: NotificationEngine;
  readonly broadcasts: BroadcastEngine;
  readonly alerts: AlertEngine;
  readonly collaboration: CollaborationEngine;

  constructor(
    notificationRepo: any,
    broadcastRepo: any,
    messageRepo: any
  ) {
    this.notifications = new NotificationEngine(notificationRepo);
    this.broadcasts = new BroadcastEngine(broadcastRepo);
    this.alerts = new AlertEngine(broadcastRepo);
    this.collaboration = new CollaborationEngine(messageRepo);
  }

  subscribeEvents(): void {
    const events = [
      "IncidentCreated",
      "IncidentAssigned",
      "VolunteerAssigned",
      "TaskCreated",
    ];

    for (const type of events) {
      globalEventBus.subscribe(type, async (evt) => {
        await this.handleEvent(evt.type, evt.payload);
      });
    }
  }

  async handleEvent(eventType: string, payload: any): Promise<void> {
    logger.info("Processing operational communication event", { eventType, payload });

    const recipients = this.resolver.resolveRecipients(eventType, payload);

    for (const recipient of recipients) {
      let title = "";
      let body = "";
      let priority = "MEDIUM";

      if (eventType === "IncidentCreated") {
        title = "Emergency Incident Created";
        body = `A new incident has been created at ${payload.location || "unknown location"}.`;
        priority = "HIGH";
      } else if (eventType === "IncidentAssigned") {
        title = "Incident Assigned";
        body = `Incident "${payload.incidentId}" has been assigned.`;
        priority = "HIGH";
      } else if (eventType === "VolunteerAssigned") {
        title = "New Volunteer Assignment";
        body = `You have been assigned to incident ${payload.targetId}.`;
        priority = "HIGH";
      } else if (eventType === "TaskCreated") {
        title = "New Operational Task";
        body = `Task "${payload.taskId}" has been scheduled.`;
        priority = "MEDIUM";
      } else {
        title = "Operational Update";
        body = `An update of type ${eventType} occurred.`;
      }

      await this.notifications.createNotification(
        title,
        body,
        priority,
        eventType,
        recipient
      );

      await globalEventBus.publish({
        type: "NotificationSent",
        timestamp: new Date().toISOString(),
        payload: { recipient, eventType },
      });
    }
  }
}
