import { type ContextValidationContext } from "./context";

export class QualityEngine {
  validate(ctx: ContextValidationContext): { readonly score: number; readonly factors: readonly string[] } {
    const factors: string[] = [];
    const pkg = ctx.contextPackage;

    const factCount = pkg.prioritizedFacts.length;
    const evidenceCount = pkg.evidenceReferences.length;

    let score = 1.0;

    if (factCount > 0) {
      const ratio = evidenceCount / factCount;
      if (ratio < 0.5) {
        score -= 0.3;
        factors.push(`Low evidence-to-fact coverage ratio: ${ratio.toFixed(2)}.`);
      }
    } else {
      score = 0.0;
      factors.push("No prioritized facts contained in context.");
    }

    if (pkg.contextualRelationships.length === 0) {
      score -= 0.2;
      factors.push("Context package contains no relationship edges.");
    }

    return {
      score: Math.max(0.0, score),
      factors,
    };
  }
}
