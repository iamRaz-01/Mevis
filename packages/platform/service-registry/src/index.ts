export interface ServiceInfo {
  readonly name: string;
  readonly version: string;
  readonly endpoint: string;
  readonly status: 'UP' | 'DOWN';
}

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class ServiceRegistryClient {
  private readonly registryUrl: string;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(registryUrl?: string) {
    this.registryUrl = registryUrl || process.env['REGISTRY_URL'] || 'http://localhost:8000';
  }

  /**
   * Registers a service with the central registry.
   */
  async register(info: ServiceInfo): Promise<void> {
    try {
      const resp = await fetch(`${this.registryUrl}/api/registry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });

      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Registry responded with status ${resp.status}: ${body}`);
      }
    } catch (err) {
      throw new RegistryError(
        `Failed to register service "${info.name}" at ${this.registryUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Starts periodic registration heartbeats.
   */
  startHeartbeats(info: ServiceInfo, intervalMs = 15000): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.register(info).catch((err) => {
        process.stderr.write(`[Registry Heartbeat Error]: ${err.message}\n`);
      });
    }, intervalMs);
    // Unref so process can exit cleanly
    this.heartbeatInterval.unref();
  }

  /**
   * Resolves a service endpoint by name.
   */
  async resolve(serviceName: string): Promise<string> {
    // If the address is already local fallback to env (e.g. storage-service -> localhost:3002)
    // to allow offline runs.
    const directEnvKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_PORT`;
    const fallbackPort = process.env[directEnvKey];
    if (fallbackPort) {
      return `http://localhost:${fallbackPort}`;
    }

    try {
      const resp = await fetch(`${this.registryUrl}/api/registry/resolve/${serviceName}`);
      if (!resp.ok) {
        throw new Error(`Status ${resp.status}`);
      }
      const envelope = (await resp.json()) as { success: boolean; data?: { endpoint: string } };
      if (envelope.success && envelope.data?.endpoint) {
        return envelope.data.endpoint;
      }
      throw new Error('No endpoint returned in standard envelope.');
    } catch (err) {
      throw new RegistryError(
        `Failed to resolve service "${serviceName}" from registry ${this.registryUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * Graceful deregistration on shutdown.
   */
  async deregister(name: string, endpoint: string): Promise<void> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    try {
      await fetch(`${this.registryUrl}/api/registry/deregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, endpoint }),
      });
    } catch {
      // Best effort on exit
    }
  }
}

export const registry = new ServiceRegistryClient();
