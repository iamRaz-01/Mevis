import { type IntegrationEventLog, type IntegrationRetryQueue } from "./context";
import { KnowledgeSynchronizer } from "./knowledge-sync";
import { ContextSynchronizer } from "./context-sync";
import { DigitalTwinSynchronizer } from "./twin-sync";
import { DecisionSynchronizer } from "./decision-sync";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import crypto from "node:crypto";

const logger = new StructuredLogger("OperationalIntelligenceIntegrationOrchestrator");

export class OperationalIntelligenceIntegrationOrchestrator {
  private readonly knowledgeSync = new KnowledgeSynchronizer();
  private readonly contextSync = new ContextSynchronizer();
  private readonly twinSync: DigitalTwinSynchronizer;
  private readonly decisionSync: DecisionSynchronizer;

  private processedEventIds = new Set<string>();

  constructor(
    private readonly logRepo: any,
    private readonly retryRepo: any,
    entityRepo: any,
    candidateRepo: any
  ) {
    this.twinSync = new DigitalTwinSynchronizer(entityRepo);
    this.decisionSync = new DecisionSynchronizer(candidateRepo);
  }

  subscribeEvents(): void {
    const events = [
      "IncidentCreated",
      "IncidentAssigned",
      "IncidentStatusChanged",
      "VolunteerAssigned",
      "TaskCreated",
      "AttendanceCheckedIn",
      "AttendanceCheckedOut",
      "ResourceRequested",
    ];

    for (const type of events) {
      globalEventBus.subscribe(type, async (evt) => {
        await this.handleEvent(evt.type, evt.payload);
      });
    }
  }

  async handleEvent(eventType: string, payload: any): Promise<void> {
    const eventId = payload.eventId || crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (this.processedEventIds.has(eventId)) {
      logger.info(`Duplicate integration event ${eventId} ignored.`);
      return;
    }
    this.processedEventIds.add(eventId);

    await this.logRepo.save({
      id: eventId,
      event_type: eventType,
      payload_json: JSON.stringify(payload),
      status: "PROCESSING",
      timestamp,
      error_message: null,
    });

    try {
      await this.knowledgeSync.synchronize(eventType, payload);
      await this.contextSync.synchronize(eventType, payload);
      await this.twinSync.synchronize(eventType, payload);
      await this.decisionSync.synchronize(eventType, payload);

      await this.logRepo.save({
        id: eventId,
        event_type: eventType,
        payload_json: JSON.stringify(payload),
        status: "COMPLETED",
        timestamp,
        error_message: null,
      });

      await globalEventBus.publish({
        type: "SynchronizationCompleted",
        timestamp,
        payload: { eventId, eventType },
      });

    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      logger.error(`Integration failed for event ${eventId}`, { error: errorMsg });

      await this.logRepo.save({
        id: eventId,
        event_type: eventType,
        payload_json: JSON.stringify(payload),
        status: "FAILED",
        timestamp,
        error_message: errorMsg,
      });

      await this.retryRepo.save({
        id: crypto.randomUUID(),
        event_id: eventId,
        retry_count: 0,
        next_attempt: new Date(Date.now() + 60000).toISOString(),
      });

      await globalEventBus.publish({
        type: "SynchronizationFailed",
        timestamp,
        payload: { eventId, eventType, error: errorMsg },
      });
    }
  }

  async replayEvent(eventId: string): Promise<void> {
    const row = await this.logRepo.findById(eventId);
    if (!row) throw new Error(`Integration event log "${eventId}" not found.`);

    const payload = JSON.parse(row.payload_json);
    this.processedEventIds.delete(eventId);

    await this.handleEvent(row.event_type, {
      ...payload,
      eventId,
    });
  }
}
