export class SafetyEngine {
  validateSafety(pkg: any): { readonly safe: boolean; readonly issues: readonly string[] } {
    const issues: string[] = [];
    const candidate = pkg.decisionCandidate;

    if (candidate) {
      const twin = candidate.context?.twinSnapshot;
      if (twin) {
        for (const rel of twin.relationships || []) {
          if (rel.relationshipType === "CONNECTED_TO" && rel.metadata?.status === "BLOCKED") {
            issues.push(`Evacuation path "${rel.sourceId}" to "${rel.targetId}" is BLOCKED. Operational hazard.`);
          }
        }
      }
    }

    return {
      safe: issues.length === 0,
      issues,
    };
  }
}
