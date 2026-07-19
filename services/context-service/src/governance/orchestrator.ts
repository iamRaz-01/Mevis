import { type TrustedDecision, type GovernanceManifest } from "./context";
import { PolicyEngine } from "./policy";
import { SafetyEngine } from "./safety";
import { ComplianceEngine } from "./compliance";
import { ConflictDetectionEngine } from "./conflict";
import { ConfidenceEngine } from "./confidence";
import { ApprovalRoutingEngine } from "./approval";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("DecisionValidationOrchestrator");

export interface TrustedDecisionRepoPort {
  save(td: {
    readonly id: string;
    readonly decision_id: string;
    readonly decision_package_id: string;
    readonly decision_data_json: string;
    readonly governance_manifest_json: string;
    readonly created_at: string;
  }): Promise<void>;
}

export class DecisionValidationOrchestrator {
  private readonly policyEngine = new PolicyEngine();
  private readonly safetyEngine = new SafetyEngine();
  private readonly complianceEngine = new ComplianceEngine();
  private readonly conflictEngine: ConflictDetectionEngine;
  private readonly confidenceEngine = new ConfidenceEngine();
  private readonly approvalEngine = new ApprovalRoutingEngine();

  constructor(
    resourceChecker: any,
    private readonly repo: TrustedDecisionRepoPort
  ) {
    this.conflictEngine = new ConflictDetectionEngine(resourceChecker);
  }

  async validatePackage(pkg: any): Promise<TrustedDecision> {
    const startTime = Date.now();
    logger.info(`Starting Decision Validation for package: "${pkg.id}".`);

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "DecisionValidationStarted",
      timestamp,
      payload: { packageId: pkg.id, decisionId: pkg.decisionId },
    });

    const policyCompliance = this.policyEngine.validatePolicies(pkg);
    await globalEventBus.publish({
      type: "PolicyValidationCompleted",
      timestamp,
      payload: { packageId: pkg.id, compliant: policyCompliance.compliant },
    });

    const safetyStatus = this.safetyEngine.validateSafety(pkg);
    await globalEventBus.publish({
      type: "SafetyValidationCompleted",
      timestamp,
      payload: { packageId: pkg.id, safe: safetyStatus.safe },
    });

    const complianceStatus = this.complianceEngine.validateCompliance(pkg);

    const conflicts = await this.conflictEngine.detectConflicts(pkg);
    if (conflicts.length > 0) {
      await globalEventBus.publish({
        type: "ConflictDetected",
        timestamp,
        payload: { packageId: pkg.id, conflictsCount: conflicts.length },
      });
    }

    const confidenceScore = this.confidenceEngine.deriveConfidenceScore(
      policyCompliance.compliant,
      safetyStatus.safe,
      conflicts.length > 0
    );

    const approvalRoute = this.approvalEngine.assignApprovalRoute(pkg.decisionCandidate?.decisionType || "General");
    await globalEventBus.publish({
      type: "ApprovalRouteAssigned",
      timestamp,
      payload: { packageId: pkg.id, approvalRoute },
    });

    const tdId = `td_${crypto.randomUUID()}`;
    const td: TrustedDecision = {
      id: tdId,
      decisionId: pkg.decisionId,
      decisionPackageId: pkg.id,
      package: pkg,
      policyCompliance,
      safetyStatus,
      complianceStatus,
      conflicts,
      confidenceScore,
      approvalRoute,
      createdAt: new Date().toISOString(),
    };

    const finalVerdict = (policyCompliance.compliant && safetyStatus.safe && conflicts.length === 0) ? "TRUSTED" : "REJECTED";
    const manifest: GovernanceManifest = {
      decisionId: pkg.decisionId,
      packageId: pkg.id,
      policiesChecked: ["pol_med_dispatch", "pol_med_shift_limits"],
      safetyIssuesCount: safetyStatus.issues.length,
      conflictsCount: conflicts.length,
      finalVerdict,
      timestamp: new Date().toISOString(),
    };

    await this.repo.save({
      id: td.id,
      decision_id: td.decisionId,
      decision_package_id: td.decisionPackageId,
      decision_data_json: JSON.stringify(td),
      governance_manifest_json: JSON.stringify(manifest),
      created_at: td.createdAt,
    });

    const elapsed = Date.now() - startTime;
    metrics.counter("world_governance_decisions_total").increment();
    metrics.gauge("world_governance_latency_ms").set(elapsed);

    await globalEventBus.publish({
      type: "DecisionGoverned",
      timestamp,
      payload: { packageId: pkg.id, verdict: finalVerdict },
    });

    await globalEventBus.publish({
      type: "TrustedDecisionCreated",
      timestamp,
      payload: { trustedDecisionId: td.id, verdict: finalVerdict },
    });

    logger.info(`Decision Package validated successfully in ${elapsed}ms. Verdict: ${finalVerdict}.`);
    return td;
  }
}
