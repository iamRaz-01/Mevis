import { type Situation, type ContextAssemblyContext } from "./context";
import crypto from "node:crypto";

export class SituationEngine {
  assembleSituations(ctx: ContextAssemblyContext): readonly Situation[] {
    const list: Situation[] = [];

    for (const incident of ctx.activeIncidents) {
      const incState = incident.stateData;
      const title = incState.title || "Operational Alert";
      const severity = incState.severity || "MEDIUM";

      const involved: string[] = [incident.entityId];
      for (const st of Object.values(ctx.latestStates)) {
        if (st.entityId !== incident.entityId) {
          if (st.stateData.location && st.stateData.location === incState.location) {
            involved.push(st.entityId);
          }
        }
      }

      list.push({
        situationId: `situation:${crypto.randomUUID()}`,
        title,
        severity,
        status: "ACTIVE",
        entitiesInvolved: involved,
        createdAt: new Date().toISOString(),
      });
    }

    return list;
  }
}
