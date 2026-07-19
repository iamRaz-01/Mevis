# Entity Resolution Specification

Matches telemetry observation entities to valid World Model registry IDs.

---

## 1. Resolution Rules

- **ID Mapping**: String references like "Steward John B12" resolve to `vol_steward_104`.
- **Ambiguity Resolution**: If matching is ambiguous, the resolver MUST defer to spatial proximity or report a resolution error.
