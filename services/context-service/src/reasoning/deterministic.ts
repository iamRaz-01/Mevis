import { type DecisionCandidate } from "../decision/context";

export class DeterministicReasoningEngine {
  reasonDeterministically(candidate: DecisionCandidate): {
    readonly matchedRules: readonly string[];
    readonly distanceHops: number;
    readonly slaMet: boolean;
  } {
    const matchedRules: string[] = [];
    let distanceHops = 1;
    let slaMet = true;

    const twin = candidate.context.twinSnapshot;
    const type = candidate.decisionType;

    if (type === "Medical Response") {
      matchedRules.push("RULE_MED_01: Critical emergencies trigger nearest responders.");
      matchedRules.push("RULE_MED_02: Responders must hold active first-aid certification.");
    } else if (type === "Evacuation") {
      matchedRules.push("RULE_EVAC_01: Evacuate stand zones immediately if exits are clear.");
    }

    if (twin && twin.relationships) {
      distanceHops = twin.relationships.length;
    }

    return {
      matchedRules,
      distanceHops,
      slaMet,
    };
  }
}
