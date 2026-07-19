import { type DigitalTwinContext } from "./context";
import { type DigitalTwinRegistry } from "./registry";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("DigitalTwinBuilder");

export interface TwinSourceReaderPort {
  loadWorldEntities(): Promise<readonly any[]>;
  loadWorldRelationships(): Promise<readonly any[]>;
}

export class DigitalTwinBuilder {
  constructor(
    private readonly sourceReader: TwinSourceReaderPort,
    private readonly registry: DigitalTwinRegistry
  ) {}

  async rebuildTwin(validatedCtx: any): Promise<DigitalTwinContext> {
    const startTime = Date.now();
    logger.info("Starting Digital Twin projection rebuild cycle.");

    const rawEntities = await this.sourceReader.loadWorldEntities();
    const rawRels = await this.sourceReader.loadWorldRelationships();

    const entities: Record<string, any> = {};
    for (const ent of rawEntities) {
      entities[ent.id] = {
        id: ent.id,
        entityType: ent.entity_type,
        displayName: ent.display_name,
        parentEntityId: ent.parent_entity_id,
        identityRef: ent.identity_ref,
        metadata: ent.metadata_json ? JSON.parse(ent.metadata_json) : {},
      };
    }

    if (validatedCtx && validatedCtx.pkg && validatedCtx.pkg.prioritizedFacts) {
      for (const fact of validatedCtx.pkg.prioritizedFacts) {
        if (entities[fact.entityId]) {
          entities[fact.entityId].latestState = {
            description: fact.description,
            priorityScore: fact.priorityScore,
            provenance: fact.provenance,
            attributes: fact.attributes,
          };
        }
      }
    }

    const currentEventTime = validatedCtx?.pkg?.timeline?.eventTime || new Date().toISOString();
    const synchronizedTime = new Date().toISOString();

    const timeline = { currentEventTime, synchronizedTime };
    const confidence = {
      score: validatedCtx?.health?.score ?? 1.0,
      factors: validatedCtx?.health?.manifest?.explainableFactors ?? [],
    };

    const relationships = rawRels.map(r => ({
      sourceId: r.source_entity_id,
      targetId: r.target_entity_id,
      relationshipType: r.relationship_type,
      metadata: r.metadata_json ? JSON.parse(r.metadata_json) : {},
    }));

    const activeSituations = validatedCtx?.pkg?.situations || [];

    const twinContext: DigitalTwinContext = {
      entities,
      relationships,
      validatedContext: validatedCtx,
      activeSituations,
      timeline,
      confidence,
      provenance: "MEVIS Digital Twin Builder projection",
    };

    this.registry.setTwinContext(twinContext);

    const latencyMs = Date.now() - startTime;
    await globalEventBus.publish({
      type: "TwinUpdated",
      timestamp: synchronizedTime,
      payload: { latencyMs },
    });

    await globalEventBus.publish({
      type: "TwinRebuilt",
      timestamp: synchronizedTime,
      payload: { entitiesCount: Object.keys(entities).length },
    });

    metrics.counter("world_twin_rebuilds_total").increment();
    metrics.gauge("world_twin_sync_latency_ms").set(latencyMs);

    logger.info(`Digital Twin projection rebuilt successfully in ${latencyMs}ms.`);

    return twinContext;
  }
}
