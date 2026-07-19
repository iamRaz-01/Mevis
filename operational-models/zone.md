# Zone Operational Model Specification

Defines the behavioral representation of the Zone operational actor.

---

## 1. Zone States & Visibility

- `Standard`: Standard operations, occupancy below capacity limits.
- `Congested`: Occupancy exceeds capacity threshold, triggers route redirections.
- `Blocked`: Blocked pathways, triggers bypass route calculations.
