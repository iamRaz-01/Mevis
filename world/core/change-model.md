# Digital Twin State Change Model

Defines the cycle of state mutations in the Digital Twin.

---

## 1. State Update Sequence

```text
Telemetry Observation Ingestion ──> Schema Validation ──>
Delta State computation ──> Invariant Check ──>
Version Increment ──> Snapshot Broadcast
```

- Every successful change increments the twin's global version count.
- Consumers are notified via `evt_context_assembled` events containing the updated state delta.
