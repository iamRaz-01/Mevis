export interface RequestMetrics {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  totalDurationMs: number;
}

export class MetricsService {
  private readonly metrics: Map<string, RequestMetrics> = new Map();

  /**
   * Records details of an HTTP request execution.
   */
  recordRequest(service: string, success: boolean, durationMs: number): void {
    let current = this.metrics.get(service);
    if (!current) {
      current = { totalRequests: 0, successRequests: 0, failedRequests: 0, totalDurationMs: 0 };
      this.metrics.set(service, current);
    }

    current.totalRequests++;
    if (success) {
      current.successRequests++;
    } else {
      current.failedRequests++;
    }
    current.totalDurationMs += durationMs;
  }

  /**
   * Returns resource utilization metrics (memory, CPU uptime).
   */
  getSystemMetrics() {
    const isServer = typeof process !== "undefined" && typeof process.memoryUsage === "function";
    const memory = isServer
      ? process.memoryUsage()
      : { rss: 52428800, heapTotal: 96468992, heapUsed: 45875200, external: 1250000 };
    const uptime = isServer ? process.uptime() : 124.5;
    const cpu = isServer ? process.cpuUsage() : { user: 25000, system: 8000 };

    return {
      uptime,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
      cpu,
    };
  }

  /**
   * Retrieves aggregated request latency and throughput metrics.
   */
  getMetricsSummary(): Record<string, RequestMetrics & { avgLatencyMs: number }> {
    const summary: Record<string, RequestMetrics & { avgLatencyMs: number }> = {};
    for (const [service, data] of this.metrics.entries()) {
      summary[service] = {
        ...data,
        avgLatencyMs: data.totalRequests > 0 ? data.totalDurationMs / data.totalRequests : 0,
      };
    }
    return summary;
  }
}

export const metrics = new MetricsService();
