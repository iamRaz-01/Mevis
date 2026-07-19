# State Versioning Specification

Defines logical version identifier chains, lineage tracking, and rollback concepts.

---

## 1. Lineage Identifiers

- Global state version index (monotonically increasing integer).
- Delta cryptographic signatures linking back to parent versions.
- Rollback queries restore previous version state variables in case of policy conflicts.
