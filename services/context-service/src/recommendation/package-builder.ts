import { type DecisionPackage, type Alternative, type OperationalTradeoff } from "./context";
import { type DecisionAnalysis } from "../reasoning/context";
import { OptionGenerator } from "./option";
import { ImpactEngine } from "./impact";
import { TradeoffEngine } from "./tradeoff";
import { PriorityEngine } from "./priority";
import { RecommendationEngine } from "./recommendation-engine";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";
import crypto from "node:crypto";

const logger = new StructuredLogger("DecisionPackageBuilder");

export interface DecisionPackageRepoPort {
  save(pkg: {
    readonly id: string;
    readonly decision_id: string;
    readonly package_data_json: string;
    readonly created_at: string;
  }): Promise<void>;
}

export class DecisionPackageBuilder {
  private readonly optionGenerator = new OptionGenerator();
  private readonly impactEngine = new ImpactEngine();
  private readonly tradeoffEngine = new TradeoffEngine();
  private readonly priorityEngine = new PriorityEngine();
  private readonly recommendationEngine = new RecommendationEngine();

  constructor(private readonly repo: DecisionPackageRepoPort) {}

  async buildPackage(
    analysis: DecisionAnalysis,
    candidate: any
  ): Promise<DecisionPackage> {
    const startTime = Date.now();
    logger.info(`Starting Decision Package compilation for analysis: "${analysis.id}".`);

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "RecommendationGenerationStarted",
      timestamp,
      payload: { decisionId: analysis.decisionId },
    });

    const alternatives = this.optionGenerator.generateOptions(candidate.decisionType);
    await globalEventBus.publish({
      type: "AlternativesGenerated",
      timestamp,
      payload: { decisionId: analysis.decisionId, count: alternatives.length },
    });

    const tradeoffs: OperationalTradeoff[] = [];
    for (const alt of alternatives) {
      tradeoffs.push(this.tradeoffEngine.analyzeTradeoff(alt));
    }
    await globalEventBus.publish({
      type: "TradeoffAnalysisCompleted",
      timestamp,
      payload: { decisionId: analysis.decisionId },
    });

    const ranked = this.priorityEngine.rankAlternatives(alternatives);
    const primary = ranked[0];
    const secondary = ranked.slice(1);
    await globalEventBus.publish({
      type: "RecommendationRanked",
      timestamp,
      payload: { decisionId: analysis.decisionId, primaryId: primary.id },
    });

    const justification = this.recommendationEngine.generateJustification(primary);

    const packageId = `pkg_dec_${crypto.randomUUID()}`;
    const pkg: DecisionPackage = {
      id: packageId,
      decisionId: analysis.decisionId,
      decisionCandidate: candidate,
      decisionAnalysis: analysis,
      rankedAlternatives: ranked,
      primaryRecommendation: primary,
      alternativeRecommendations: secondary,
      requiredResources: primary.requiredResources,
      risks: analysis.risks,
      tradeoffs,
      justification,
      confidence: analysis.confidence,
      provenance: `RecommendationEngine:${analysis.id}`,
      createdAt: new Date().toISOString(),
    };

    await this.repo.save({
      id: pkg.id,
      decision_id: pkg.decisionId,
      package_data_json: JSON.stringify(pkg),
      created_at: pkg.createdAt,
    });

    const elapsed = Date.now() - startTime;
    metrics.counter("world_recommendation_packages_total").increment();
    metrics.gauge("world_recommendation_latency_ms").set(elapsed);

    await globalEventBus.publish({
      type: "DecisionPackageCreated",
      timestamp,
      payload: { packageId, decisionId: analysis.decisionId },
    });

    await globalEventBus.publish({
      type: "RecommendationPublished",
      timestamp,
      payload: { packageId, decisionId: analysis.decisionId },
    });

    logger.info(`Decision Package compiled successfully in ${elapsed}ms.`);
    return pkg;
  }
}
