import { type ContextValidationContext } from "./context";

export class ConflictDetectionEngine {
  validate(ctx: ContextValidationContext): { readonly passed: boolean; readonly conflicts: readonly string[] } {
    const conflicts: string[] = [];
    const pkg = ctx.contextPackage;

    for (const fact of pkg.prioritizedFacts) {
      if (fact.attributes && fact.attributes.conflictDetected) {
        conflicts.push(`Operational data conflict identified on target entity "${fact.entityId}".`);
      }
    }

    return {
      passed: conflicts.length === 0,
      conflicts,
    };
  }
}
