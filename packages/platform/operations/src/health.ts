export type HealthStatus = "UP" | "DOWN";

export interface HealthCheckResult {
  readonly status: HealthStatus;
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
   * Aggregates all registered system status results.
   */
  async evaluateHealth(): Promise<{ status: HealthStatus; details: Record<string, HealthCheckResult> }> {
    const details: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = "UP";

    for (const [name, check] of this.checks.entries()) {
      try {
        const result = await check();
        details[name] = result;
        if (result.status === "DOWN") {
          overallStatus = "DOWN";
        }
      } catch (error: unknown) {
        overallStatus = "DOWN";
        const errMsg = error instanceof Error ? error.message : String(error);
        details[name] = {
          status: "DOWN",
          reason: errMsg,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      status: overallStatus,
      details,
    };
  }
}

export const healthAggregator = new HealthAggregator();
export default healthAggregator;
