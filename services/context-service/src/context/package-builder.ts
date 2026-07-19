import { 
  type ContextPackage, 
  type ContextManifest, 
  type Situation
} from "./context";
import { ContextBuilder } from "./builder";
import { ContextRelationshipEngine } from "./relationship";
import { PrioritizationEngine } from "./prioritization";
import { CompressionEngine } from "./compression";
import { SituationEngine } from "./situation";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("ContextPackageBuilder");

export interface ContextPackageRepoPort {
  savePackage(pkg: {
    id: string;
    situation_id: string;
    package_data_json: string;
    manifest_json: string;
    created_at: string;
  }): Promise<void>;
}

export interface ContextSituationRepoPort {
  saveSituation(sit: {
    id: string;
    title: string;
    severity: string;
    status: string;
    entities_involved: string;
    created_at: string;
  }): Promise<void>;
}

export class ContextPackageBuilder {
  private readonly relationshipEngine = new ContextRelationshipEngine();
  private readonly prioritizationEngine = new PrioritizationEngine();
  private readonly compressionEngine = new CompressionEngine();
  private readonly situationEngine = new SituationEngine();

  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly packageRepo: ContextPackageRepoPort,
    private readonly situationRepo: ContextSituationRepoPort
  ) {}

  async buildContextPackage(limit: number = 5): Promise<{ readonly pkg: ContextPackage; readonly manifest: ContextManifest }> {
    const startTime = Date.now();
    logger.info("Starting Context Package compilation cycle.");

    // 1. Assemble raw context sources
    const rawContext = await this.contextBuilder.assemble();

    // 2. Build dynamic contextual relationships
    const relationships = this.relationshipEngine.buildRelationships(rawContext);

    // 3. Compute deterministic priorities
    const facts = this.prioritizationEngine.prioritize(rawContext);

    // 4. Compress to fit window limits
    const { compressedFacts, compressedRelationships } = this.compressionEngine.compress(facts, relationships, limit);

    // 5. Group into active situations
    const situations = this.situationEngine.assembleSituations(rawContext);
    const mainSituation = situations[0] || {
      situationId: "situation:general_operational_status",
      title: "General Operational Status",
      severity: "LOW",
      status: "ACTIVE",
      entitiesInvolved: [],
      createdAt: new Date().toISOString(),
    };

    // Save active situations to repository
    for (const sit of situations) {
      await this.situationRepo.saveSituation({
        id: sit.situationId,
        title: sit.title,
        severity: sit.severity,
        status: sit.status,
        entities_involved: JSON.stringify(sit.entitiesInvolved),
        created_at: sit.createdAt,
      });

      await globalEventBus.publish({
        type: "SituationCreated",
        timestamp: sit.createdAt,
        payload: { situationId: sit.situationId, title: sit.title, severity: sit.severity },
      });
    }

    const eventTimeStr = new Date().toISOString();
    const pkgId = `pkg:${crypto.randomUUID()}`;

    // 6. Compile package
    const pkg: ContextPackage = {
      packageId: pkgId,
      situationId: mainSituation.situationId,
      involvedEntities: compressedFacts.map(f => f.entityId),
      contextualRelationships: compressedRelationships,
      prioritizedFacts: compressedFacts,
      evidenceReferences: rawContext.evidenceReferences,
      timeline: {
        eventTime: eventTimeStr,
        compiledTime: new Date().toISOString(),
      },
      confidence: 1.0,
      provenance: {
        worldModel: "relational_world_entities",
        worldState: "relational_world_latest_states",
      },
      metadata: { limitApplied: limit },
    };

    // 7. Compile manifest
    const durationMs = Date.now() - startTime;
    const serializedData = JSON.stringify(pkg);
    const packageSize = Buffer.byteLength(serializedData);

    const manifest: ContextManifest = {
      sourcesConsumed: ["WorldModel", "WorldStateStore", "EvidenceReferences"],
      entitiesSelected: pkg.involvedEntities,
      evidenceReferences: pkg.evidenceReferences,
      prioritizationDecisions: facts.reduce((acc, f) => {
        acc[f.entityId] = f.priorityScore;
        return acc;
      }, {} as Record<string, number>),
      compressionStatistics: {
        originalCount: facts.length,
        compressedCount: compressedFacts.length,
      },
      timeline: {
        eventTime: pkg.timeline.eventTime,
        compiledTime: pkg.timeline.compiledTime,
      },
      latencyMs: durationMs,
      packageSize,
    };

    // 8. Commit package details
    await this.packageRepo.savePackage({
      id: pkg.packageId,
      situation_id: pkg.situationId,
      package_data_json: serializedData,
      manifest_json: JSON.stringify(manifest),
      created_at: eventTimeStr,
    });

    // 9. Publish platform events
    await globalEventBus.publish({
      type: "ContextBuilt",
      timestamp: eventTimeStr,
      payload: { packageId: pkg.packageId, situationId: pkg.situationId },
    });

    await globalEventBus.publish({
      type: "ContextPackagePublished",
      timestamp: eventTimeStr,
      payload: { packageId: pkg.packageId, size: packageSize },
    });

    metrics.counter("world_context_packages_built_total").increment();
    metrics.gauge("world_context_build_latency_ms").set(durationMs);

    logger.info(`Context package "${pkg.packageId}" compiled successfully. Size: ${packageSize} bytes.`);

    return { pkg, manifest };
  }
}
