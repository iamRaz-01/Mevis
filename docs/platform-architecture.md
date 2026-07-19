# MEVIS Platform Architecture & Runtime Operations Guide

This document establishes the unified architectural overview, request lifecycle, service execution flow, frontend consumption SDKs, and operations handbook for the MEVIS platform.

---

## 1. Unified Architecture Overview

The MEVIS platform is structured according to a strict layered design to ensure decoupled concerns, horizontal scalability, and standard operational diagnostics.

```text
+-----------------------------------------------------------+
|               OPERATIONS CONSOLE & BUSINESS UIs           |
|  - SRE console dashboard      - Personnel / Incidents     |
+-----------------------------------------------------------+
                              |
                              | (API Client Tracing SDK)
                              v
+-----------------------------------------------------------+
|                      API EDGE GATEWAY                     |
|  - CORS filters  - Rate Limiters  - Request Schema Checks  |
+-----------------------------------------------------------+
                              |
                              | (Centralized routing)
                              v
+-----------------------------------------------------------+
|                     COMMUNICATION MESH                    |
|  - Tracing Propagation  - Retries  - Circuit Breakers     |
+-----------------------------------------------------------+
                              |
                              | (downstream dispatch)
                              v
+-----------------------------------------------------------+
|                     OPERATIONAL SERVICES                  |
|  - Context   - Knowledge   - Security   - Auditing        |
+-----------------------------------------------------------+
                              |
                              | (Ports & Adapters)
                              v
+-----------------------------------------------------------+
|                     DATA & EVENTS INFRA                   |
|  - Relational SQLite   - Cache TTL   - Event Bus / DLQ    |
+-----------------------------------------------------------+
```

---

## 2. Request execution Lifecycle

Every request entering the MEVIS platform undergoes a deterministic pipeline checking validation, security authentication, and lineage logging:

```text
[Client App] --( 1. Fetch Request with Trace Headers )--> [Edge Runtime Gateway]
                                                                  |
                                                                  v
                                                        [2. Pre-flight CORS Checks]
                                                                  |
                                                                  v
                                                        [3. Rate Limiter Audit]
                                                                  |
                                                                  v
                                                        [4. JWT Signature Check]
                                                                  |
                                                                  v
                                                        [5. Schema Payload Validation]
                                                                  |
                                                                  v
[Target Service] <--( 7. Resilient client fetch with retries )-- [6. Gateway Route Resolver]
       |
       +--( 8. AsyncLocalStorage context storage binding )
       |
       +--( 9. Database adapter transaction / CRUD persistence )
       |
       +--( 10. Publish PlatformEvent -> LocalEventBus )
       |
       v
[Client App] <-----------------( 11. Unified Envelope Response )------------------+
```

---

## 3. Service Lifecycle

1.  **Bootstrap**: Services read environment settings, configure local secrets clients, and initialize metrics gauges.
2.  **Registration**: Services register their endpoint name, version, and route location with the Gateway Service Registry.
3.  **Heartbeat**: Services send heartbeats at regular intervals. Stale instances are automatically removed from gateway routing tables.
4.  **Shutdown**: Upon receiving SIGTERM, services stop accepting new requests, complete active database transactions, notify the gateway registry of cancellation, and exit.

---

## 4. Frontend Architecture

Frontend applications (`apps/dashboard` and `apps/operations-console`) depend strictly on standard platform SDKs:
*   **`@mevis/platform-frontend-client`**: Exports standard `ApiClient` to call API endpoints, automatically injecting correlation trace context headers (`x-correlation-id`, `x-request-id`) and user credentials from `localStorage`.
*   **`@mevis/platform-contracts`**: Provides centralized models (`StandardResponse`, `StandardError`, `PlatformEvent`, `PaginationMetadata`).
*   **`@mevis/platform-operations`**: Provides SRE telemetry metrics gauges, generic feature flag registry toggles, and rich dependency health aggregating.

---

## 5. Operations & Extension Guide

### 5.1 Deployment & Containers
*   Every microservice is built using `docker/Dockerfile.base` as the compile layer.
*   `docker/docker-compose.yml` mounts local folders in development, binding internal ports and exposing standard environment configurations.

### 5.2 Creating a New Service Checklist
1.  Add project folders under `services/[my-service]/`.
2.  Add name and entry references to root `package.json` workspaces and `tsconfig.json`.
3.  Implement standard health `/health` and diagnostic endpoints conforming to `StandardResponse`.
4.  Register service in `docker-compose.yml` mapping environment variables and database dependencies.
