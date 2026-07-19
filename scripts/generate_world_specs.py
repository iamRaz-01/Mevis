import os

WORLD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../world"))
CORE_DIR = os.path.join(WORLD_DIR, "core")
MODELS_DIR = os.path.join(WORLD_DIR, "models")

os.makedirs(CORE_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def write_file(base_dir, filename, content):
    filepath = os.path.join(base_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {os.path.basename(filepath)}")

# 1. digital-twin.md
write_file(CORE_DIR, "digital-twin.md", """
# Digital Twin Architecture Specification

This document defines the conceptual architecture of the MEVIS stadium **Digital Twin**.

---

## 1. Physical vs. Digital Synchronization

The Digital Twin is the authoritative in-memory representation of physical reality at Lusail Stadium.

*   **Ingestion Feed**: Incoming observation events update the active state variables.
*   **State Alignment**: Delays MUST remain under 5 seconds to support time-critical safety dispatches.
*   **Decoupled Consumers**: Downstream planner and risk assessor AI agents read only from the Digital Twin, not from raw telemetry pings.
""")

# 2. world-model.md
write_file(CORE_DIR, "world-model.md", """
# World Model Specification

Defines the semantic structure of all operational entities in the MEVIS stadium.

---

## 1. Core Stadium Classes

*   **Venue**: lusail_stadium mapping coordinates and capacities.
*   **Zone**: Seating sectors, exit pathways, and gates.
*   **Volunteer**: checked-in shifts, roles, and GPS markers.
*   **Incident**: triaged observations, safety threats, and paramedic dispatches.
*   **Resource**: Available vehicles, shuttle buses, first-aid medical kits.
""")

# 3. world-boundaries.md
write_file(CORE_DIR, "world-boundaries.md", """
# Digital Twin Boundaries Specification

Defines what data is inside vs. outside the responsibility of the MEVIS Digital Twin.

---

## 1. Boundary Registry

### 1.1 Inside the Digital Twin
*   ✔ Live active volunteer coordinates.
*   ✔ Current triaged operational incidents.
*   ✔ Live gate access control lock states.
*   ✔ Active medical kit locations.
*   ✔ Live stadium weather observations.

### 1.2 Outside the Digital Twin
*   ✖ Ticket sales transactions (managed by Ticketing Context).
*   ✖ Long-term payroll/HR data (managed by HR database).
*   ✖ Multi-terabyte CCTV raw video storage files.
*   ✖ Off-site municipal road traffic reports.
""")

# 4. world-assumptions.md
write_file(CORE_DIR, "world-assumptions.md", """
# Digital Twin Assumptions Specification

Documented operational assumptions governing world state alignment.

---

## 1. Core Assumptions

1.  **GPS Latency Limit**: GPS telemetry from volunteer mobile devices MUST arrive within 5 seconds.
2.  **Physical Exclusivity**: A volunteer cannot physically occupy two zones simultaneously.
3.  **Unique Containment**: A gate belongs to exactly one zone.
4.  **Single Resource Ownership**: Physical equipment (e.g., Medical Kit B3) has a single current owner or station at any time $T$.
""")

# 5. change-model.md
write_file(CORE_DIR, "change-model.md", """
# Digital Twin State Change Model

Defines the cycle of state mutations in the Digital Twin.

---

## 1. State Update Sequence

```text
Telemetry Observation Ingestion ──> Schema Validation ──>
Delta State computation ──> Invariant Check ──>
Version Increment ──> Snapshot Broadcast
```

*   Every successful change increments the twin's global version count.
*   Consumers are notified via `evt_context_assembled` events containing the updated state delta.
""")

# 6. spatial-model.md
write_file(MODELS_DIR, "spatial-model.md", """
# Spatial Hierarchy Specification

Defines physical space and navigation layouts within the stadium.

---

## 1. Spatial Tree

```text
Venue (Lusail Stadium)
    └── Stadium Sector (North, East, West, South)
          ├── Zone (Concourse Block B)
          │     ├── Gate (Entry Gate B12)
          │     └── Pathway (Exit Corridor 4)
          └── Medical Station (First Aid North Tunnel)
```

## 2. Navigational Adjacency
Every zone specifies adjacency mapping lists to compute routing pathways for volunteers.
""")

# 7. temporal-model.md
write_file(MODELS_DIR, "temporal-model.md", """
# Temporal Model Specification

Defines time metrics and snapshot validation formats in the Digital Twin.

---

## 1. Temporal Parameters

*   **Observation Time**: Timestamp when the physical sensor triggered.
*   **State Effective Time**: Timestamp when the twin processed the change delta.
*   **Valid Until**: Estimated duration of state freshness before expiration (default: 30 seconds for volunteer GPS).
*   **Historical Snapshot**: Retrievable version records for audit log inspections.
""")

# 8. resource-model.md
write_file(MODELS_DIR, "resource-model.md", """
# Resource Classification Model

Defines operational resource categories and capability tracking schemas.

---

## 1. Resource Categories

### 1.1 Human Resources
Volunteers, supervisors, paramedics, security personnel.

### 1.2 Physical Resources
Medical kits, stretchers, safety barriers, crowd fences.

### 1.3 Infrastructure Resources
Elevators, turnstiles, locks, scanner devices, seating.

### 1.4 Knowledge Resources
SOP manuals, map layouts.

### 1.5 Communication Resources
Radio channels, mobile apps.

### 1.6 AI Resources
Reasoning engines, vector databases.
""")

# 9. relationship-model.md
write_file(MODELS_DIR, "relationship-model.md", """
# Semantic Relationship Model

Defines multi-directional structural and operational relationships.

---

## 1. Relationship Classifications

*   **Structural**: `Gate` belongs_to `Zone`.
*   **Spatial**: `Steward` located_in `North Concourse`.
*   **Operational**: `Volunteer` assigned_to `Task`.
*   **Temporal**: `Shift` starts_at `09:00:00`.
*   **Ownership**: `Medical Kit` owned_by `Station 2`.
*   **Communication**: `Steward App` connected_to `Console Channel`.
""")

# 10. identity-model.md
write_file(MODELS_DIR, "identity-model.md", """
# Identity Model Specification

Defines global, stable, and correlation ID prefix mappings across all platforms.

---

## 1. ID Prefix Mappings

*   **Venue**: `ven_[a-zA-Z0-9_-]+`
*   **Zone**: `zon_[a-zA-Z0-9_-]+`
*   **Gate**: `gat_[a-zA-Z0-9_-]+`
*   **Volunteer**: `vol_[a-zA-Z0-9_-]+`
*   **Incident**: `inc_[a-zA-Z0-9_-]+`
*   **Task**: `tsk_[a-zA-Z0-9_-]+`
*   **Recommendation**: `rec_[a-zA-Z0-9_-]+`
*   **SOP**: `sop_[a-zA-Z0-9_-]+`
""")

# 11. metadata-model.md
write_file(MODELS_DIR, "metadata-model.md", """
# Metadata Model Specification

Defines the universal metadata properties shared by all objects in the Digital Twin.

---

## 1. Universal Metadata Payload

Every entity state object MUST contain the following metadata header properties:
*   `created_at` (ISO-8601): Database ingestion time.
*   `updated_at` (ISO-8601): Last update processing time.
*   `confidence` (Float): Calculated trust rating of active state.
*   `source` (String): Source identifier feed.
*   `version` (Integer): Monotonically increasing revision count.
""")

# 12. world-viewpoints.md
write_file(MODELS_DIR, "world-viewpoints.md", """
# World Viewpoints Specification

Defines role-based viewport filters for the Digital Twin state.

---

## 1. Viewpoint Filter Rules

Different operators see tailored viewpoints of the same underlying Digital Twin:
*   **Volunteer View**: Active assigned tasks, navigation route, supervisor contact.
*   **Coordinator View**: Global stadium congestion heatmaps, safety alarms, resource allocations.
*   **Medical View**: Paramedic locations, triage medical incident vectors, ambulance access routes.
*   **Security View**: Door sensors status, security posts, containment zones.
""")

# 13. quality-rules.md
write_file(MODELS_DIR, "quality-rules.md", """
# Digital Twin Quality Rules

Defines the quality metrics used to audit Digital Twin integrity.

---

## 1. Quality Indicators

*   **Completeness**: Percentage of required telemetry nodes connected and reporting.
*   **Consistency**: Conflict check rate (must remain zero).
*   **Freshness**: Mean age of active volunteer coordinates (threshold: $< 15$ seconds).
*   **Accuracy**: Discrepancy rate between simulated and actual outcomes.
""")

print("Successfully generated all core and model specification documents.")
