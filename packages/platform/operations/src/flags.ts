export interface FeatureFlags {
  readonly "cognitive-intelligence-gate": boolean;
  readonly "canary-api-router": boolean;
  readonly "maintenance-mode": boolean;
}

export class FeatureFlagService {
  private readonly flags: FeatureFlags;

  constructor() {
    // Dynamic loading from environment settings or default stubs
    this.flags = {
      "cognitive-intelligence-gate": process.env.ENABLE_COGNITIVE_GATE === "true" || true,
      "canary-api-router": process.env.ENABLE_CANARY_ROUTER === "true" || false,
      "maintenance-mode": process.env.MAINTENANCE_MODE === "true" || false,
    };
  }

  /**
   * Evaluates a feature flag for the current runtime.
   */
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Retrieves all flag configurations.
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagService();
