export interface PolicyRules {
  readonly minQualityScore: number;
  readonly expirationDays: number;
  readonly reviewSoonDays: number;
  readonly requiredMetadata: readonly string[];
  readonly allowedLanguages: readonly string[];
}

export interface GovernedAsset {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly lifecycleState: string;
  readonly healthScore: number;
  readonly qualityScore: number;
  readonly freshnessStatus: "Fresh" | "Review Soon" | "Stale" | "Expired";
  readonly policyCompliant: boolean;
  readonly violations: readonly string[];
  readonly latestVersionId: string | null;
  readonly lastCheckedAt: string;
}

export interface EvaluationResult {
  readonly assetId: string;
  readonly valid: boolean;
  readonly validationErrors: readonly string[];
  readonly qualityScore: number;
  readonly qualityErrors: readonly string[];
  readonly freshnessStatus: "Fresh" | "Review Soon" | "Stale" | "Expired";
  readonly policyCompliant: boolean;
  readonly policyViolations: readonly string[];
  readonly duplicateFlag: boolean;
  readonly duplicateDetails: readonly string[];
  readonly healthScore: number;
  readonly explanation: string;
}

export interface GovernanceManifest {
  readonly executionTimeMs: number;
  readonly assetsEvaluated: number;
  readonly passedCount: number;
  readonly violationsCount: number;
  readonly duplicatesCount: number;
  readonly averageHealth: number;
  readonly createdAt: string;
}

export interface GovernanceContext {
  readonly policy: PolicyRules;
  readonly results: Record<string, EvaluationResult>;
}

export const defaultPolicyRules: PolicyRules = {
  minQualityScore: 0.5,
  expirationDays: 365,
  reviewSoonDays: 30,
  requiredMetadata: ["source", "language", "audience", "confidentiality", "approval_date"],
  allowedLanguages: ["en", "es", "fr", "ar", "hi"],
};
