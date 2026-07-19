export interface DecisionContext {
  readonly twinSnapshot: any;
  readonly validatedContextPackage: any;
  readonly evidenceReferences: readonly string[];
  readonly knowledgeRef: string;
  readonly entitiesInvolved: readonly string[];
  readonly activeSituations: readonly any[];
  readonly timeline: {
    readonly eventTime: string;
    readonly compiledTime: string;
  };
  readonly metadata: Record<string, any>;
}

export interface DecisionConstraints {
  readonly operational: readonly string[];
  readonly business: readonly string[];
  readonly resource: readonly string[];
  readonly time: readonly string[];
  readonly legal: readonly string[];
}

export interface DecisionCandidate {
  readonly id: string;
  readonly decisionType: string;
  readonly lifecycleState: "Detected" | "Registered" | "Context Attached" | "Constraints Attached" | "Ready For Reasoning";
  readonly context: DecisionContext;
  readonly constraints: DecisionConstraints;
  readonly manifest: any;
  readonly createdAt: string;
}
