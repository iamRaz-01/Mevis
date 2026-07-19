import { type Alternative } from "./context";

export class PriorityEngine {
  rankAlternatives(alternatives: ReadonlyArray<Alternative>): ReadonlyArray<Alternative> {
    return [...alternatives].sort((a, b) => {
      const scoreA = this.getPriorityScore(a);
      const scoreB = this.getPriorityScore(b);
      return scoreB - scoreA;
    });
  }

  private getPriorityScore(alt: Alternative): number {
    if (alt.description.includes("nearest")) return 0.9;
    if (alt.description.includes("ambulance")) return 0.7;
    if (alt.description.includes("director")) return 0.5;
    return 0.3;
  }
}
