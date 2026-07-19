import { type ContextValidationContext } from "./context";

export class ConsistencyEngine {
  validate(ctx: ContextValidationContext): { readonly passed: boolean; readonly issues: readonly string[] } {
    const issues: string[] = [];
    const pkg = ctx.contextPackage;

    for (const fact of pkg.prioritizedFacts) {
      const attrs = fact.attributes || {};
      const status = attrs.status;

      if (status && status.includes("OFFLINE") && status.includes("AVAILABLE")) {
        issues.push(`Entity "${fact.entityId}" shows contradictory status: "${status}".`);
      }
      if (status && status.includes("ACTIVE") && status.includes("RESOLVED")) {
        issues.push(`Entity "${fact.entityId}" shows contradictory status: "${status}".`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}
