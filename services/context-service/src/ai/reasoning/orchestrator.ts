import { type ReasoningPlan, type ReasoningGraph } from "./context";
import { type IntentEngine } from "./intent-engine";
import { type TaskPlanner } from "./task-planner";
import { type ContextResolver } from "./context-resolver";
import { type ToolSelector } from "./tool-selector";
import { type AgentOrchestrator } from "./agent-orchestrator";
import { type GraphBuilder } from "./graph-builder";
import { globalEventBus } from "../../world/event-bus";
import crypto from "node:crypto";
import { StructuredLogger } from "@mevis/logger";

const logger = new StructuredLogger("CognitiveOrchestrator");

export class CognitiveOrchestrator {
  constructor(
    public readonly intents: IntentEngine,
    public readonly planner: TaskPlanner,
    public readonly contexts: ContextResolver,
    public readonly tools: ToolSelector,
    public readonly agents: AgentOrchestrator,
    public readonly graph: GraphBuilder,
    private readonly planRepo: any,
    private readonly stepRepo: any
  ) {}

  async orchestrate(
    sessionId: string,
    query: string,
    activeIncidentId?: string,
    activeVenueId?: string
  ): Promise<{ plan: ReasoningPlan; graph: ReasoningGraph }> {
    const intent = await this.intents.detectIntent(query);

    globalEventBus.publish({
      type: "IntentDetected",
      payload: { sessionId, query, intentType: intent.intentType },
      timestamp: new Date().toISOString(),
    });

    globalEventBus.publish({
      type: "ReasoningStarted",
      payload: { sessionId, query },
      timestamp: new Date().toISOString(),
    });

    const selectedTools = this.tools.selectTools(intent.intentType);
    for (const tool of selectedTools) {
      globalEventBus.publish({
        type: "ToolSelected",
        payload: { sessionId, toolName: tool.name },
        timestamp: new Date().toISOString(),
      });
    }

    const rawSteps = this.planner.planTasks(intent.intentType);

    const planId = `plan_${crypto.randomUUID().slice(0, 8)}`;
    const plan: ReasoningPlan = {
      id: planId,
      sessionId,
      query,
      intent: intent.intentType,
      status: "READY",
      createdAt: new Date().toISOString(),
      steps: rawSteps.map((s, idx) => ({
        id: `step_${planId}_${idx}`,
        planId,
        stepIndex: idx,
        description: s.description,
        status: "PENDING",
        targetEngine: s.targetEngine,
      })),
    };

    await this.planRepo.save({
      id: plan.id,
      session_id: plan.sessionId,
      query: plan.query,
      intent: plan.intent,
      status: plan.status,
      created_at: plan.createdAt,
    });

    for (const step of plan.steps) {
      await this.stepRepo.save({
        id: step.id,
        plan_id: step.planId,
        step_index: step.stepIndex,
        description: step.description,
        status: step.status,
        target_engine: step.targetEngine,
      });
    }

    const graphData = this.graph.buildGraph(plan.steps);

    globalEventBus.publish({
      type: "ReasoningGraphBuilt",
      payload: { planId, nodesCount: graphData.nodes.length },
      timestamp: new Date().toISOString(),
    });

    globalEventBus.publish({
      type: "ExecutionPlanCreated",
      payload: { planId },
      timestamp: new Date().toISOString(),
    });

    logger.info(`Orchestrated execution plan "${planId}" with ${plan.steps.length} steps.`);
    return { plan, graph: graphData };
  }

  async getPlan(id: string): Promise<ReasoningPlan | null> {
    const row = await this.planRepo.findById(id);
    if (!row) return null;

    const allSteps = await this.stepRepo.findAll();
    const steps = allSteps
      .filter((s: any) => s.plan_id === id)
      .map((s: any) => ({
        id: s.id,
        planId: s.plan_id,
        stepIndex: s.step_index,
        description: s.description,
        status: s.status,
        targetEngine: s.target_engine,
      }))
      .sort((a: any, b: any) => a.stepIndex - b.stepIndex);

    return {
      id: row.id,
      sessionId: row.session_id,
      query: row.query,
      intent: row.intent,
      status: row.status,
      createdAt: row.created_at,
      steps,
    };
  }
}
