# State Synchronization Specification

Defines synchronization lifecycles and ordering rules for incoming updates.

---

## 1. Synchronization Lifecycle

Every update transaction moves through the following synchronization states:

- `Unsynchronized`: Observation ingested, validation pending.
- `Pending`: Invariant check executing.
- `Synchronizing`: Delta mutation merging.
- `Current`: Propagated successfully to active World State.
- `Stale`: Validation age exceeded, pending telemetry refresh.
- `Expired`: Removed from active context window.
