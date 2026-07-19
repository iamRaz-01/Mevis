import { type Alternative, type OperationalTradeoff } from "./context";

export class TradeoffEngine {
  analyzeTradeoff(alt: Alternative): OperationalTradeoff {
    if (alt.description.includes("nearest")) {
      return {
        compromise: "Volunteer leaves standard watch stand unattended.",
        benefit: "Rapid response (within 4 minutes) minimizes critical injury risks.",
        severity: "LOW",
      };
    } else if (alt.description.includes("ambulance")) {
      return {
        compromise: "Higher arrival latency of 6 minutes.",
        benefit: "Preserves local stand responders for ongoing stadium crowd watches.",
        severity: "MEDIUM",
      };
    } else {
      return {
        compromise: "Slowest incident resolution time.",
        benefit: "Ensures comprehensive coordination with senior directors.",
        severity: "HIGH",
      };
    }
  }
}
