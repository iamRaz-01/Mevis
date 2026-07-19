# Query Contracts Specification

Defines logical query contract messages for requesting context.

---

## 1. Context Query Schema Layout

Queries requesting context MUST specify:

- `requester_id`: Unique identifier of downstream component.
- `context_scope`: `Incident` | `Volunteer` | `Zone` | `Medical`.
- `target_id`: Associated entity identifier.
