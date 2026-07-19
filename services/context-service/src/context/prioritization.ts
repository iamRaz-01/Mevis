import { type PrioritizedFact, type ContextAssemblyContext } from "./context";
import crypto from "node:crypto";

export class PrioritizationEngine {
  prioritize(ctx: ContextAssemblyContext): readonly PrioritizedFact[] {
    const facts: PrioritizedFact[] = [];

    for (const st of Object.values(ctx.latestStates)) {
      const ent = ctx.worldEntities[st.entityId];
      if (!ent) continue;

      let score = 0.5;
      let desc = "";

      if (ent.entityType === "Incident Type") {
        const sev = st.stateData.severity || "MEDIUM";
        if (sev === "CRITICAL") score = 1.0;
        else if (sev === "HIGH") score = 0.8;
        else if (sev === "MEDIUM") score = 0.5;
        else score = 0.2;

        desc = `Active incident "${ent.displayName}" detected with severity "${sev}".`;
      } else if (ent.entityType === "Volunteer") {
        const status = st.stateData.status || "AVAILABLE";
        score = status === "AVAILABLE" ? 0.7 : 0.4;
        desc = `Volunteer "${ent.displayName}" is currently "${status}" at location "${st.stateData.location || "unknown"}".`;
      } else {
        score = 0.3;
        desc = `Operational status details for "${ent.displayName}" (${ent.entityType}) synced.`;
      }

      facts.push({
        factId: `fact:${crypto.randomUUID()}`,
        entityId: st.entityId,
        description: desc,
        priorityScore: score,
        attributes: {
          severity: st.stateData.severity || null,
          status: st.stateData.status || null,
          location: st.stateData.location || null,
          locationCoords: st.stateData.locationCoords || null,
        },
        provenance: `WorldLatestState:${st.entityId}`,
      });
    }

    return facts.sort((a, b) => b.priorityScore - a.priorityScore);
  }
}
