import { type RiskReport } from "./context";
import { type DecisionCandidate } from "../decision/context";

export class RiskEngine {
  assessRisks(candidate: DecisionCandidate): ReadonlyArray<RiskReport> {
    const list: RiskReport[] = [];
    const twin = candidate.context.twinSnapshot;

    if (!twin) return list;

    for (const rel of twin.relationships || []) {
      if (rel.relationshipType === "CONNECTED_TO" && rel.metadata?.status === "BLOCKED") {
        list.push({
          description: `Evacuation path from "${rel.sourceId}" to "${rel.targetId}" is currently BLOCKED. Critical delay hazard.`,
          severity: "HIGH",
          likelihood: "LIKELY",
          supportingEvidence: ["ev_evac_route_maps"],
          affectedEntities: [rel.sourceId, rel.targetId],
          confidence: 0.95,
        });
      }
    }

    const activeResponders = Object.values(twin.entities || {}).filter(
      (e: any) => e.entityType === "Volunteer" && e.latestState?.attributes?.status === "AVAILABLE"
    );

    if (activeResponders.length === 0) {
      list.push({
        description: "Zero active medical responders available in current stadium zone.",
        severity: "CRITICAL",
        likelihood: "LIKELY",
        supportingEvidence: ["ev_med_responder_slas"],
        affectedEntities: [],
        confidence: 0.9,
      });
    }

    if (list.length === 0) {
      list.push({
        description: "General crowd density might slightly slow responder arrival rates.",
        severity: "LOW",
        likelihood: "POSSIBLE",
        supportingEvidence: [],
        affectedEntities: [],
        confidence: 0.7,
      });
    }

    return list;
  }
}
