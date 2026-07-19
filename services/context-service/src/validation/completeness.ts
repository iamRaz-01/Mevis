import { type ContextValidationContext } from "./context";

export class CompletenessEngine {
  validate(ctx: ContextValidationContext): { readonly passed: boolean; readonly issues: readonly string[] } {
    const issues: string[] = [];
    const pkg = ctx.contextPackage;

    if (!pkg.timeline || !pkg.timeline.eventTime) {
      issues.push("Missing compiled timeline eventTime parameter.");
    }

    if (pkg.prioritizedFacts.length === 0) {
      issues.push("Context package contains no active facts.");
    }

    for (const fact of pkg.prioritizedFacts) {
      const attrs = fact.attributes || {};
      if (fact.description.toLowerCase().includes("incident") && !attrs.severity) {
        issues.push(`Incident fact "${fact.factId}" lacks severity property.`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}
