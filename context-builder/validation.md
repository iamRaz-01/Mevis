# Context Validation Specification

Runs final invariant verification tests before broadcasting context payloads.

---

## 1. Pipeline Invariants

A compiled context MUST be rejected if:

- It lacks policy mappings for High severity incidents.
- Freshness scores of Critical telemetry exceed 40 seconds.
