# World State Schema Specification

This document defines the canonical structure of the live **operational world state**.

---

## 1. Operational State Fields

Every operational entity tracked in the Digital Twin MUST expose the following state header properties:

- `id` (String): Prefix-compliant identifier.
- `location` (String): Spatial containment zone pointer.
- `status` (String): Mapped lifecycle status.
- `confidence` (Float): Real-time calculated trust value.
- `timestamp` (ISO-8601): Event effective timestamp.
- `version` (Integer): Incremental revision index.
