# Context Model Specification

This specification defines the canonical structure of a **Context Object** in the MEVIS platform.

---

## 1. Context Object Structure

A Context Object represents the minimal subset of operational parameters required for one reasoning decision. Every Context Object MUST contain:

- `context_id` (String): Prefix-compliant context ID.
- `context_type` (String): Categorized context scope classification.
- `decision_scope` (String): The target reasoning task (e.g. Incident dispatch).
- `lifetime` (Integer): Time-to-live in seconds.
- `entities` (Array): Valid entities linked from the World State.
- `confidence` (Float): Composite probability score [0.0, 1.0].
- `freshness` (Float): Calculated average age metric.
