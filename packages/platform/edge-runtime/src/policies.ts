export interface CorsOptions {
  readonly allowedOrigins: string[];
  readonly allowedMethods: string[];
  readonly allowedHeaders: string[];
  readonly maxAgeSeconds?: number;
}

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
}

export const platformCorsOptions: CorsOptions = {
  allowedOrigins: ['http://localhost:3000', 'https://mevis.io', 'https://admin.mevis.io'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-Id',
    'X-Correlation-Id',
    'X-Caller-Service',
  ],
  maxAgeSeconds: 86400, // 24 hours caching for options requests
};

export const platformRateLimit: RateLimitConfig = {
  maxRequests: 100, // 100 requests
  windowMs: 60000, // per 1 minute window
};

export const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};
