import { type EvidenceRecord } from "./context";

export class EvidenceCollector {
  collectEvidence(decisionType: string): ReadonlyArray<EvidenceRecord> {
    const list: EvidenceRecord[] = [];

    if (decisionType === "Medical Response") {
      list.push({
        id: "ev_med_first_aid",
        title: "First Aid Protocol Guide",
        content: "Procedures for ankle fractures, cardiac distress, and heat stroke emergency responses.",
        relevanceScore: 0.95,
        provenance: "KnowledgeBase:guidelines/first-aid-manual.pdf",
      });
      list.push({
        id: "ev_med_responder_slas",
        title: "Medical Team Dispatch SLA",
        content: "Medical responders must arrive at critical locations within 5 minutes of dispatch.",
        relevanceScore: 0.9,
        provenance: "EvidenceStore:contracts/SLA-2026.pdf",
      });
    } else if (decisionType === "Evacuation") {
      list.push({
        id: "ev_evac_route_maps",
        title: "Stadium Evacuation Path Map",
        content: "Defines primary and secondary emergency exit lanes for all stadium stands.",
        relevanceScore: 0.95,
        provenance: "KnowledgeBase:maps/evacuation-routes.png",
      });
    } else {
      list.push({
        id: "ev_gen_operations",
        title: "General Stadium Operations Guide",
        content: "Defines general crowd management and shift rules for volunteers.",
        relevanceScore: 0.8,
        provenance: "KnowledgeBase:guidelines/ops-manual.pdf",
      });
    }

    return list;
  }
}
