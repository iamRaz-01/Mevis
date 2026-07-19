import { type ContextHealth, type ValidationManifest, type ContextValidationContext } from "./context";
import { type ContextPackage } from "../context/context";
import { ConsistencyEngine } from "./consistency";
import { CompletenessEngine } from "./completeness";
import { FreshnessEngine } from "./freshness";
import { ConflictDetectionEngine } from "./conflict";
import { QualityEngine } from "./quality";
import { ConfidenceEngine } from "./confidence";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("ValidationOrchestrator");

export interface ContextValidationRepoPort {
  saveValidation(val: {
    id: string;
    health_status: string;
    health_score: number;
    manifest_json: string;
    created_at: string;
  }): Promise<void>;
}

export class ValidationOrchestrator {
  private readonly consistencyEngine = new ConsistencyEngine();
  private readonly completenessEngine = new CompletenessEngine();
  private readonly freshnessEngine = new FreshnessEngine();
  private readonly conflictEngine = new ConflictDetectionEngine();
  private readonly qualityEngine = new QualityEngine();
  private readonly confidenceEngine = new ConfidenceEngine();

  constructor(private readonly repo: ContextValidationRepoPort) {}

  async validateContextPackage(pkg: ContextPackage): Promise<ContextHealth> {
    const startTime = Date.now();
    logger.info(`Starting validation check for package "${pkg.packageId}".`);

    const checkedTime = new Date().toISOString();
    const ctx: ContextValidationContext = {
      contextPackage: pkg,
      validationRules: { confidenceThreshold: 0.6 },
      intermediateResults: {},
      timeline: {
        compiledTime: pkg.timeline.compiledTime,
        checkedTime,
      },
    };

    const consistency = this.consistencyEngine.validate(ctx);
    const completeness = this.completenessEngine.validate(ctx);
    const freshness = this.freshnessEngine.validate(ctx);
    const conflicts = this.conflictEngine.validate(ctx);
    const quality = this.qualityEngine.validate(ctx);

    const confidence = this.confidenceEngine.calculateConfidence(
      consistency.passed,
      completeness.passed,
      freshness.passed,
      conflicts.conflicts.length,
      quality.score
    );

    const isTrusted = confidence.score >= 0.6;
    const status = isTrusted ? "TRUSTED" : "UNTRUSTED";

    const manifest: ValidationManifest = {
      packageId: pkg.packageId,
      consistencyPassed: consistency.passed,
      completenessPassed: completeness.passed,
      freshnessPassed: freshness.passed,
      conflictsFound: conflicts.conflicts,
      qualityScore: quality.score,
      confidenceScore: confidence.score,
      explainableFactors: [
        ...consistency.issues,
        ...completeness.issues,
        ...freshness.issues,
        ...conflicts.conflicts,
        ...quality.factors,
        ...confidence.factors,
      ],
      checkedAt: checkedTime,
    };

    const health: ContextHealth = {
      packageId: pkg.packageId,
      status,
      score: confidence.score,
      manifest,
    };

    await this.repo.saveValidation({
      id: pkg.packageId,
      health_status: status,
      health_score: confidence.score,
      manifest_json: JSON.stringify(manifest),
      created_at: checkedTime,
    });

    const durationMs = Date.now() - startTime;
    await globalEventBus.publish({
      type: "ValidationCompleted",
      timestamp: checkedTime,
      payload: { packageId: pkg.packageId, status, score: confidence.score, latencyMs: durationMs },
    });

    await globalEventBus.publish({
      type: "QualityUpdated",
      timestamp: checkedTime,
      payload: { packageId: pkg.packageId, qualityScore: quality.score },
    });

    await globalEventBus.publish({
      type: "ConfidenceUpdated",
      timestamp: checkedTime,
      payload: { packageId: pkg.packageId, confidenceScore: confidence.score },
    });

    if (isTrusted) {
      await globalEventBus.publish({
        type: "ContextValidated",
        timestamp: checkedTime,
        payload: { packageId: pkg.packageId },
      });
    } else {
      await globalEventBus.publish({
        type: "ContextRejected",
        timestamp: checkedTime,
        payload: { packageId: pkg.packageId, reasons: manifest.explainableFactors },
      });
    }

    if (conflicts.conflicts.length > 0) {
      await globalEventBus.publish({
        type: "ConflictDetected",
        timestamp: checkedTime,
        payload: { packageId: pkg.packageId, count: conflicts.conflicts.length },
      });
    }

    if (!freshness.passed) {
      await globalEventBus.publish({
        type: "ContextExpired",
        timestamp: checkedTime,
        payload: { packageId: pkg.packageId },
      });
    }

    metrics.counter("world_context_validations_total").increment();
    metrics.gauge("world_context_validation_score").set(confidence.score);
    metrics.gauge("world_context_validation_latency_ms").set(durationMs);

    logger.info(`Validation check finished for package "${pkg.packageId}". Health status: ${status} (Score: ${confidence.score.toFixed(2)}).`);

    return health;
  }
}
