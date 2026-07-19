import { type Citation } from "./context";
import crypto from "node:crypto";

export class CitationEngine {
  extractCitations(trustId: string, intent: string): Citation[] {
    const list: Citation[] = [];
    if (intent === "NAVIGATION") {
      list.push({
        id: `cit_${crypto.randomUUID().slice(0, 8)}`,
        trustId,
        referenceText: "MEVIS Venue Entrance Protocol Policy §4.2",
      });
    } else if (intent === "REPORT_GENERATION") {
      list.push({
        id: `cit_${crypto.randomUUID().slice(0, 8)}`,
        trustId,
        referenceText: "Standard Operations Incident Reporting Guideline SOP-09",
      });
    }
    return list;
  }
}
