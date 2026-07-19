# Snapshot Classification Model

Defines representations of the entire operational world state at a specific moment.

---

## 1. Snapshot Classifications

- **Full Snapshot**: Complete serialized state of all entities, resources, and connections at time $T$. Used for bootstrapping reasoning engines.
- **Incremental Snapshot**: Compiles only state delta changes between version $V$ and version $V_n$.
- **Recovery Snapshot**: Cached stable state used to recover from sensor timeouts or policy conflicts.
- **Historical Snapshot**: Retrospective snapshot used for auditing and analytics KPI scoring.
- **Simulation Snapshot**: Modified state injects simulated weather or crowd anomalies for planner stress testing.
