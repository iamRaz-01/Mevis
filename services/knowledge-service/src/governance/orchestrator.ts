import { 
  type PolicyRules, 
  type EvaluationResult, 
  type GovernanceManifest, 
  type GovernedAsset 
} from "./context";
import { ValidationEngine } from "./validation";
import { QualityEngine } from "./quality";
import { FreshnessEngine } from "./freshness";
import { DuplicateDetectionEngine } from "./duplicate";
import { PolicyEngine } from "./policy";
import { AuditEngine, type AuditRecord } from "./audit";
import { HealthEngine } from "./health";
import { type IndexedChunk } from "../search/index-port";
import { type FilterAssetMetadata } from "../search/filter";
import { globalEventBus } from "../pipeline/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("GovernanceOrchestrator");

export interface GovernanceAssetRepoPort {
  findAssetById(id: string): Promise<any>;
  findAllAssets(): Promise<any[]>;
  findDocsByAssetId(assetId: string): Promise<any[]>;
  findVersionsByDocId(docId: string): Promise<any[]>;
  findManifestsByVersionId(versionId: string): Promise<any[]>;
  getAllChunks(): IndexedChunk[];
}

export interface GovernanceHealthRepoPort {
  saveHealth(record: {
    asset_id: string;
    health_score: number;
    quality_score: number;
    freshness_status: string;
    policy_compliant: number;
    explanation: string;
    updated_at: string;
  }): Promise<void>;
  findHealthByAssetId(assetId: string): Promise<any>;
}

export interface GovernanceAuditRepoPort {
  saveAuditRecord(record: AuditRecord): Promise<void>;
  findAuditRecordsByAssetId(assetId: string): Promise<readonly AuditRecord[]>;
}

export class GovernanceOrchestrator {
  private readonly validator = new ValidationEngine();
  private readonly qualityEngine = new QualityEngine();
  private readonly freshnessEngine = new FreshnessEngine();
  private readonly duplicateEngine = new DuplicateDetectionEngine();
  private readonly policyEngine = new PolicyEngine();
  private readonly auditEngine: AuditEngine;
  private readonly healthEngine = new HealthEngine();

  constructor(
    private readonly assetRepoPort: GovernanceAssetRepoPort,
    private readonly healthRepoPort: GovernanceHealthRepoPort,
    private readonly auditRepoPort: GovernanceAuditRepoPort
  ) {
    this.auditEngine = new AuditEngine(auditRepoPort);
  }

  async evaluateAsset(assetId: string, policy: PolicyRules): Promise<EvaluationResult> {
    const asset = await this.assetRepoPort.findAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found for governance check.`);
    }

    // 1. Gather all documents, versions, and manifests
    const docs = await this.assetRepoPort.findDocsByAssetId(assetId);
    const docIds = docs.map(d => d.id);
    
    const versions: any[] = [];
    for (const docId of docIds) {
      const vList = await this.assetRepoPort.findVersionsByDocId(docId);
      versions.push(...vList);
    }
    
    const manifests: any[] = [];
    for (const v of versions) {
      const mList = await this.assetRepoPort.findManifestsByVersionId(v.id);
      manifests.push(...mList);
    }

    const allChunks = this.assetRepoPort.getAllChunks();
    const assetChunks = allChunks.filter(c => c.asset_id === assetId);

    // 2. Execute validation
    const validation = this.validator.validate(asset, docs, versions, manifests);

    // 3. Execute quality check
    const quality = this.qualityEngine.assess(asset, assetChunks);

    // 4. Execute freshness
    const freshness = this.freshnessEngine.evaluate(asset, policy);

    // 5. Execute duplicate detection
    const duplicates = this.duplicateEngine.detect(assetId, assetChunks, allChunks);

    // 6. Execute policy compliance check
    const compliance = this.policyEngine.evaluate(asset, quality.score, freshness, policy);

    // 7. Calculate overall health
    const health = this.healthEngine.calculate(validation.valid, quality.score, freshness, compliance.compliant);

    const result: EvaluationResult = {
      assetId,
      valid: validation.valid,
      validationErrors: validation.errors,
      qualityScore: quality.score,
      qualityErrors: quality.errors,
      freshnessStatus: freshness,
      policyCompliant: compliance.compliant,
      policyViolations: compliance.violations,
      duplicateFlag: duplicates.duplicateFlag,
      duplicateDetails: duplicates.details,
      healthScore: health.healthScore,
      explanation: health.explanation,
    };

    // 8. Log immutable audit records for any changes/events
    const eventTime = new Date().toISOString();
    
    await this.auditEngine.logEvent(assetId, "HealthScoreUpdated", {
      healthScore: health.healthScore,
      explanation: health.explanation,
    });

    if (!validation.valid) {
      await this.auditEngine.logEvent(assetId, "ValidationFailed", { errors: validation.errors });
      await globalEventBus.publish({
        type: "KnowledgeRejected",
        timestamp: eventTime,
        payload: { assetId, errors: validation.errors },
      });
    } else {
      await this.auditEngine.logEvent(assetId, "ValidationPassed", {});
      await globalEventBus.publish({
        type: "KnowledgeValidated",
        timestamp: eventTime,
        payload: { assetId },
      });
    }

    if (freshness === "Expired") {
      await this.auditEngine.logEvent(assetId, "KnowledgeExpired", { expirationDate: asset.expiration_date });
      await globalEventBus.publish({
        type: "KnowledgeExpired",
        timestamp: eventTime,
        payload: { assetId, expiredAt: asset.expiration_date },
      });
    }

    if (!compliance.compliant) {
      await this.auditEngine.logEvent(assetId, "PolicyViolation", { violations: compliance.violations });
      await globalEventBus.publish({
        type: "KnowledgePolicyViolation",
        timestamp: eventTime,
        payload: { assetId, violations: compliance.violations },
      });
    }

    await globalEventBus.publish({
      type: "KnowledgeHealthUpdated",
      timestamp: eventTime,
      payload: { assetId, healthScore: health.healthScore, freshnessStatus: freshness },
    });

    // 9. Persist current health record status
    await this.healthRepoPort.saveHealth({
      asset_id: assetId,
      health_score: health.healthScore,
      quality_score: quality.score,
      freshness_status: freshness,
      policy_compliant: compliance.compliant ? 1 : 0,
      explanation: health.explanation,
      updated_at: eventTime,
    });

    return result;
  }

  async evaluateAll(policy: PolicyRules): Promise<GovernanceManifest> {
    const startTime = Date.now();
    const assets = await this.assetRepoPort.findAllAssets();

    let passedCount = 0;
    let violationsCount = 0;
    let duplicatesCount = 0;
    let healthSum = 0;

    for (const asset of assets) {
      const res = await this.evaluateAsset(asset.id, policy);
      
      healthSum += res.healthScore;
      if (res.valid) passedCount++;
      if (!res.policyCompliant) violationsCount++;
      if (res.duplicateFlag) duplicatesCount++;
    }

    const averageHealth = assets.length > 0 ? (healthSum / assets.length) : 1.0;
    const durationMs = Date.now() - startTime;

    // Emit operational metrics
    metrics.counter("governance_evaluations_total").increment();
    metrics.gauge("governance_latency_ms").set(durationMs);
    metrics.gauge("governance_average_health").set(averageHealth);

    const manifest: GovernanceManifest = {
      executionTimeMs: durationMs,
      assetsEvaluated: assets.length,
      passedCount,
      violationsCount,
      duplicatesCount,
      averageHealth: parseFloat(averageHealth.toFixed(3)),
      createdAt: new Date().toISOString(),
    };

    await globalEventBus.publish({
      type: "GovernanceCompleted",
      timestamp: manifest.createdAt,
      payload: { ...manifest },
    });

    return manifest;
  }
}
