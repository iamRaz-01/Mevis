import { globalEventBus } from "../../world/event-bus";

/**
 * ExperienceRouter
 *
 * Dispatches an incoming AI platform request to the appropriate capability
 * handler (CHAT, COPILOT, PREDICTION, GENERATION). Keeps the ExperienceGateway
 * thin and route-agnostic.
 *
 * Does NOT contain reasoning, generation, or trust logic.
 */

export type CapabilityType =
  | "CHAT"
  | "COPILOT_INCIDENT"
  | "COPILOT_PLANNING"
  | "COPILOT_OPERATIONS"
  | "COPILOT_RECOMMENDATION"
  | "PREDICT_INCIDENT"
  | "PREDICT_CROWD"
  | "PREDICT_RESOURCE"
  | "PREDICT_VOLUNTEER"
  | "GENERATE_REPORT"
  | "GENERATE_SUMMARY"
  | "GENERATE_SHIFT_NOTES"
  | "GENERATE_AFTER_ACTION";

export interface RouteDecision {
  requestId: string;
  capability: CapabilityType;
  routedTo: string;
  routingReason: string;
}

export interface ExperienceRouteRepoPort {
  saveRoute(route: {
    id: string;
    request_id: string;
    capability: string;
    routed_to: string;
    routing_reason: string;
    created_at: string;
  }): Promise<void>;
}

// Capability → internal pipeline handler name mapping
const CAPABILITY_HANDLER_MAP: Record<CapabilityType, string> = {
  CHAT: "ConversationPipeline",
  COPILOT_INCIDENT: "CopilotPipeline::Incident",
  COPILOT_PLANNING: "CopilotPipeline::Planning",
  COPILOT_OPERATIONS: "CopilotPipeline::Operations",
  COPILOT_RECOMMENDATION: "CopilotPipeline::Recommendation",
  PREDICT_INCIDENT: "PredictionPipeline::Incident",
  PREDICT_CROWD: "PredictionPipeline::Crowd",
  PREDICT_RESOURCE: "PredictionPipeline::Resource",
  PREDICT_VOLUNTEER: "PredictionPipeline::Volunteer",
  GENERATE_REPORT: "GenerationPipeline::Report",
  GENERATE_SUMMARY: "GenerationPipeline::Summary",
  GENERATE_SHIFT_NOTES: "GenerationPipeline::ShiftNotes",
  GENERATE_AFTER_ACTION: "GenerationPipeline::AfterAction",
};

const CAPABILITY_REASONING_MAP: Record<CapabilityType, string> = {
  CHAT: "Conversational query routed to conversation pipeline",
  COPILOT_INCIDENT: "Incident copilot routed to incident analysis pipeline",
  COPILOT_PLANNING: "Planning copilot routed to operational planning pipeline",
  COPILOT_OPERATIONS: "Operations copilot routed to operations pipeline",
  COPILOT_RECOMMENDATION: "Recommendation copilot routed to recommendation pipeline",
  PREDICT_INCIDENT: "Incident prediction routed to prediction pipeline",
  PREDICT_CROWD: "Crowd prediction routed to prediction pipeline",
  PREDICT_RESOURCE: "Resource prediction routed to prediction pipeline",
  PREDICT_VOLUNTEER: "Volunteer prediction routed to prediction pipeline",
  GENERATE_REPORT: "Report generation routed to long-form generation pipeline",
  GENERATE_SUMMARY: "Summary generation routed to briefing pipeline",
  GENERATE_SHIFT_NOTES: "Shift notes routed to structured notes pipeline",
  GENERATE_AFTER_ACTION: "After-action review routed to retrospective pipeline",
};

function uid(): string {
  return `route_${Math.random().toString(36).slice(2, 10)}`;
}

export class ExperienceRouter {
  constructor(private readonly repo: ExperienceRouteRepoPort) {}

  async route(requestId: string, capability: CapabilityType): Promise<RouteDecision> {
    const handler = CAPABILITY_HANDLER_MAP[capability];
    const reason = CAPABILITY_REASONING_MAP[capability];

    const decision: RouteDecision = {
      requestId,
      capability,
      routedTo: handler,
      routingReason: reason,
    };

    await this.repo.saveRoute({
      id: uid(),
      request_id: requestId,
      capability,
      routed_to: handler,
      routing_reason: reason,
      created_at: new Date().toISOString(),
    });

    globalEventBus.publish({ type: "ExperienceRouted", payload: decision, timestamp: new Date().toISOString() });

    return decision;
  }

  listCapabilities(): Array<{ capability: CapabilityType; handler: string; description: string }> {
    return (Object.keys(CAPABILITY_HANDLER_MAP) as CapabilityType[]).map((cap) => ({
      capability: cap,
      handler: CAPABILITY_HANDLER_MAP[cap],
      description: CAPABILITY_REASONING_MAP[cap],
    }));
  }
}
