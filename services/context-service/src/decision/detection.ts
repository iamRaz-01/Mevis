import { type DigitalTwinContext } from "../twin/context";

export class DecisionDetectionEngine {
  detectDecisions(twin: DigitalTwinContext): ReadonlyArray<{
    readonly type: string;
    readonly triggerSituationId: string;
    readonly description: string;
  }> {
    const decisions: Array<{ type: string; triggerSituationId: string; description: string }> = [];

    for (const sit of twin.activeSituations) {
      const title = sit.title || "";
      const id = sit.situationId || sit.id;

      if (title.toLowerCase().includes("medical") || title.toLowerCase().includes("ankle")) {
        decisions.push({
          type: "Medical Response",
          triggerSituationId: id,
          description: `Medical Response candidate needed for situation: "${title}".`,
        });
      } else if (title.toLowerCase().includes("evacuate") || title.toLowerCase().includes("fire")) {
        decisions.push({
          type: "Evacuation",
          triggerSituationId: id,
          description: `Emergency Evacuation candidate needed for situation: "${title}".`,
        });
      } else {
        decisions.push({
          type: "Volunteer Assignment",
          triggerSituationId: id,
          description: `Volunteer Allocation candidate required for situation: "${title}".`,
        });
      }
    }

    if (decisions.length === 0) {
      for (const ent of Object.values(twin.entities)) {
        if (ent.entityType === "Incident Type" && ent.latestState) {
          decisions.push({
            type: "Medical Response",
            triggerSituationId: ent.id,
            description: `Incident "${ent.displayName}" requires medical response candidate.`,
          });
        }
      }
    }

    return decisions;
  }
}
