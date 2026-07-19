export interface TrustedDecision {
  readonly id: string;
  readonly decisionId: string;
  readonly decisionPackageId: string;
  readonly package: any;
  readonly policyCompliance: {
    readonly compliant: boolean;
    readonly violations: readonly string[];
  };
  readonly safetyStatus: {
    readonly safe: boolean;
    readonly issues: readonly string[];
  };
  readonly complianceStatus: {
    readonly valid: boolean;
    readonly notes: readonly string[];
  };
  readonly conflicts: readonly string[];
  readonly confidenceScore: number;
  readonly approvalRoute: readonly string[];
  readonly createdAt: string;
}

export interface GovernanceManifest {
  readonly decisionId: string;
  readonly packageId: string;
  readonly policiesChecked: readonly string[];
  readonly safetyIssuesCount: number;
  readonly conflictsCount: number;
  readonly finalVerdict: "TRUSTED" | "REJECTED";
  readonly timestamp: string;
}
