import {
  getTraceHeaders,
  PlatformError,
  CircuitOpenError,
  DependencyError,
} from '@mevis/platform-communication';
import { registry } from '@mevis/platform-service-registry';

export interface RequestOptions extends Omit<RequestInit, 'headers'> {
  readonly headers?: Record<string, string>;
  readonly timeoutMs?: number;
  readonly retries?: number;
}

interface CircuitState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime?: number;
}

class CircuitBreaker {
  private readonly states = new Map<string, CircuitState>();
  private readonly threshold = 5; // consecutive failures
  private readonly cooldownMs = 10000; // 10s cooldown before attempting recovery

  private getState(serviceName: string): CircuitState {
    let state = this.states.get(serviceName);
    if (!state) {
      state = { status: 'CLOSED', failureCount: 0 };
      this.states.set(serviceName, state);
    }
    return state;
  }

  check(serviceName: string): void {
    const state = this.getState(serviceName);
    if (state.status === 'OPEN' && state.lastFailureTime) {
      const elapsed = Date.now() - state.lastFailureTime;
      if (elapsed > this.cooldownMs) {
        state.status = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError(serviceName);
      }
    }
  }

  recordSuccess(serviceName: string): void {
    const state = this.getState(serviceName);
    state.status = 'CLOSED';
    state.failureCount = 0;
  }

  recordFailure(serviceName: string): void {
    const state = this.getState(serviceName);
    state.failureCount++;
    state.lastFailureTime = Date.now();
    if (state.failureCount >= this.threshold) {
      state.status = 'OPEN';
      process.stderr.write(`[Circuit Breaker]: Circuit to service "${serviceName}" is now OPEN!\n`);
    }
  }
}

const circuitBreaker = new CircuitBreaker();

export class ResilientServiceClient {
  constructor(private readonly clientName = 'resilient-client') {}

  /**
   * Performs an inter-service request, automatically resolving the URL,
   * propagating trace headers, and applying retries and circuit breaker protection.
   */
  async request<T>(serviceName: string, path: string, options: RequestOptions = {}): Promise<T> {
    // 1. Check Circuit Breaker
    circuitBreaker.check(serviceName);

    // 2. Resolve target endpoint
    const baseEndpoint = await registry.resolve(serviceName);
    const url = `${baseEndpoint}${path.startsWith('/') ? path : `/${path}`}`;

    const maxRetries = options.retries ?? 3;
    let attempt = 0;
    let delay = 100; // start backoff at 100ms

    while (true) {
      attempt++;
      try {
        const traceHeaders = getTraceHeaders();
        const headers = {
          'Content-Type': 'application/json',
          'X-Caller-Service': this.clientName,
          ...traceHeaders,
          ...options.headers,
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Success condition
        if (response.ok) {
          circuitBreaker.recordSuccess(serviceName);
          const envelope = (await response.json()) as {
            success: boolean;
            data?: T;
            error?: string;
          };
          if (envelope.success) {
            return envelope.data as T;
          }
          throw new PlatformError(
            response.status,
            'API_ERROR',
            envelope.error || 'Remote API call succeeded but success = false',
          );
        }

        // Handle transient statuses by retrying, others fail immediately
        const transientStatuses = [502, 503, 504];
        if (!transientStatuses.includes(response.status) || attempt >= maxRetries) {
          throw new PlatformError(
            response.status,
            'REMOTE_CALL_FAILED',
            `Remote call to "${serviceName}" returned status ${response.status}`,
          );
        }
      } catch (err) {
        // Record failure for the Circuit Breaker on network errors or transient/timeout aborts
        if (attempt >= maxRetries) {
          circuitBreaker.recordFailure(serviceName);
          if (err instanceof PlatformError) throw err;
          throw new DependencyError(
            `Failed to communicate with service "${serviceName}" at ${url}: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }

      // Exponential backoff wait
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

export const serviceClient = new ResilientServiceClient();
