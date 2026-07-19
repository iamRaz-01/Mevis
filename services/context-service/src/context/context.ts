export interface PrioritizedFact {
  readonly factId: string;
  readonly entityId: string;
  readonly description: string;
  readonly priorityScore: number; // 0.0 to 1.0
  readonly attributes: Record<string, any>; // urgency, severity, recency, distance
  readonly provenance: string;
}

export interface ContextRelationship {
  readonly sourceId: string;
  readonly targetId: string;
  readonly relationshipType: string; // NEAR, CAN_RESPOND_TO, AFFECTS
  readonly explanation: string;
}

export interface Situation {
  readonly situationId: string;
  readonly title: string;
  readonly severity: string; // LOW, MEDIUM, HIGH, CRITICAL
  readonly status: string; // ACTIVE, RESOLVED
  readonly entitiesInvolved: readonly string[];
  readonly createdAt: string;
}

export interface ContextGraph {
  readonly nodes: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
    readonly type: string;
    readonly provenance: string;
  }>;
  readonly edges: ReadonlyArray<{
    readonly source: string;
    readonly target: string;
    readonly relationship: string;
    readonly explanation: string;
  }>;
}

export interface ContextPackage {
  readonly packageId: string;
  readonly situationId: string;
  readonly involvedEntities: readonly string[];
  readonly contextualRelationships: readonly ContextRelationship[];
  readonly prioritizedFacts: readonly PrioritizedFact[];
  readonly evidenceReferences: readonly string[];
  readonly timeline: {
    readonly eventTime: string;
    readonly compiledTime: string;
  };
  readonly confidence: number;
  readonly provenance: Record<string, string>;
  readonly metadata: Record<string, any>;
}

export interface ContextManifest {
  readonly sourcesConsumed: readonly string[];
  readonly entitiesSelected: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly prioritizationDecisions: Record<string, number>;
  readonly compressionStatistics: {
    readonly originalCount: number;
    readonly compressedCount: number;
  };
  readonly timeline: {
    readonly eventTime: string;
    readonly compiledTime: string;
  };
  readonly latencyMs: number;
  readonly packageSize: number;
}

export interface ContextAssemblyContext {
  readonly worldEntities: Record<string, any>;
  readonly latestStates: Record<string, any>;
  readonly activeIncidents: readonly any[];
  readonly evidenceReferences: readonly string[];
}
