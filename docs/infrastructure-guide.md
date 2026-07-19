# Infrastructure Guide — MEVIS Core Infrastructure Services

This guide explains how every MEVIS component should consume the shared
infrastructure services and packages provided by **Milestone 4 Issue #3**.

---

## Architectural Position

```
Applications (apps/*)
      ↓
API Gateway (future)
      ↓
Identity Service (services/identity-service)
      ↓
Infrastructure Services (services/*-service)
      ↓
Infrastructure Packages (packages/infrastructure/*)
```

Business services interact with infrastructure through **two patterns**:

1. **Package import** — import a shared package directly into your service code.
2. **HTTP API call** — make a network request to a running infrastructure microservice.

---

## Infrastructure Packages

Install by adding to your service's `package.json` dependencies:

```json
{
  "dependencies": {
    "@mevis/infrastructure-secrets": "^1.0.0",
    "@mevis/infrastructure-configuration": "^1.0.0",
    "@mevis/infrastructure-storage": "^1.0.0",
    "@mevis/infrastructure-notification": "^1.0.0",
    "@mevis/infrastructure-auditing": "^1.0.0",
    "@mevis/infrastructure-health": "^1.0.0"
  }
}
```

---

### `@mevis/infrastructure-secrets`

Resolves sensitive values from environment variables via a stable port interface.
Future migrations to HashiCorp Vault or AWS Secrets Manager only require swapping the adapter.

```typescript
import { secrets } from '@mevis/infrastructure-secrets';

const jwtSecret = secrets.require('JWT_SECRET'); // throws SecretsError if absent
const dbPass = secrets.get('DB_PASSWORD'); // returns undefined if absent
```

**Supported keys**: `JWT_SECRET`, `DB_PASSWORD`, `DB_URL`, `SMTP_PASSWORD`,
`SMS_API_KEY`, `ENCRYPTION_KEY`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`.

---

### `@mevis/infrastructure-configuration`

Validates and loads strongly-typed configuration objects from environment variables.
Services must never access `process.env` directly.

```typescript
import { loadServiceConfig, loadDatabaseConfig } from '@mevis/infrastructure-configuration';

const config = loadServiceConfig('my-service');
// { serviceName, environment, port, logLevel, version }

const db = loadDatabaseConfig();
// { url, poolMin, poolMax }
```

**Available loaders**: `loadServiceConfig`, `loadDatabaseConfig`, `loadStorageConfig`, `loadNotificationConfig`.

---

### `@mevis/infrastructure-storage`

Provides a `StoragePort` interface for file operations. The default adapter writes
to the local filesystem. Swap for S3/GCS adapters without changing consumers.

```typescript
import { LocalStorageAdapter } from '@mevis/infrastructure-storage';

const storage = new LocalStorageAdapter('./uploads');

const meta = await storage.upload({
  originalName: 'report.pdf',
  mimeType: 'application/pdf',
  content: Buffer.from('...'),
});

const file = await storage.download(meta.id);
```

---

### `@mevis/infrastructure-notification`

Routes notification requests through a unified port. Swap the adapter for real
email/SMS/webhook delivery without touching business service code.

```typescript
import { ConsoleNotificationAdapter } from '@mevis/infrastructure-notification';

const notifier = new ConsoleNotificationAdapter();
const result = await notifier.send({
  recipients: [{ id: 'u1', email: 'ops@mevis.io' }],
  channels: ['email'],
  subject: 'Incident Alert',
  body: 'Crowd density threshold exceeded at Gate A.',
  priority: 'high',
});
```

---

### `@mevis/infrastructure-auditing`

Emits structured, immutable audit events. Every security-sensitive action must
flow through this package. Pipe stdout to your log aggregator in production.

```typescript
import { audit } from '@mevis/infrastructure-auditing';

await audit.emit({
  actorId: user.id,
  actorRole: 'ROLE_ADMIN',
  action: 'USER_DISABLED',
  outcome: 'SUCCESS',
  resourceType: 'user',
  resourceId: targetUser.id,
});
```

---

### `@mevis/infrastructure-health`

Aggregates health checks into a `HealthReport`. Register a checker per dependency.

```typescript
import { HealthAggregator, SelfHealthChecker } from '@mevis/infrastructure-health';

const health = new HealthAggregator('my-service', '1.0.0', 'production');
health.register(new SelfHealthChecker());

const report = await health.report();
// { status: "UP", dependencies: [...], memory: {...}, uptime: 42 }
```

---

## Infrastructure Microservices (HTTP APIs)

Each service runs as a standalone HTTP process. All responses follow the envelope:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-07-19T10:00:00.000Z"
}
```

| Service                 | Default Port | Key Endpoints                                                      |
| ----------------------- | :----------: | ------------------------------------------------------------------ |
| `configuration-service` |    `3001`    | `GET /api/config`, `GET /api/health`                               |
| `storage-service`       |    `3002`    | `POST /api/files`, `GET /api/files/:id`, `DELETE /api/files/:id`   |
| `notification-service`  |    `3003`    | `POST /api/notifications`, `GET /api/health`                       |
| `audit-service`         |    `3004`    | `POST /api/audit-events`, `GET /api/audit-events`                  |
| `health-service`        |    `3000`    | `GET /api/health`, `GET /api/health/live`, `GET /api/health/ready` |

---

## Environment Variables

| Variable                      | Used By         | Default            |
| ----------------------------- | --------------- | ------------------ |
| `NODE_ENV`                    | All services    | `development`      |
| `PORT`                        | All services    | `3000`             |
| `LOG_LEVEL`                   | All services    | `info`             |
| `JWT_SECRET`                  | `secrets`       | _(required)_       |
| `DB_URL`                      | `configuration` | _(empty)_          |
| `DB_POOL_MIN` / `DB_POOL_MAX` | `configuration` | `2` / `10`         |
| `STORAGE_PROVIDER`            | `storage`       | `local`            |
| `STORAGE_BASE_PATH`           | `storage`       | `./uploads`        |
| `STORAGE_MAX_FILE_SIZE_BYTES` | `storage`       | `52428800` (50 MB) |
| `SMTP_HOST` / `SMTP_PORT`     | `notification`  | `localhost` / `25` |

---

## Verification

```bash
# Type-check the entire monorepo (including infrastructure packages)
npm run typecheck

# Build all packages and services
npm run build

# Verify import boundary compliance
python scripts/verify-boundaries.py

# Start all infrastructure services and verify endpoint responses
python scripts/verify-infrastructure.py
```
