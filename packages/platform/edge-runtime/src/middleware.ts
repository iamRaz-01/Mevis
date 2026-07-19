import http from 'node:http';
import { createEnvelope, extractContext, contextStorage } from '@mevis/platform-communication';
import { platformCorsOptions, platformRateLimit, securityHeaders } from './policies';

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitTracker>();

export class EdgeMiddleware {
  /**
   * Enforces CORS policies, handling pre-flight requests.
   * Returns true if pre-flight request was handled, false otherwise.
   */
  static handleCors(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const origin = req.headers.origin;

    if (origin && platformCorsOptions.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Default fallback or restrict
      res.setHeader('Access-Control-Allow-Origin', platformCorsOptions.allowedOrigins[0] || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', platformCorsOptions.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', platformCorsOptions.allowedHeaders.join(', '));

    if (platformCorsOptions.maxAgeSeconds !== undefined) {
      res.setHeader('Access-Control-Max-Age', String(platformCorsOptions.maxAgeSeconds));
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return true; // request completed
    }

    return false;
  }

  /**
   * Injects standard HTTP security headers.
   */
  static injectSecurityHeaders(res: http.ServerResponse): void {
    for (const [key, val] of Object.entries(securityHeaders)) {
      res.setHeader(key, val);
    }
  }

  /**
   * Enforces request rate limits in memory.
   * Returns true if rate limit is exceeded (response sent), false otherwise.
   */
  static enforceRateLimit(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    const ctx = extractContext(req);
    const ip = ctx.clientIp || 'unknown-ip';
    const now = Date.now();

    let tracker = rateLimitStore.get(ip);
    if (!tracker || now > tracker.resetTime) {
      tracker = {
        count: 0,
        resetTime: now + platformRateLimit.windowMs,
      };
      rateLimitStore.set(ip, tracker);
    }

    tracker.count++;

    if (tracker.count > platformRateLimit.maxRequests) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify(
          createEnvelope(
            false,
            undefined,
            [
              {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
              },
            ],
            'edge-gateway',
          ),
        ),
      );
      return true; // Limit exceeded
    }

    return false;
  }

  /**
   * Helper that runs the edge middleware pipeline, wrapping the execution in contextStorage.
   * If any middleware returns true, request handling stops.
   */
  static async runPipeline(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: () => Promise<void> | void,
  ): Promise<void> {
    const ctx = extractContext(req);

    await contextStorage.run(ctx, async () => {
      // 1. Inject security headers
      EdgeMiddleware.injectSecurityHeaders(res);

      // 2. Handle CORS
      if (EdgeMiddleware.handleCors(req, res)) {
        return;
      }

      // 3. Enforce Rate Limiting
      if (EdgeMiddleware.enforceRateLimit(req, res)) {
        return;
      }

      await next();
    });
  }
}
