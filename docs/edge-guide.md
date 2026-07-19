# MEVIS Platform Edge Runtime Guide

This guide documents the **Platform Edge Runtime** governing incoming external client traffic (Web/Mobile Apps, API integrations) before it enters MEVIS.

---

## Edge Position & Flow

External requests enter through the API Gateway, where they pass through edge policies before reaching the internal communication mesh:

```text
External Client ──► CORS & Security Headers ──► Rate Limiting ──► Request Validation ──► Versioned Route Matching ──► Downstream Proxy
```

---

## 1. Path-Based Routing & API Versioning

All public client endpoints must conform to the routing contract:

```text
/api/:apiVersion/services/:serviceName/*
```

Examples:

- `GET /api/v1/services/volunteer-service/volunteers` matches version `v1` and proxies to `volunteer-service` on the route `/volunteers`.
- `POST /api/v2/services/context-service/telemetry` matches version `v2` and proxies to `context-service` on the route `/telemetry`.

Downstream services do not need to parse `/api/v1/services/...` segments. The Edge Router removes them, forwarding the request context cleanly.

---

## 2. Request Schema Validation at the Edge

To prevent malformed payloads from consuming internal computing resources, validate query and body schemas at the gateway.

```typescript
import { RequestValidator, type RequestSchema } from '@mevis/platform-edge-runtime';

// 1. Define verification schema
const telemetrySchema: RequestSchema = {
  body: {
    deviceId: { type: 'string', required: true, min: 3 },
    reading: { type: 'number', required: true, min: 0, max: 100 },
  },
};

// 2. Validate payload within Gateway request loop
const validationErrors = RequestValidator.validate(telemetrySchema, bodyPayload, queryParams);
if (validationErrors) {
  // Returns normalized 400 Bad Request envelope
  json(res, 400, createEnvelope(false, undefined, validationErrors, 'gateway'));
}
```

---

## 3. Platform Policies

The Edge Runtime enforces central platform-wide policies:

### Security Headers

Every edge response automatically carries standard security headers:

- `Content-Security-Policy`: Restricts script execution to same-origin.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
- `Strict-Transport-Security`: Forces TLS connections.

### CORS Options

Preflight `OPTIONS` requests are handled and terminated at the edge:

- **Allowed Origins**: `http://localhost:3000`, `https://mevis.io`, `https://admin.mevis.io`.
- **Allowed Headers**: `Content-Type`, `Authorization`, `X-Request-Id`, `X-Correlation-Id`, `X-Caller-Service`.
- **Cache Duration**: Options pre-flight headers are cached by clients for 24 hours (`Access-Control-Max-Age: 86400`).

### IP Rate Limiting

Prevents API abuse.

- **Limit**: 100 requests per 1-minute window per IP.
- **Action**: Exceeding requests are rejected immediately, returning `429 Too Many Requests` status carrying the `RATE_LIMIT_EXCEEDED` error code.
