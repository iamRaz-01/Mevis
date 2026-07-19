export interface DigitalTwinContext {
  readonly entities: Record<string, any>;
  readonly relationships: readonly any[];
  readonly validatedContext: any;
  readonly activeSituations: readonly any[];
  readonly timeline: {
    readonly currentEventTime: string;
    readonly synchronizedTime: string;
  };
  readonly confidence: {
    readonly score: number;
    readonly factors: readonly string[];
  };
  readonly provenance: string;
}

export interface DigitalTwinSnapshot {
  readonly id: string;
  readonly snapshotData: DigitalTwinContext;
  readonly createdAt: string;
}
