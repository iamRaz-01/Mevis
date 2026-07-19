export type HealthState = "Healthy" | "Degraded" | "Unavailable" | "Unknown";

export interface HealthCheckResult {
  readonly status: HealthState;
  readonly isCritical?: boolean;
  readonly reason?: string;
  readonly timestamp: string;
}

export type HealthCheck = () => Promise<HealthCheckResult>;

export class HealthAggregator {
  private readonly checks: Map<string, HealthCheck> = new Map();

  /**
   * Registers a dependency check with the aggregator.
   */
  registerCheck(name: string, check: HealthCheck): void {
    this.checks.set(name, check);
  }

  /**
   * Evaluates all registered metrics checks and returns a rich health state.
   */
  async evaluateHealth(): Promise<{ overallState: HealthState; details: Record<string, HealthCheckResult> }> {
    const details: Record<string, HealthCheckResult> = {};
    let overallState: HealthState = "Healthy";

    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await check();
        details[name] = result;
        
        if (result.status === "Unavailable" || result.status === "Unknown") {
          if (result.isCritical) {
            overallState = "Unavailable";
          } else if (overallState === "Healthy") {
            overallState = "Degraded";
          }
        } else if (result.status === "Degraded" && overallState === "Healthy") {
          overallState = "Degraded";
        }
      } catch (error: unknown) {
        overallState = "Unavailable";
        details[name] = {
          status: "Unknown",
          isCritical: true,
          reason: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      overallState,
      details,
    };
  }
}

export const healthAggregator = new HealthAggregator();
export default healthAggregator;
