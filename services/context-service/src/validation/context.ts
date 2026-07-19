import { type ContextPackage } from "../context/context";

export interface ContextValidationContext {
  readonly contextPackage: ContextPackage;
  readonly validationRules: Record<string, any>;
  readonly intermediateResults: Record<string, any>;
  readonly timeline: {
    readonly compiledTime: string;
    readonly checkedTime: string;
  };
}

export interface ValidationManifest {
  readonly packageId: string;
  readonly consistencyPassed: boolean;
  readonly completenessPassed: boolean;
  readonly freshnessPassed: boolean;
  readonly conflictsFound: readonly string[];
  readonly qualityScore: number;
  readonly confidenceScore: number;
  readonly explainableFactors: readonly string[];
  readonly checkedAt: string;
}

export interface ContextHealth {
  readonly packageId: string;
  readonly status: "TRUSTED" | "UNTRUSTED";
  readonly score: number;
  readonly manifest: ValidationManifest;
}
