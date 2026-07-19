export interface ResolvedRoute {
  readonly serviceName: string;
  readonly apiVersion: string;
  readonly targetPath: string;
}

export class EdgeRouter {
  /**
   * Parses incoming request URLs and maps them to target services.
   * Matches pattern: /api/:version/services/:serviceName/*
   * Returns ResolvedRoute, or null if path does not match external routing contract.
   */
  static resolve(urlPath: string): ResolvedRoute | null {
    const segments = urlPath.split('/').filter(Boolean);

    // Matches /api/v1/services/user-service/something
    if (
      segments[0] === 'api' &&
      segments[1]?.startsWith('v') &&
      segments[2] === 'services' &&
      segments[3]
    ) {
      const apiVersion = segments[1];
      const serviceName = segments[3];
      const targetPath = '/' + segments.slice(4).join('/');

      return {
        serviceName,
        apiVersion,
        targetPath,
      };
    }

    return null;
  }
}
