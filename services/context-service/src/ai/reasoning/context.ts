export interface Intent {
  readonly query: string;
  readonly intentType: string;
  readonly confidence: number;
}

export interface ReasoningStep {
  readonly id: string;
  readonly planId: string;
  readonly stepIndex: number;
  readonly description: string;
  readonly status: string;
  readonly targetEngine: string;
}

export interface ReasoningPlan {
  readonly id: string;
  readonly sessionId: string;
  readonly query: string;
  readonly intent: string;
  readonly status: string;
  readonly createdAt: string;
  readonly steps: ReadonlyArray<ReasoningStep>;
}

export interface ReasoningGraph {
  readonly nodes: ReadonlyArray<{ readonly id: string; readonly label: string }>;
  readonly edges: ReadonlyArray<{ readonly from: string; readonly to: string }>;
}
