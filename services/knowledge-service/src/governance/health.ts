import { type FreshnessStatus } from "./freshness";

export interface HealthDetails {
  readonly healthScore: number;
  readonly explanation: string;
}

export class HealthEngine {
  calculate(
    valid: boolean,
    qualityScore: number,
    freshnessStatus: FreshnessStatus,
    policyCompliant: boolean
  ): HealthDetails {
    let score = 1.0;
    const deductions: string[] = [];

    // 1. Validation check
    if (!valid) {
      score -= 0.4;
      deductions.push("Failed validation integrity checks (-0.40)");
    }

    // 2. Quality factor
    const qualityDeduction = 0.2 * (1.0 - qualityScore);
    if (qualityDeduction > 0) {
      score -= qualityDeduction;
      deductions.push(`Sub-optimal quality profile (-${qualityDeduction.toFixed(2)})`);
    }

    // 3. Freshness factor
    if (freshnessStatus === "Review Soon") {
      score -= 0.1;
      deductions.push("Review deadline is approaching (-0.10)");
    } else if (freshnessStatus === "Stale") {
      score -= 0.3;
      deductions.push("Asset is stale and requires updating (-0.30)");
    } else if (freshnessStatus === "Expired") {
      score -= 0.5;
      deductions.push("Asset has expired (-0.50)");
    }

    // 4. Policy factor
    if (!policyCompliant) {
      score -= 0.2;
      deductions.push("Configurable policy compliance violations (-0.20)");
    }

    const finalScore = Math.min(Math.max(score, 0.0), 1.0);
    const explanation = deductions.length > 0 
      ? `Health: ${deductions.join("; ")}.` 
      : "Excellent asset health - fully compliant with quality, freshness, and lifecycle standards.";

    return {
      healthScore: parseFloat(finalScore.toFixed(3)),
      explanation,
    };
  }
}
