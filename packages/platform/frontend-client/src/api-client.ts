import { type StandardResponse } from "@mevis/platform-communication";

export interface ApiClientConfig {
  readonly gatewayUrl: string;
}

export class ApiClient {
  private readonly gatewayUrl: string;

  constructor(config: ApiClientConfig) {
    this.gatewayUrl = config.gatewayUrl;
  }

  /**
   * Performs an authenticated, trace-tracked HTTP request to the API Gateway.
   */
  async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.gatewayUrl}${path.startsWith("/") ? path : `/${path}`}`;
    
    // Retrieve tracing correlation identifiers
    const requestId = crypto.randomUUID();
    let correlationId = "";
    
    if (typeof window !== "undefined") {
      let storedCorr = localStorage.getItem("mevis_correlation_id");
      if (!storedCorr) {
        storedCorr = crypto.randomUUID();
        localStorage.setItem("mevis_correlation_id", storedCorr);
      }
      correlationId = storedCorr;
    } else {
      correlationId = crypto.randomUUID();
    }

    // Copy and inject tracking & security headers
    const headers = new Headers(options.headers);
    headers.set("x-request-id", requestId);
    headers.set("x-correlation-id", correlationId);
    
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("mevis_auth_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    let payload: StandardResponse<T>;
    try {
      payload = (await response.json()) as StandardResponse<T>;
    } catch {
      throw new Error(`Failed to parse API Response from path: ${path}. Status: ${response.status}`);
    }

    if (!response.ok || !payload.success) {
      const firstErr = payload.errors?.[0];
      const errorMsg = firstErr
        ? `[${firstErr.code}] ${firstErr.message}`
        : `API Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return payload.data as T;
  }
}
