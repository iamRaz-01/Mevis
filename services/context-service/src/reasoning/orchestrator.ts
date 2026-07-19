import { type DecisionAnalysis } from "./context";
import { type DecisionCandidate } from "../decision/context";
import { EvidenceCollector } from "./evidence";
import { PolicyCollector } from "./policy";
import { ConstraintEvaluator } from "./constraint-evaluator";
import { RiskEngine } from "./risk";
import { DeterministicReasoningEngine } from "./deterministic";
import { LlmOrchestrator } from "./llm";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("ReasoningOrchestrator");

export interface DecisionAnalysisRepoPort {
  save(analysis: {
    readonly id: string;
    readonly decision_id: string;
    readonly analysis_data_json: string;
    readonly reasoning_trace_json: string;
    readonly created_at: string;
  }): Promise<void>;
}

export class ReasoningOrchestrator {
  private readonly evidenceCollector = new EvidenceCollector();
  private readonly policyCollector = new PolicyCollector();
  private readonly constraintEvaluator = new ConstraintEvaluator();
  private readonly riskEngine = new RiskEngine();
  private readonly deterministicEngine = new DeterministicReasoningEngine();
  private readonly llmOrchestrator = new LlmOrchestrator();

  constructor(private readonly repo: DecisionAnalysisRepoPort) {}

  async runAnalysis(candidate: DecisionCandidate): Promise<DecisionAnalysis> {
    const startTime = Date.now();
    logger.info(`Starting Decision Analysis for candidate: "${candidate.id}".`);

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "DecisionAnalysisStarted",
      timestamp,
      payload: { decisionId: candidate.id },
    });

    const evidence = this.evidenceCollector.collectEvidence(candidate.decisionType);
    await globalEventBus.publish({
      type: "EvidenceCollected",
      timestamp,
      payload: { decisionId: candidate.id, count: evidence.length },
    });

    const policies = this.policyCollector.collectPolicies(candidate.decisionType);
    await globalEventBus.publish({
      type: "PoliciesLoaded",
      timestamp,
      payload: { decisionId: candidate.id, count: policies.length },
    });

    const constraints = this.constraintEvaluator.evaluateConstraints(candidate);
    const risks = this.riskEngine.assessRisks(candidate);
    await globalEventBus.publish({
      type: "RiskAssessmentCompleted",
      timestamp,
      payload: { decisionId: candidate.id, count: risks.length },
    });

    const deterministicOutcome = this.deterministicEngine.reasonDeterministically(candidate);

    const llmOutcome = await this.llmOrchestrator.orchestrateLlmReasoning(
      candidate,
      evidence,
      policies,
      constraints,
      risks,
      deterministicOutcome
    );

    const analysisId = `anal_${crypto.randomUUID()}`;
    const analysis: DecisionAnalysis = {
      id: analysisId,
      decisionId: candidate.id,
      evidence,
      policies,
      constraints: candidate.constraints,
      risks,
      trace: llmOutcome.trace,
      confidence: llmOutcome.confidence,
      provenance: `ReasoningEngine:${candidate.id}`,
      createdAt: new Date().toISOString(),
    };

    await this.repo.save({
      id: analysis.id,
      decision_id: analysis.decisionId,
      analysis_data_json: JSON.stringify(analysis),
      reasoning_trace_json: JSON.stringify(llmOutcome.trace),
      created_at: analysis.createdAt,
    });

    const elapsed = Date.now() - startTime;
    metrics.counter("world_reasoning_analyses_total").increment();
    metrics.gauge("world_reasoning_latency_ms").set(elapsed);

    await globalEventBus.publish({
      type: "ReasoningCompleted",
      timestamp,
      payload: { decisionId: candidate.id, analysisId },
    });

    await globalEventBus.publish({
      type: "DecisionAnalysisPublished",
      timestamp,
      payload: { analysisId, decisionId: candidate.id },
    });

    logger.info(`Decision Analysis completed successfully in ${elapsed}ms.`);
    return analysis;
  }
}
