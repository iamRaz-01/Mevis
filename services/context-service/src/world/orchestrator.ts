import { 
  type WorldEntity, 
  type WorldRelationship, 
  type WorldManifest,
  type TimelineConfig
} from "./context";
import { EntityRegistry } from "./entity-registry";
import { RelationshipEngine } from "./relationship";
import { HierarchyEngine } from "./hierarchy";
import { TimelineFoundation } from "./timeline";
import { IdentityMapping } from "./identity";
import { globalEventBus } from "./event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("WorldModelOrchestrator");

export interface WorldEntityRepoPort {
  saveEntity(entity: {
    id: string;
    entity_type: string;
    display_name: string;
    parent_entity_id: string | null;
    identity_ref: string | null;
    metadata_json: string;
    created_at: string;
  }): Promise<void>;
  findEntityById(id: string): Promise<any>;
  findAllEntities(): Promise<readonly any[]>;
}

export interface WorldRelationshipRepoPort {
  saveRelationship(rel: {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    metadata_json: string;
    created_at: string;
  }): Promise<void>;
  findRelationshipById(id: string): Promise<any>;
  findAllRelationships(): Promise<readonly any[]>;
}

export class WorldModelOrchestrator {
  private readonly entityRegistry = new EntityRegistry();
  private readonly relationshipEngine = new RelationshipEngine();
  private readonly hierarchyEngine = new HierarchyEngine();
  private readonly timelineFoundation = new TimelineFoundation();
  private readonly identityMapping = new IdentityMapping();

  constructor(
    private readonly entityRepo: WorldEntityRepoPort,
    private readonly relationshipRepo: WorldRelationshipRepoPort
  ) {}

  async registerEntity(
    entityType: string,
    displayName: string,
    parentEntityId: string | null = null,
    identityRef: string | null = null,
    capabilities: readonly string[] = [],
    timeline: TimelineConfig = { validFrom: new Date().toISOString(), validTo: null, scheduledTimes: [] },
    metadata: Record<string, any> = {}
  ): Promise<WorldEntity> {
    logger.info(`Registering entity of type "${entityType}": "${displayName}".`);

    // 1. Verify parent existence
    if (parentEntityId) {
      const parent = await this.entityRepo.findEntityById(parentEntityId);
      if (!parent) {
        throw new Error(`Parent entity "${parentEntityId}" does not exist in registry.`);
      }
    }

    // 2. Validate identity reference
    if (identityRef) {
      this.identityMapping.mapIdentity(displayName, identityRef);
    }

    // 3. Validate timeline parameters
    this.timelineFoundation.createTimeline(timeline.validFrom, timeline.validTo, timeline.scheduledTimes);

    // 4. Instantiate model
    const entity = this.entityRegistry.register(
      entityType,
      displayName,
      parentEntityId,
      identityRef,
      capabilities,
      timeline,
      metadata
    );

    // 5. Commit to repository
    await this.entityRepo.saveEntity({
      id: entity.id,
      entity_type: entity.entityType,
      display_name: entity.displayName,
      parent_entity_id: entity.parentEntityId,
      identity_ref: entity.identityRef,
      metadata_json: JSON.stringify({
        capabilities: entity.capabilities,
        timeline: entity.timeline,
        metadata: entity.metadata,
      }),
      created_at: new Date().toISOString(),
    });

    // 6. Publish register event
    await globalEventBus.publish({
      type: "EntityRegistered",
      timestamp: new Date().toISOString(),
      payload: { entityId: entity.id, entityType: entity.entityType, displayName: entity.displayName },
    });

    metrics.counter("world_entities_registered_total").increment();

    return entity;
  }

  async addRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationshipType: string,
    metadata: Record<string, any> = {}
  ): Promise<WorldRelationship> {
    logger.info(`Creating relationship "${relationshipType}" between "${sourceEntityId}" and "${targetEntityId}".`);

    // 1. Verify source and target existence
    const source = await this.entityRepo.findEntityById(sourceEntityId);
    if (!source) {
      throw new Error(`Source entity "${sourceEntityId}" does not exist in registry.`);
    }

    const target = await this.entityRepo.findEntityById(targetEntityId);
    if (!target) {
      throw new Error(`Target entity "${targetEntityId}" does not exist in registry.`);
    }

    // 2. Instantiate relationship model
    const rel = this.relationshipEngine.createRelationship(
      sourceEntityId,
      targetEntityId,
      relationshipType,
      metadata
    );

    // 3. Commit to repository
    await this.relationshipRepo.saveRelationship({
      id: rel.id,
      source_entity_id: rel.sourceEntityId,
      target_entity_id: rel.targetEntityId,
      relationship_type: rel.relationshipType,
      metadata_json: JSON.stringify(rel.metadata),
      created_at: new Date().toISOString(),
    });

    // 4. Publish relationship event
    await globalEventBus.publish({
      type: "RelationshipCreated",
      timestamp: new Date().toISOString(),
      payload: { id: rel.id, sourceEntityId: rel.sourceEntityId, targetEntityId: rel.targetEntityId, relationshipType: rel.relationshipType },
    });

    metrics.counter("world_relationships_created_total").increment();

    return rel;
  }

  async buildManifest(): Promise<WorldManifest> {
    const startTime = Date.now();
    logger.info("Building World Model initialization manifest.");

    const dbEntities = await this.entityRepo.findAllEntities();
    const dbRelationships = await this.relationshipRepo.findAllRelationships();

    // Map database rows to in-memory context records
    const entitiesRecord: Record<string, WorldEntity> = {};
    const entityTypesCount: Record<string, number> = {};

    for (const row of dbEntities) {
      let parsedJson: any = { capabilities: [], timeline: { validFrom: new Date().toISOString(), validTo: null, scheduledTimes: [] }, metadata: {} };
      try {
        parsedJson = JSON.parse(row.metadata_json);
      } catch {}

      entitiesRecord[row.id] = {
        id: row.id,
        entityType: row.entity_type,
        displayName: row.display_name,
        parentEntityId: row.parent_entity_id,
        identityRef: row.identity_ref,
        capabilities: parsedJson.capabilities || [],
        timeline: parsedJson.timeline,
        metadata: parsedJson.metadata || {},
      };

      entityTypesCount[row.entity_type] = (entityTypesCount[row.entity_type] || 0) + 1;
    }

    const relationshipsRecord: Record<string, WorldRelationship> = {};
    for (const row of dbRelationships) {
      let parsedMeta: any = {};
      try {
        parsedMeta = JSON.parse(row.metadata_json);
      } catch {}

      relationshipsRecord[row.id] = {
        id: row.id,
        sourceEntityId: row.source_entity_id,
        targetEntityId: row.target_entity_id,
        relationshipType: row.relationship_type,
        metadata: parsedMeta,
      };
    }

    // Calculate hierarchy depth
    const maxDepth = this.hierarchyEngine.getHierarchyDepth(entitiesRecord);

    // Verify integrity (check dangling relationship pointers)
    let integrityPassed = true;
    for (const rel of Object.values(relationshipsRecord)) {
      if (!entitiesRecord[rel.sourceEntityId] || !entitiesRecord[rel.targetEntityId]) {
        logger.warn(`Dangling relationship pointers detected on rel ID "${rel.id}".`);
        integrityPassed = false;
      }
    }

    const durationMs = Date.now() - startTime;
    const manifest: WorldManifest = {
      entitiesCreated: dbEntities.length,
      relationshipCount: dbRelationships.length,
      hierarchyDepth: maxDepth,
      entityTypes: entityTypesCount,
      integrityPassed,
      createdAt: new Date().toISOString(),
    };

    await globalEventBus.publish({
      type: "WorldManifestGenerated",
      timestamp: manifest.createdAt,
      payload: { ...manifest },
    });

    metrics.gauge("world_manifest_entities_count").set(manifest.entitiesCreated);
    metrics.gauge("world_manifest_relationships_count").set(manifest.relationshipCount);
    metrics.gauge("world_manifest_hierarchy_depth").set(manifest.hierarchyDepth);
    metrics.gauge("world_manifest_latency_ms").set(durationMs);

    logger.info(`World manifest built successfully. Integrity status: ${integrityPassed ? "PASS" : "FAIL"}.`);

    return manifest;
  }
}
