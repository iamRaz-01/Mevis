import { type TrustPackage } from "./context";
import { type EvidenceResolver } from "./evidence-resolver";
import { type CitationEngine } from "./citation-engine";
import { type ReasoningTraceBuilder } from "./trace-builder";
import { type ConfidenceEngine } from "./confidence-engine";
import { type PersonalizationEngine } from "./personalization-engine";
import { globalEventBus } from "../../world/event-bus";
import crypto from "node:crypto";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("TrustOrchestrator");

export class TrustOrchestrator {
  constructor(
    public readonly evidenceResolver: EvidenceResolver,
    public readonly citationEngine: CitationEngine,
    public readonly traceBuilder: ReasoningTraceBuilder,
    public readonly confidenceEngine: ConfidenceEngine,
    public readonly personalizationEngine: PersonalizationEngine,
    private readonly trustRepo: any,
    private readonly evidenceRepo: any,
    private readonly citationRepo: any,
    private readonly traceRepo: any,
    private readonly scoreRepo: any,
    private readonly resultRepo: any,
    private readonly requestRepo: any,
    private readonly planRepo: any,
    private readonly stepRepo: any
  ) {}

  async buildTrustPackage(resultId: string, role = "ROLE_USER"): Promise<TrustPackage> {
    const result = await this.resultRepo.findById(resultId);
    if (!result) throw new Error(`Generation Result "${resultId}" not found.`);

    globalEventBus.publish({
      type: "TrustValidationStarted",
      payload: { resultId },
      timestamp: new Date().toISOString(),
    });

    const request = await this.requestRepo.findById(result.request_id);
    if (!request) {
      throw new Error(`Generation Request not found for result "${resultId}".`);
    }
    const planId = request.plan_id;
    const plan = await this.planRepo.findById(planId);
    if (!plan) throw new Error(`Reasoning Plan "${planId}" not found.`);

    const allSteps = await this.stepRepo.findAll();
    const steps = allSteps.filter((s: any) => s.plan_id === planId);

    const trustId = `trust_${crypto.randomUUID().slice(0, 8)}`;

    const evidence = this.evidenceResolver.resolveEvidence(trustId, plan.intent);
    globalEventBus.publish({
      type: "EvidenceResolved",
      payload: { trustId },
      timestamp: new Date().toISOString(),
    });

    const citations = this.citationEngine.extractCitations(trustId, plan.intent);
    globalEventBus.publish({
      type: "CitationAttached",
      payload: { trustId },
      timestamp: new Date().toISOString(),
    });

    const traces = this.traceBuilder.buildTraces(trustId, steps);
    globalEventBus.publish({
      type: "ReasoningTraceBuilt",
      payload: { trustId },
      timestamp: new Date().toISOString(),
    });

    const { overall, dimensions } = this.confidenceEngine.calculateConfidence(trustId, plan.intent);
    globalEventBus.publish({
      type: "ConfidenceCalculated",
      payload: { trustId, overall },
      timestamp: new Date().toISOString(),
    });

    const personalizedText = this.personalizationEngine.personalizePresentation(result.generated_text, role);
    globalEventBus.publish({
      type: "ResponsePersonalized",
      payload: { trustId },
      timestamp: new Date().toISOString(),
    });

    const trustPackage: TrustPackage = {
      id: trustId,
      resultId,
      overallConfidence: overall,
      createdAt: new Date().toISOString(),
      evidence,
      citations,
      traces,
      confidenceScores: dimensions,
    };

    await this.trustRepo.save({
      id: trustPackage.id,
      result_id: trustPackage.resultId,
      overall_confidence: trustPackage.overallConfidence,
      created_at: trustPackage.createdAt,
    });

    for (const ev of evidence) {
      await this.evidenceRepo.save({
        id: ev.id,
        trust_id: ev.trustId,
        source_type: ev.sourceType,
        source_id: ev.sourceId,
      });
    }

    for (const cit of citations) {
      await this.citationRepo.save({
        id: cit.id,
        trust_id: cit.trustId,
        reference_text: cit.referenceText,
      });
    }

    for (const trc of traces) {
      await this.traceRepo.save({
        id: trc.id,
        trust_id: trc.trustId,
        step_description: trc.stepDescription,
      });
    }

    for (const dim of dimensions) {
      await this.scoreRepo.save({
        id: dim.id,
        trust_id: dim.trustId,
        dimension: dim.dimension,
        score: dim.score,
      });
    }

    globalEventBus.publish({
      type: "TrustPackageCreated",
      payload: { trustId },
      timestamp: new Date().toISOString(),
    });

    logger.info(`Compiled trust package "${trustId}" with overall confidence ${overall}.`);
    return trustPackage;
  }
}
