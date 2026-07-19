import { type Alternative } from "./context";

export class RecommendationEngine {
  generateJustification(primary: Alternative): string {
    return `Recommended action: "${primary.description}". Justification: Minimizes response arrival latency to ${primary.estimatedDurationMinutes} minutes, supported by first-aid protocols.`;
  }
}
