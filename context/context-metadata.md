# Context Metadata Specification

Outlines universal properties shared by all Context Objects.

---

## 1. Metadata Schema Headers

Every context payload MUST contain the following header metadata properties:

- `context_id` (String): Unique identifier.
- `version` (Integer): Incremental version number.
- `created_time` (ISO-8601): Time of creation.
- `updated_time` (ISO-8601): Time of last refresh modification.
- `source_count` (Integer): Number of contributing telemetry sources.
- `evidence_count` (Integer): Number of verified policy attachments.
