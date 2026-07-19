import { type ContextValidationContext } from "./context";

export class FreshnessEngine {
  validate(ctx: ContextValidationContext): { readonly passed: boolean; readonly issues: readonly string[] } {
    const issues: string[] = [];
    const pkg = ctx.contextPackage;

    const compiledTime = Date.parse(pkg.timeline.compiledTime);
    const checkedTime = Date.parse(ctx.timeline.checkedTime);

    if (!isNaN(compiledTime) && !isNaN(checkedTime)) {
      const ageSec = (checkedTime - compiledTime) / 1000;
      if (ageSec > 300) {
        issues.push(`Stale context detected: package age (${ageSec.toFixed(1)}s) exceeds 300s expiration limit.`);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}
