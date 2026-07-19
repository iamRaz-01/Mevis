import { type DecisionCandidate } from "./context";
import crypto from "node:crypto";

export class DecisionBuilder {
  buildDecisionOutline(type: string): Partial<DecisionCandidate> {
    const id = `dec_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();

    return {
      id,
      decisionType: type,
      lifecycleState: "Detected",
      createdAt,
    };
  }
}
