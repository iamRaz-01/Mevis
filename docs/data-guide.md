# MEVIS Persistent Data Platform & Event Infrastructure Guide

This guide describes how to consume the technology-agnostic **Persistent Data Platform & Event Infrastructure** SDK provided by `@mevis/platform-data`.

---

## Core Pipeline Flow

State modifications flow through a unified relational / transactional pipeline:

```text
Request Context ──► UnitOfWork.start() ──► Repository.save() ──► UnitOfWork.commit() ──► EventBus.publish() ──► Cache Invalidation
```

---

## 1. Database Connections & Ports

All database interactions flow through the `DatabaseClient` interface. The platform comes with an embedded, async promise-wrapped `SqliteDatabaseAdapter` for local development.

```typescript
import { SqliteDatabaseAdapter, type DatabaseClient } from "@mevis/platform-data";

// Initialized during bootstrap:
const db: DatabaseClient = new SqliteDatabaseAdapter("./data/mevis.db");
```

---

## 2. Repositories & Unit of Work (Transactions)

Business services must never write raw SQL. Instead, obtain generic `Repository<T, ID>` instances from the transactional `UnitOfWork`.

```typescript
import { RelationalUnitOfWork, type EntityMapping } from "@mevis/platform-data";

interface Volunteer {
  id: string;
  name: string;
  version: number; // For optimistic locking
}

interface Incident {
  id: string;
  title: string;
}

// 1. Define database entity-to-table mappings
const mappings = new Map<string, EntityMapping>([
  ["Volunteer", { tableName: "volunteers", columns: ["id", "name", "version"] }],
  ["Incident", { tableName: "incidents", columns: ["id", "title"] }]
]);

// 2. Perform transactional updates coordinating multiple repositories
const uow = new RelationalUnitOfWork(db, mappings);
await uow.start();

try {
  const volunteerRepo = uow.getRepository<Volunteer, string>("Volunteer");
  const incidentRepo = uow.getRepository<Incident, string>("Incident");

  // Save changes
  await volunteerRepo.save({ id: "v-100", name: "John Doe", version: 1 });
  await incidentRepo.save({ id: "i-500", title: "Crowd density threshold exceeded" });

  // Atomic Commit
  await uow.commit();
} catch (err) {
  // All modifications are rolled back atomically on failure
  await uow.rollback();
  throw err;
}
```

### Optimistic Locking
Repositories enforce optimistic locking on entities carrying a `version` column. If two concurrent database calls retrieve version `2` and try to write changes, the first commit succeeds (bumping the version to `3`). The second commit fails instantly, throwing a `ConcurrencyError` to prevent silent overwrites.

---

## 3. Cache Port with TTL Expirations

Exposes a swappable `CacheClient` interface to allow shifting from an in-memory cache to a distributed Redis cache without changing consumer business code.

```typescript
import { InMemoryCacheAdapter, type CacheClient } from "@mevis/platform-data";

const cache: CacheClient = new InMemoryCacheAdapter();

// Set key with 10-second TTL (Time-To-Live)
await cache.set("user:u-100", { name: "John" }, 10);

// Fetch cache
const cachedUser = await cache.get("user:u-100");

// Delete cache
await cache.delete("user:u-100");
```

---

## 4. Standardized Event Bus & DLQ

Enables decoupled, asynchronous inter-process communication. Every event dispatches using the standardized `PlatformEvent` schema:

```typescript
export interface PlatformEvent<T = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly version: number;
  readonly sourceService: string;
  readonly correlationId: string; // Transmitted implicitly via AsyncLocalStorage Context
  readonly payload: T;
}
```

### Subscriber Failover & DLQ
1.  **Reliable Subscriber Retries**: Automatically retries failing subscriber handlers up to 3 times with incremental backoff delays.
2.  **Dead-Letter Queue (DLQ)**: Routes repeatedly failing events to a registered DLQ handler, allowing monitoring and message recovery.

```typescript
import { LocalEventBusAdapter, type EventBus } from "@mevis/platform-data";

const eventBus: EventBus = new LocalEventBusAdapter();

// 1. Subscribe to eventType
eventBus.subscribe("volunteer.created", async (event) => {
  console.log(`Volunteer created! Event ID: ${event.eventId}. Payload:`, event.payload);
});

// 2. Register DLQ handler for failed subscribers
eventBus.registerDlqHandler(async (event, error) => {
  console.error(`Event ${event.eventId} failed after retries. Routing to DLQ. Error: ${error.message}`);
});

// 3. Publish domain event
await eventBus.publish("volunteer.created", { volunteerId: "v-100", email: "john@mevis.io" }, {
  aggregateId: "v-100",
  sourceService: "volunteer-service"
});
```

---

## 5. Schema Migrations

Maintain controlled schema evolution using versioned SQL migration scripts.

```typescript
import { SqlMigrationRunner } from "@mevis/platform-data";

const runner = new SqlMigrationRunner(db);

// Scans target directory, reads V1__init.sql, V2__add_index.sql in order,
// and runs unapplied scripts in a transaction context.
await runner.runMigrations("./migrations");
```

---

## 6. MEVIS Data Architecture Best Practices

To ensure long-term scalability and decouple microservices, the MEVIS platform implements the following engineering principles:

### Service Data Ownership
> [!IMPORTANT]
> **Strict Database Isolation**: Each service owns its underlying database schema and table structures. Services MUST NOT read or write to other services' tables directly. Cross-service data coordination occurs solely via REST/gRPC API requests or asynchronously using the `EventBus`.

### Transactional Outbox Pattern (Production Roadmap)
*   **The Problem**: If a process crashes after committing a database transaction but before successfully publishing to the Event Bus, events are lost.
*   **The Outbox Solution**: In production, the `UnitOfWork` stages writes to an `outbox_events` table within the *same* database transaction as the entity updates. A background worker periodically queries the `outbox_events` table, publishes them to the message broker (RabbitMQ/Kafka), and deletes them upon broker acknowledgment. This guarantees **at-least-once delivery**.

### CQRS (Command Query Responsibility Segregation)
For read-intensive or complex search queries (like Context or Knowledge Intelligence lookups), separate the Write (Command) repository operations from the Read (Query) models:
*   **Command Repository**: Implements write-only transactions (e.g. `RelationalRepository`).
*   **Query Repository**: Queries optimized read-models or Elasticsearch indexes (e.g. `ElasticQueryRepository`), updated asynchronously via Event Bus listeners.
