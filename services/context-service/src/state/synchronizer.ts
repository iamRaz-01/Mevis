import { type NormalizedEvent, type EntityState, type SyncManifest } from "./context";
import { EventIngestion } from "./ingestion";
import { WorldStateStore } from "./store";
import { SnapshotEngine } from "./snapshot";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("StateSynchronizer");

export interface EntityCheckPort {
  entityExists(entityId: string): Promise<boolean>;
}

export class StateSynchronizer {
  private readonly ingestion = new EventIngestion();
  private readonly snapshotEngine: SnapshotEngine;

  constructor(
    private readonly store: WorldStateStore,
    private readonly entityChecker: EntityCheckPort,
    snapshotEngine: SnapshotEngine
  ) {
    this.snapshotEngine = snapshotEngine;
  }

  async processEvent(rawEvent: any): Promise<{ readonly manifest: SyncManifest; readonly updatedState: EntityState | null }> {
    const startTime = Date.now();
    logger.info("Processing incoming operational event.");

    let eventsProcessed = 0;
    let entitiesUpdated = 0;
    let conflictsDetected = 0;
    let duplicatesIgnored = 0;
    let snapshotsGenerated = 0;
    let updatedState: EntityState | null = null;

    try {
      // 1. Normalize Event
      const norm = this.ingestion.normalize(rawEvent);
      eventsProcessed++;

      // 2. Validate target entity exists in World Model
      const exists = await this.entityChecker.entityExists(norm.entityId);
      if (!exists) {
        throw new Error(`Target entity "${norm.entityId}" does not exist in World Model.`);
      }

      // 3. Idempotency check (Duplicate check)
      const isDuplicate = await this.store.isDuplicateEvent(norm.eventId);
      if (isDuplicate) {
        logger.info(`Duplicate event ID "${norm.eventId}" detected. Ignoring.`);
        duplicatesIgnored++;
        const manifest = this.buildSyncManifest(startTime, eventsProcessed, entitiesUpdated, conflictsDetected, duplicatesIgnored, snapshotsGenerated);
        return { manifest, updatedState };
      }

      // 4. Conflict resolution (Ordering checks)
      const current = await this.store.getLatestState(norm.entityId);
      if (current) {
        const currentEventTime = Date.parse(current.lastEventTime);
        const incomingEventTime = Date.parse(norm.eventTime);

        if (incomingEventTime <= currentEventTime) {
          logger.warn(`Out-of-order event "${norm.eventId}" for entity "${norm.entityId}". Incoming time ${norm.eventTime} <= last time ${current.lastEventTime}.`);
          conflictsDetected++;
          
          // Record event ingestion so we don't process it again
          await this.store.recordEventIngestion(norm.eventId, norm.entityId, norm.eventType, norm.eventTime, norm.payload, norm.source, norm.version);
          
          const manifest = this.buildSyncManifest(startTime, eventsProcessed, entitiesUpdated, conflictsDetected, duplicatesIgnored, snapshotsGenerated);
          return { manifest, updatedState };
        }
      }

      // 5. Update latest state details
      const newStateData = current ? { ...current.stateData, ...norm.payload } : { ...norm.payload };
      const eventTimeStr = new Date().toISOString();

      updatedState = {
        entityId: norm.entityId,
        stateData: newStateData,
        lastEventId: norm.eventId,
        lastEventTime: norm.eventTime,
        updatedAt: eventTimeStr,
      };

      // 6. Save latest state and event details
      await this.store.recordEventIngestion(norm.eventId, norm.entityId, norm.eventType, norm.eventTime, norm.payload, norm.source, norm.version);
      await this.store.saveState(updatedState);
      
      const historyId = crypto.randomUUID();
      await this.store.saveHistory(historyId, norm.entityId, newStateData, norm.eventId, norm.eventTime);
      entitiesUpdated++;

      // 7. Publish state updates events
      await globalEventBus.publish({
        type: "StateUpdated",
        timestamp: eventTimeStr,
        payload: { entityId: norm.entityId, eventType: norm.eventType, state: newStateData },
      });

      if (norm.eventType === "VolunteerMoved") {
        await globalEventBus.publish({
          type: "EntityMoved",
          timestamp: eventTimeStr,
          payload: { entityId: norm.entityId, location: norm.payload.location },
        });
      } else if (norm.eventType === "IncidentCreated" || norm.eventType === "IncidentUpdated") {
        await globalEventBus.publish({
          type: "IncidentUpdated",
          timestamp: eventTimeStr,
          payload: { entityId: norm.entityId, status: norm.payload.status },
        });
      } else if (norm.eventType === "WeatherUpdated") {
        await globalEventBus.publish({
          type: "WeatherChanged",
          timestamp: eventTimeStr,
          payload: { temperature: norm.payload.temperature, wind: norm.payload.wind },
        });
      }

      // 8. Trigger Snapshot creation
      const allStates = await this.store.getAllLatestStates();
      await this.snapshotEngine.takeSnapshot(allStates);
      snapshotsGenerated++;

      await globalEventBus.publish({
        type: "SnapshotCreated",
        timestamp: eventTimeStr,
        payload: { count: allStates.length },
      });

    } catch (err: any) {
      logger.error("Error in state synchronizer:", { error: err?.message || String(err) });
      metrics.counter("world_sync_failures_total").increment();
      throw err;
    }

    const durationMs = Date.now() - startTime;
    metrics.counter("world_sync_events_processed_total").increment(eventsProcessed);
    metrics.gauge("world_sync_latency_ms").set(durationMs);

    const manifest = this.buildSyncManifest(startTime, eventsProcessed, entitiesUpdated, conflictsDetected, duplicatesIgnored, snapshotsGenerated);

    await globalEventBus.publish({
      type: "SynchronizationCompleted",
      timestamp: manifest.createdAt,
      payload: { ...manifest },
    });

    return { manifest, updatedState };
  }

  private buildSyncManifest(
    startTime: number,
    eventsProcessed: number,
    entitiesUpdated: number,
    conflictsDetected: number,
    duplicatesIgnored: number,
    snapshotsGenerated: number
  ): SyncManifest {
    return {
      eventsProcessed,
      entitiesUpdated,
      conflictsDetected,
      duplicatesIgnored,
      snapshotsGenerated,
      latencyMs: Date.now() - startTime,
      createdAt: new Date().toISOString(),
    };
  }
}
