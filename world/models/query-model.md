# Logical World Query Model

Defines how AI models and services extract context filters from the stadium Digital Twin.

---

## 1. Query Patterns

- **Spatial Queries**: Fetch all active resources within a distance $D$ of coordinates $(X, Y)$ or Zone $Z$.
- **Availability Queries**: Fetch all volunteers with state `Available` and role `Steward`.
- **Temporal Queries**: Fetch the historical snapshot of Zone North at time $T$.
