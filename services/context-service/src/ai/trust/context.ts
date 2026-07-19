export interface EvidenceLink {
  readonly id: string;
  readonly trustId: string;
  readonly sourceType: string;
  readonly sourceId: string;
}

export interface Citation {
  readonly id: string;
  readonly trustId: string;
  readonly referenceText: string;
}

export interface ReasoningTrace {
  readonly id: string;
  readonly trustId: string;
  readonly stepDescription: string;
}

export interface ConfidenceScore {
  readonly id: string;
  readonly trustId: string;
  readonly dimension: string;
  readonly score: number;
}

export interface Feedback {
  readonly id: string;
  readonly trustId: string;
  readonly userId: string;
  readonly feedbackType: string;
  readonly comment: string | null;
  readonly createdAt: string;
}

export interface TrustPackage {
  readonly id: string;
  readonly resultId: string;
  readonly overallConfidence: number;
  readonly createdAt: string;
  readonly evidence: ReadonlyArray<EvidenceLink>;
  readonly citations: ReadonlyArray<Citation>;
  readonly traces: ReadonlyArray<ReasoningTrace>;
  readonly confidenceScores: ReadonlyArray<ConfidenceScore>;
}
