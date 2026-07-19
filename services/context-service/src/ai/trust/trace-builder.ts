import { type ReasoningTrace } from "./context";
import crypto from "node:crypto";

export class ReasoningTraceBuilder {
  buildTraces(trustId: string, steps: any[]): ReasoningTrace[] {
    return steps.map((s) => ({
      id: `trc_${crypto.randomUUID().slice(0, 8)}`,
      trustId,
      stepDescription: `Execution Plan Action Completed: ${s.description}`,
    }));
  }
}
