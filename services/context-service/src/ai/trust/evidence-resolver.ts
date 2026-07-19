import { type EvidenceLink } from "./context";
import crypto from "node:crypto";

export class EvidenceResolver {
  resolveEvidence(trustId: string, intent: string): EvidenceLink[] {
    const list: EvidenceLink[] = [];
    if (intent === "NAVIGATION") {
      list.push({
        id: `ev_${crypto.randomUUID().slice(0, 8)}`,
        trustId,
        sourceType: "DIGITAL_TWIN",
        sourceId: "venue-gates-coordinates",
      });
    } else if (intent === "VOLUNTEER_LOOKUP") {
      list.push({
        id: `ev_${crypto.randomUUID().slice(0, 8)}`,
        trustId,
        sourceType: "OPERATIONAL_DB",
        sourceId: "volunteers-registry-profile",
      });
    }
    return list;
  }
}
