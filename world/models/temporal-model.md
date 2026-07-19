# Temporal Model Specification

Defines time metrics and snapshot validation formats in the Digital Twin.

---

## 1. Temporal Parameters

- **Observation Time**: Timestamp when the physical sensor triggered.
- **State Effective Time**: Timestamp when the twin processed the change delta.
- **Valid Until**: Estimated duration of state freshness before expiration (default: 30 seconds for volunteer GPS).
- **Historical Snapshot**: Retrievable version records for audit log inspections.
