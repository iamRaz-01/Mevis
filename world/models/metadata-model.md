# Metadata Model Specification

Defines the universal metadata properties shared by all objects in the Digital Twin.

---

## 1. Universal Metadata Payload

Every entity state object MUST contain the following metadata header properties:

- `created_at` (ISO-8601): Database ingestion time.
- `updated_at` (ISO-8601): Last update processing time.
- `confidence` (Float): Calculated trust rating of active state.
- `source` (String): Source identifier feed.
- `version` (Integer): Monotonically increasing revision count.
