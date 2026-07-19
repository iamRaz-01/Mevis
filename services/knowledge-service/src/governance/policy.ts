import { type PolicyRules } from "./context";
import { type FreshnessStatus } from "./freshness";

export interface PolicyEvaluation {
  readonly compliant: boolean;
  readonly violations: readonly string[];
}

export class PolicyEngine {
  evaluate(
    asset: any,
    qualityScore: number,
    freshnessStatus: FreshnessStatus,
    policy: PolicyRules
  ): PolicyEvaluation {
    const violations: string[] = [];

    // 1. Evaluate minimum quality limits
    if (qualityScore < policy.minQualityScore) {
      violations.push(`Quality score (${qualityScore}) is below required minimum threshold (${policy.minQualityScore}).`);
    }

    // 2. Freshness status violations check
    if (freshnessStatus === "Expired") {
      violations.push("Asset has expired and requires renewal.");
    }

    // 3. Metadata attributes presence evaluation
    for (const field of policy.requiredMetadata) {
      if (!asset[field]) {
        violations.push(`Missing required compliance metadata: "${field}".`);
      }
    }

    // 4. Approved languages checks
    if (asset.language) {
      const allowed = policy.allowedLanguages.map(l => l.toLowerCase());
      if (!allowed.includes(asset.language.toLowerCase())) {
        violations.push(`Language code "${asset.language}" is not in approved governance catalog.`);
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }
}
