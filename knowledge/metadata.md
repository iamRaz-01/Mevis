# Knowledge Metadata Specification

Defines standardized fields for metadata indexing.

---

## 1. Required Metadata Attributes

Every asset payload MUST include:

- `asset_id`: String prefix matching domain boundaries.
- `title`: Human readable title.
- `domain`: Bounded context label (Medical, Security, Volunteer).
- `version`: SemVer string.
- `owner_id`: Responsible steward identifier.
