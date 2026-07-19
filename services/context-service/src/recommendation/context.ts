export interface Alternative {
  readonly id: string;
  readonly description: string;
  readonly requiredResources: readonly string[];
  readonly estimatedDurationMinutes: number;
  readonly supportingEvidence: readonly string[];
}

export interface OperationalTradeoff {
  readonly compromise: string;
  readonly benefit: string;
  readonly severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface DecisionPackage {
  readonly id: string;
  readonly decisionId: string;
  readonly decisionCandidate: any;
  readonly decisionAnalysis: any;
  readonly rankedAlternatives: ReadonlyArray<Alternative>;
  readonly primaryRecommendation: Alternative;
  readonly alternativeRecommendations: ReadonlyArray<Alternative>;
  readonly requiredResources: readonly string[];
  readonly risks: readonly any[];
  readonly tradeoffs: ReadonlyArray<OperationalTradeoff>;
  readonly justification: string;
  readonly confidence: number;
  readonly provenance: string;
  readonly createdAt: string;
}
