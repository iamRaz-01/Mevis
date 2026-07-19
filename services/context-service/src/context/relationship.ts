import { type ContextRelationship, type ContextAssemblyContext } from "./context";

export class ContextRelationshipEngine {
  buildRelationships(ctx: ContextAssemblyContext): readonly ContextRelationship[] {
    const list: ContextRelationship[] = [];

    // 1. NEAR relationship based on coordinate mapping
    const stateList = Object.values(ctx.latestStates);
    for (let i = 0; i < stateList.length; i++) {
      for (let j = i + 1; j < stateList.length; j++) {
        const s1 = stateList[i];
        const s2 = stateList[j];

        const loc1 = s1.stateData.locationCoords; // expect array [x, y]
        const loc2 = s2.stateData.locationCoords;

        if (Array.isArray(loc1) && Array.isArray(loc2) && loc1.length === 2 && loc2.length === 2) {
          const dx = loc1[0] - loc2[0];
          const dy = loc1[1] - loc2[1];
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 10.0) {
            list.push({
              sourceId: s1.entityId,
              targetId: s2.entityId,
              relationshipType: "NEAR",
              explanation: `Proximity check: distance of ${dist.toFixed(2)} units fits proximity criteria.`,
            });
          }
        }
      }
    }

    // 2. CAN_RESPOND_TO based on capabilities matches
    for (const incident of ctx.activeIncidents) {
      const incState = incident.stateData;
      for (const st of Object.values(ctx.latestStates)) {
        const ent = ctx.worldEntities[st.entityId];
        if (ent && (ent.entityType === "Volunteer" || ent.entityType === "Medical Team" || ent.entityType === "Security Team")) {
          const isMedical = incState.category === "MEDICAL" || incState.category === "Medical";
          const hasCap = Array.isArray(ent.capabilities) && (ent.capabilities.includes("MEDICAL_RESPONDER") || ent.capabilities.includes("NFC_SCANNER"));

          if (isMedical && hasCap) {
            list.push({
              sourceId: st.entityId,
              targetId: incident.entityId,
              relationshipType: "CAN_RESPOND_TO",
              explanation: `Responder capabilities align with the demands of ${incState.category} incident.`,
            });
          }
        }
      }
    }

    return list;
  }
}
