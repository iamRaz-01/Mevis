import { type DecisionCandidate } from "./context";
import { globalEventBus } from "../world/event-bus";
import { StructuredLogger } from "@mevis/logger";
import { metrics } from "@mevis/platform-operations";

const logger = new StructuredLogger("DecisionRegistry");

export interface DecisionRegistryRepoPort {
  save(decision: {
    readonly id: string;
    readonly decision_type: string;
    readonly lifecycle_state: string;
    readonly context_json: string;
    readonly constraints_json: string;
    readonly manifest_json: string;
    readonly created_at: string;
  }): Promise<void>;
  findAll(): Promise<readonly any[]>;
}

export class DecisionRegistry {
  constructor(private readonly repo: DecisionRegistryRepoPort) {}

  async registerDecision(candidate: DecisionCandidate): Promise<boolean> {
    logger.info(`Registering decision candidate "${candidate.id}" in repository.`);

    const existing = await this.repo.findAll();
    const isDuplicate = existing.some(
      (d: any) => d.decision_type === candidate.decisionType && d.lifecycle_state === candidate.lifecycleState
    );

    if (isDuplicate) {
      logger.info(`Duplicate decision candidate of type "${candidate.decisionType}" already registered. Skipping.`);
      metrics.counter("world_decision_duplicates_prevented_total").increment();
      return false;
    }

    await this.repo.save({
      id: candidate.id,
      decision_type: candidate.decisionType,
      lifecycle_state: candidate.lifecycleState,
      context_json: JSON.stringify(candidate.context),
      constraints_json: JSON.stringify(candidate.constraints),
      manifest_json: JSON.stringify(candidate.manifest),
      created_at: candidate.createdAt,
    });

    const timestamp = new Date().toISOString();
    await globalEventBus.publish({
      type: "DecisionDetected",
      timestamp,
      payload: { decisionId: candidate.id, decisionType: candidate.decisionType },
    });

    await globalEventBus.publish({
      type: "DecisionRegistered",
      timestamp,
      payload: { decisionId: candidate.id, decisionType: candidate.decisionType },
    });

    await globalEventBus.publish({
      type: "DecisionContextAttached",
      timestamp,
      payload: { decisionId: candidate.id },
    });

    await globalEventBus.publish({
      type: "DecisionConstraintsAttached",
      timestamp,
      payload: { decisionId: candidate.id },
    });

    await globalEventBus.publish({
      type: "DecisionReadyForReasoning",
      timestamp,
      payload: { decisionId: candidate.id },
    });

    await globalEventBus.publish({
      type: "DecisionManifestGenerated",
      timestamp,
      payload: { decisionId: candidate.id },
    });

    metrics.counter("world_decisions_registered_total").increment();
    return true;
  }
}
