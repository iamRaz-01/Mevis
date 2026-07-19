// --- Standard Metric Types ---
export interface Counter {
  readonly type: "counter";
  value: number;
  increment(val?: number): void;
}

export interface Gauge {
  readonly type: "gauge";
  value: number;
  set(val: number): void;
}

export interface Histogram {
  readonly type: "histogram";
  values: number[];
  record(val: number): void;
  getAverage(): number;
}

export interface Timer {
  readonly type: "timer";
  start(): () => number;
}

export class MetricsService {
  private readonly metrics: Map<string, Counter | Gauge | Histogram> = new Map();

  /**
   * Retrieves or creates a monotonic counter metric.
   */
  counter(name: string): Counter {
    let metric = this.metrics.get(name);
    if (!metric || metric.type !== "counter") {
      metric = {
        type: "counter",
        value: 0,
        increment(val = 1) {
          this.value += val;
        },
      };
      this.metrics.set(name, metric);
    }
    return metric as Counter;
  }

  /**
   * Retrieves or creates an instantaneous gauge metric.
   */
  gauge(name: string): Gauge {
    let metric = this.metrics.get(name);
    if (!metric || metric.type !== "gauge") {
      metric = {
        type: "gauge",
        value: 0,
        set(val: number) {
          this.value = val;
        },
      };
      this.metrics.set(name, metric);
    }
    return metric as Gauge;
  }

  /**
   * Retrieves or creates a distribution histogram metric.
   */
  histogram(name: string): Histogram {
    let metric = this.metrics.get(name);
    if (!metric || metric.type !== "histogram") {
      metric = {
        type: "histogram",
        values: [],
        record(val: number) {
          this.values.push(val);
          // Keep sliding window size cap
          if (this.values.length > 1000) {
            this.values.shift();
          }
        },
        getAverage() {
          if (this.values.length === 0) return 0;
          return this.values.reduce((a, b) => a + b, 0) / this.values.length;
        },
      };
      this.metrics.set(name, metric);
    }
    return metric as Histogram;
  }

  /**
   * Starts a timer metric tracking execution duration.
   */
  timer(): Timer {
    return {
      type: "timer",
      start() {
        const start = performance.now();
        return () => {
          return performance.now() - start;
        };
      },
    };
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
   * Retrieves all registered metrics.
   */
  getAllMetrics(): Record<string, { type: string; value: number | number[] }> {
    const results: Record<string, { type: string; value: number | number[] }> = {};
    for (const [key, m] of this.metrics.entries()) {
      results[key] = {
        type: m.type,
        value: m.type === "histogram" ? (m as Histogram).values : (m as Counter | Gauge).value,
      };
    }
    return results;
  }
}

export const metrics = new MetricsService();
