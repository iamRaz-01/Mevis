# MEVIS Platform Communication & Service Runtime Guide

This guide explains how every service in the MEVIS platform must interact with other services
using the **Communication & Service Runtime** SDK introduced in Milestone 4.

---

## Architecture Overview

```
                        [ Gateway (Port 8000) ]
                       /                       \
                      /                         \
                     v                           v
     [ Service A (Port 3001) ]   =========>   [ Service B (Port 3002) ]
        (Context Storage)                       (Context Storage)
        (Resilient Client)                      (Resilient Client)
```

No service should hardcode physical addresses or manually write HTTP request/retry routines.
The platform handles service registration, dynamic resolution, tracing context propagation, and circuit protection.

---

## 1. Context Tracing & AsyncLocalStorage

The platform utilizes Node's built-in `AsyncLocalStorage` to implicitly store request contexts. Any downstream asynchronous flow (including database access, remote clients, logs) can retrieve details like `requestId` and `correlationId` automatically.

To bind tracing context to an execution pipeline (usually in an HTTP middleware/handler):

```typescript
import { contextStorage, extractContext } from '@mevis/platform-communication';

// Middleware / Request Handler
const server = http.createServer((req, res) => {
  const ctx = extractContext(req); // Reads x-request-id, x-correlation-id, x-actor-id, etc.

  contextStorage.run(ctx, async () => {
    // Inside this block, the context is implicitly bound to this thread-of-execution
    await processOrder();
  });
});
```

To fetch active context:

```typescript
import { getRequestContext } from '@mevis/platform-communication';

const ctx = getRequestContext();
console.log(`Current correlation ID is ${ctx.correlationId}`);
```

---

## 2. Dynamic Service Client with Circuit Protection

To call another service, use the `serviceClient` instance. It handles dynamic registry resolution, propagates tracing context headers, and implements exponential retries and circuit breaker protection.

```typescript
import { serviceClient } from '@mevis/platform-service-client';

interface IncidentResponse {
  id: string;
  status: string;
}

async function alertIncidentCoordinator(incidentId: string) {
  // Resolved via Registry, retried on failures, protected by circuit breaker:
  const incident = await serviceClient.request<IncidentResponse>(
    'incident-service',
    `/api/incidents/${incidentId}`,
    {
      method: 'GET',
      timeoutMs: 3000,
      retries: 3,
    },
  );

  return incident;
}
```

### Circuit Breaker Mechanics

- **Threshold**: 5 consecutive failures to a service name opens the circuit.
- **Action**: Outbound calls fail fast immediately with a `CircuitOpenError` (Status 503) without making network calls, preventing downstream cascade.
- **Recovery**: After a **10-second cooldown**, the client attempts a recovery call (Half-Open). If it succeeds, the circuit closes. If it fails, the circuit opens again.

---

## 3. Service Registration

On startup, each microservice must register itself with the central registry:

```typescript
import { registry } from '@mevis/platform-service-registry';

const PORT = 3001;

server.listen(PORT, () => {
  const info = {
    name: 'context-service',
    version: '1.0.0',
    endpoint: `http://localhost:${PORT}`,
    status: 'UP' as const,
  };

  // 1. Initial Registration
  registry.register(info);

  // 2. Start Registration Heartbeats (runs every 15s)
  registry.startHeartbeats(info);
});
```

---

## 4. Uniform JSON Envelope

Every HTTP response must adhere to the standard envelope:

```json
{
  "success": true,
  "data": {
    "some": "payload"
  },
  "errors": [],
  "metadata": {
    "requestId": "req-123-abc",
    "correlationId": "corr-999-xyz",
    "service": "incident-service",
    "timestamp": "2026-07-19T10:00:00.000Z"
  }
}
```

To format a response:

```typescript
import { createEnvelope } from '@mevis/platform-communication';

res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(
  JSON.stringify(
    createEnvelope(true, { activeVolunteersCount: 42 }, undefined, 'volunteer-service'),
  ),
);
```
