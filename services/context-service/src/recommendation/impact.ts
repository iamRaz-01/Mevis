import { type Alternative } from "./context";

export class ImpactEngine {
  evaluateImpact(alt: Alternative): {
    readonly operational: string;
    readonly resource: string;
    readonly business: string;
    readonly human: string;
  } {
    if (alt.description.includes("nearest")) {
      return {
        operational: "Fast arrival speed resolves medical emergency immediately.",
        resource: "Consumes 1 nearby volunteer, leaving other zones slightly open.",
        business: "High SLA compliance, aligns with medical protocols.",
        human: "Improves spectator outcome, prevents escalation.",
      };
    } else if (alt.description.includes("ambulance")) {
      return {
        operational: "Requires 6 minutes arrival latency.",
        resource: "Consumes external ambulance resources.",
        business: "Borderline SLA compliance threshold.",
        human: "Safe patient outcome, high qualification responder.",
      };
    } else {
      return {
        operational: "General command procedures deployed.",
        resource: "Low active resource footprint.",
        business: "Aligned with guidelines policies.",
        human: "Guarantees safe stadium stands coverage.",
      };
    }
  }
}
