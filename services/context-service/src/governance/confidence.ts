export class ConfidenceEngine {
  deriveConfidenceScore(
    policyCompliant: boolean,
    safetyCompliant: boolean,
    hasConflicts: boolean
  ): number {
    let score = 0.95;
    if (!policyCompliant) score -= 0.3;
    if (!safetyCompliant) score -= 0.3;
    if (hasConflicts) score -= 0.15;
    return Math.max(0.1, score);
  }
}
