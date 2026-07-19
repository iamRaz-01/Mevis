export class FeatureFlagService {
  private readonly flags: Map<string, boolean> = new Map();

  constructor() {
    // Standard system/platform-level default flags
    this.registerFlag("canary-api-router", process.env.ENABLE_CANARY_ROUTER === "true");
    this.registerFlag("maintenance-mode", process.env.MAINTENANCE_MODE === "true");
  }

  /**
   * Registers a new feature flag configuration.
   */
  registerFlag(name: string, defaultValue = false): void {
    if (!this.flags.has(name)) {
      this.flags.set(name, defaultValue);
    }
  }

  /**
   * Evaluates if a given feature flag is enabled.
   */
  isEnabled(name: string): boolean {
    return this.flags.get(name) ?? false;
  }

  /**
   * Dynamically toggles/configures a feature flag at runtime.
   */
  setFlag(name: string, value: boolean): void {
    this.flags.set(name, value);
  }

  /**
   * Returns a key-value record of all currently active configurations.
   */
  getAllFlags(): Record<string, boolean> {
    const records: Record<string, boolean> = {};
    for (const [key, val] of this.flags.entries()) {
      records[key] = val;
    }
    return records;
  }
}

export const featureFlags = new FeatureFlagService();
