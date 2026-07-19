# State Delta Model Specification

Defines logical delta structures separate from the target world state.

---

## 1. Delta Definitions

A Delta represents the discrete transaction of change, rather than the absolute state:

- **PropertyDelta**: Defines target property modifications (e.g., `previous_location` $
ightarrow$ `current_location`).
- **RelationshipDelta**: Defines changes in semantic links (e.g., `assigned_to` links or task allocations).
