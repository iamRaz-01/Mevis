// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-health
// Standardized health models, checkers, and aggregator.
// Every service exposes a /api/health endpoint using these contracts to ensure
// uniform health reporting across the platform.
// ─────────────────────────────────────────────────────────────────────────────

export type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'UNKNOWN';

export interface DependencyHealth {
  readonly name: string;
  readonly status: HealthStatus;
  readonly responseTimeMs?: number;
  readonly detail?: string;
}

export interface HealthReport {
  readonly service: string;
  readonly version: string;
  readonly environment: string;
  readonly status: HealthStatus;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
  readonly dependencies: DependencyHealth[];
  readonly build?: {
    readonly commitSha?: string;
    readonly buildTime?: string;
  };
  readonly memory?: {
    readonly heapUsedMb: number;
    readonly heapTotalMb: number;
    readonly rssMb: number;
  };
}

export interface HealthChecker {
  readonly name: string;
  check(): Promise<DependencyHealth>;
}

/**
 * Aggregates multiple HealthCheckers into a single HealthReport.
 * The overall status rolls up as the worst individual status.
 */
export class HealthAggregator {
  private readonly checkers: HealthChecker[] = [];
  private readonly startTime = Date.now();

  constructor(
    private readonly serviceName: string,
    private readonly version: string,
    private readonly environment: string,
  ) {}

  register(checker: HealthChecker): this {
    this.checkers.push(checker);
    return this;
  }

  async report(): Promise<HealthReport> {
    const dependencies = await Promise.all(
      this.checkers.map((c) =>
        c.check().catch((err): DependencyHealth => ({
          name: c.name,
          status: 'DOWN',
          detail: err instanceof Error ? err.message : String(err),
        })),
      ),
    );

    const mem = process.memoryUsage();
    const status = this.aggregate(dependencies);

    return {
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      status,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      dependencies,
      build: {
        commitSha: process.env['GIT_COMMIT_SHA'],
        buildTime: process.env['BUILD_TIME'],
      },
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1_048_576),
        heapTotalMb: Math.round(mem.heapTotal / 1_048_576),
        rssMb: Math.round(mem.rss / 1_048_576),
      },
    };
  }

  private aggregate(dependencies: DependencyHealth[]): HealthStatus {
    if (dependencies.some((d) => d.status === 'DOWN')) return 'DOWN';
    if (dependencies.some((d) => d.status === 'DEGRADED')) return 'DEGRADED';
    if (dependencies.some((d) => d.status === 'UNKNOWN')) return 'UNKNOWN';
    return 'UP';
  }
}

/** A simple always-up self-check useful as a baseline dependency. */
export class SelfHealthChecker implements HealthChecker {
  readonly name = 'self';
  async check(): Promise<DependencyHealth> {
    return { name: 'self', status: 'UP', detail: 'Process is running.' };
  }
}
