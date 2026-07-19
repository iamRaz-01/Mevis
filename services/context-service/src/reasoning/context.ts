export interface EvidenceRecord {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly relevanceScore: number;
  readonly provenance: string;
}

export interface PolicyRecord {
  readonly id: string;
  readonly category: string;
  readonly content: string;
  readonly mandatory: boolean;
}

export interface RiskReport {
  readonly description: string;
  readonly severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  readonly likelihood: "UNLIKELY" | "POSSIBLE" | "LIKELY";
  readonly supportingEvidence: readonly string[];
  readonly affectedEntities: readonly string[];
  readonly confidence: number;
}

export interface ReasoningTrace {
  readonly evidenceUsed: ReadonlyArray<EvidenceRecord>;
  readonly policiesReferenced: ReadonlyArray<PolicyRecord>;
  readonly constraintsEvaluated: readonly string[];
  readonly risksIdentified: ReadonlyArray<RiskReport>;
  readonly stages: readonly string[];
  readonly confidenceFactors: Record<string, number>;
  readonly executionMetadata: Record<string, any>;
}

export interface DecisionAnalysis {
  readonly id: string;
  readonly decisionId: string;
  readonly evidence: ReadonlyArray<EvidenceRecord>;
  readonly policies: ReadonlyArray<PolicyRecord>;
  readonly constraints: any;
  readonly risks: ReadonlyArray<RiskReport>;
  readonly trace: ReasoningTrace;
  readonly confidence: number;
  readonly provenance: string;
  readonly createdAt: string;
}
