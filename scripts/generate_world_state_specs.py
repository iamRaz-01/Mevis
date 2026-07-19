import os

WORLD_STATE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../world-state"))
os.makedirs(WORLD_STATE_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(WORLD_STATE_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. world-state-schema.md
write_file("world-state-schema.md", """
# World State Schema Specification

This document defines the canonical structure of the live **operational world state**.

---

## 1. Operational State Fields

Every operational entity tracked in the Digital Twin MUST expose the following state header properties:
*   `id` (String): Prefix-compliant identifier.
*   `location` (String): Spatial containment zone pointer.
*   `status` (String): Mapped lifecycle status.
*   `confidence` (Float): Real-time calculated trust value.
*   `timestamp` (ISO-8601): Event effective timestamp.
*   `version` (Integer): Incremental revision index.
""")

# 2. snapshot-model.md
write_file("snapshot-model.md", """
# Snapshot Classification Model

Defines representations of the entire operational world state at a specific moment.

---

## 1. Snapshot Classifications

*   **Full Snapshot**: Complete serialized state of all entities, resources, and connections at time $T$. Used for bootstrapping reasoning engines.
*   **Incremental Snapshot**: Compiles only state delta changes between version $V$ and version $V_n$.
*   **Recovery Snapshot**: Cached stable state used to recover from sensor timeouts or policy conflicts.
*   **Historical Snapshot**: Retrospective snapshot used for auditing and analytics KPI scoring.
*   **Simulation Snapshot**: Modified state injects simulated weather or crowd anomalies for planner stress testing.
""")

# 3. update-model.md
write_file("update-model.md", """
# State Update Model Specification

Defines merge, replacement, and partial modification rules for World State delta increments.

---

## 1. Update Ingestion Rules

*   **Unit Updates**: Updates targeting a single entity (e.g. Volunteer GPS change) modify only that entity block; the rest of the world remains unchanged.
*   **Partial Updates**: Observations containing incomplete fields (e.g., Volunteer battery level update only) do not overwrite spatial or assignment parameters.
*   **LWW (Last-Write-Wins) Merge**: If duplicate updates target the same property, the telemetry item with the newer event timestamp MUST overwrite the older state.
""")

# 4. delta-model.md
write_file("delta-model.md", """
# State Delta Model Specification

Defines logical delta structures separate from the target world state.

---

## 1. Delta Definitions

A Delta represents the discrete transaction of change, rather than the absolute state:
*   **PropertyDelta**: Defines target property modifications (e.g., `previous_location` $\rightarrow$ `current_location`).
*   **RelationshipDelta**: Defines changes in semantic links (e.g., `assigned_to` links or task allocations).
""")

# 5. observation-lineage.md
write_file("observation-lineage.md", """
# Observation Lineage Specification

Defines logical lineage tracking from raw telemetry inputs to state changes.

---

## 1. Lineage Chain

Every state update version MUST compile and log the following immutable lineage mapping:

```text
[Observation Ingress] ──> [Schema Validation] ──> [Delta Extraction] ──>
[World State mutation] ──> [Version Increment]
```

This guarantees complete auditable transparency.
""")

# 6. synchronization.md
write_file("synchronization.md", """
# State Synchronization Specification

Defines synchronization lifecycles and ordering rules for incoming updates.

---

## 1. Synchronization Lifecycle

Every update transaction moves through the following synchronization states:
*   `Unsynchronized`: Observation ingested, validation pending.
*   `Pending`: Invariant check executing.
*   `Synchronizing`: Delta mutation merging.
*   `Current`: Propagated successfully to active World State.
*   `Stale`: Validation age exceeded, pending telemetry refresh.
*   `Expired`: Removed from active context window.
""")

# 7. freshness-model.md
write_file("freshness-model.md", """
# State Freshness Specification

Defines validity periods and decay metrics to prevent stale operational reasoning.

---

## 1. Freshness Policy Registry

The World State Engine MUST expire or flag states based on target parameters:
*   **Volunteer GPS**: 30 seconds validity.
*   **Crowd Density Telemetry**: 10 seconds validity.
*   **Meteorological Weather Feed**: 5 minutes validity.
*   **Active Medical Incidents**: Retained indefinitely until manually closed by Supervisor.
""")

# 8. state-transition-model.md
write_file("state-transition-model.md", """
# Live State Transition Specification

Defines live operational transition states, triggers, and lock rules.

---

## 1. Transition Lock States

To resolve simultaneous updates, transitions compile locking indicators:
*   `Pending`: Transition request submitted, locking target entity.
*   `Applied`: Mutation successful, lock released.
*   `Rejected`: Invariant validation failed, transaction rejected.
*   `Superseded`: Newer timestamp transaction arrived before completion; older update is dismissed.
""")

# 9. versioning.md
write_file("versioning.md", """
# State Versioning Specification

Defines logical version identifier chains, lineage tracking, and rollback concepts.

---

## 1. Lineage Identifiers
*   Global state version index (monotonically increasing integer).
*   Delta cryptographic signatures linking back to parent versions.
*   Rollback queries restore previous version state variables in case of policy conflicts.
""")

# 10. state-quality-model.md
write_file("state-quality-model.md", """
# State Quality & Health Model

Defines measurable health metrics for the Digital Twin state.

---

## 1. Health indicators

*   **Coverage**: Ratio of reporting telemetry sensors to target installations.
*   **Freshness**: Mean age of active spatial coordinates.
*   **Latency**: milliseconds from observation ingress to active version release (target: $< 200$ms).
*   **Confidence**: Weighted mean of all active entity confidence values.
*   **Missing Data**: Count of null or expired state properties.
*   **Conflict Count**: Number of unresolved active contradictions.
""")

# 11. consistency-model.md
write_file("consistency-model.md", """
# State Consistency Model

Defines rules to resolve logical contradictions inside the World State Engine.

---

## 1. Consistency Resolution Rules

*   **Duplicate Location Conflicts**: If a volunteer is reported in two zones at once, the engine MUST apply Trust Score Precedence (CCTV verification > GPS ping) or retain only the newer timestamp location.
*   **Orphan Task Assignments**: A task assigned to a non-existent volunteer or closed incident MUST transition to `UNASSIGNED` status and raise a supervisor alert.
""")

print("Successfully generated all 11 world state specs.")
