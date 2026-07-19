# MEVIS Canonical Domain Ontology

This document defines the formal, canonical semantic model for the Mega Event Volunteer Intelligence System (MEVIS). It maps the real operational world of mega-event volunteer operations to help both human developers and autonomous AI coding agents maintain absolute alignment.

---

## 1. Entity Catalog

Every entity in MEVIS represents an operational element with identity, attributes, lifecycle, and strict constraints.

### 1.1 Volunteer (`vol_`)

- **Identity**: Unique prefix format `vol_` followed by an alphanumeric string (e.g., `vol_steward_104`).
- **Description**: A registered event assistant who performs assigned duties, monitors crowd flows, submits reports, and executes tasks.
- **Responsibilities**: Reports observations, executes assigned tasks, coordinates with local venue team, requests assistance.
- **Attributes**:
  - `id` (String, Required): Unique identifier.
  - `first_name` (String, Required): Given name.
  - `last_name` (String, Required): Surname.
  - `role_scope` (String, Required): Category, default `VOLUNTEER`.
  - `assigned_gate_id` (String, Optional): Reference to active Gate.
  - `language_preferences` (Array of Strings, Required): Languages spoken.
- **Lifecycle States**: `Registered` $\rightarrow$ `Active` (checked in for a Shift) $\rightarrow$ `CheckedOut` $\rightarrow$ `Suspended`.
- **Constraints**:
  - MUST be assigned to at most one active Shift.
  - MUST report to exactly one Supervisor during a Shift.
  - MUST be positioned in at most one Gate at a time.
- **Ownership**: Volunteer Management Context.

### 1.2 Supervisor (`sup_`)

- **Identity**: Unique prefix format `sup_` followed by an alphanumeric string (e.g., `sup_zone_north`).
- **Description**: An experienced zone operations leader who manages Volunteers, triages local incidents, and approves safety-critical actions.
- **Responsibilities**: Manages volunteer resource allocation, reviews local incidents, issues approvals, handles communication escalations.
- **Attributes**:
  - `id` (String, Required): Unique identifier.
  - `first_name` (String, Required): Given name.
  - `last_name` (String, Required): Surname.
  - `assigned_zone_id` (String, Required): The Zone this supervisor oversees.
- **Lifecycle States**: `Active` (on Shift) $\rightarrow$ `CheckedOut` $\rightarrow$ `Suspended`.
- **Constraints**:
  - MUST oversee exactly one Zone.
- **Ownership**: Volunteer Management Context.

### 1.3 Coordinator (`coo_`)

- **Identity**: Unique prefix format `coo_` followed by an alphanumeric string.
- **Description**: A senior operations command center dispatcher responsible for global stadium coordination and system administration.
- **Responsibilities**: Triages global incidents, overrides safety gates when authorized, allocates global venue resources.
- **Attributes**:
  - `id` (String, Required): Unique identifier.
  - `station_id` (String, Required): Command center physical desk ID.
- **Lifecycle States**: `Active` $\rightarrow$ `Offline`.
- **Constraints**:
  - Operates globally across the Venue; not constrained to single Zones.
- **Ownership**: Operations Command Context.

### 1.4 Venue (`ven_`)

- **Identity**: Unique prefix format `ven_` followed by lowercase string name (e.g., `ven_stadium_01`).
- **Description**: The physical stadium hosting the mega-event.
- **Responsibilities**: Coordinates physical boundary data, maps structural zones and egress gates.
- **Attributes**:
  - `id` (String, Required): Unique venue ID.
  - `name` (String, Required): Physical name (e.g., "Lusail Stadium").
  - `location` (String, Required): GPS coordinates or geographic address.
- **Lifecycle States**: `Offline` $\rightarrow$ `PreEvent` $\rightarrow$ `LiveEvent` $\rightarrow$ `PostEvent`.
- **Constraints**:
  - MUST contain at least one Zone.
- **Ownership**: World State Context.

### 1.5 Zone (`zon_`)

- **Identity**: Unique prefix format `zon_` followed by location name (e.g., `zon_north_concourse`).
- **Description**: A defined sector or area inside a Venue.
- **Responsibilities**: Groups gates, volunteer positioning, and incident telemetry.
- **Attributes**:
  - `id` (String, Required): Unique zone ID.
  - `venue_id` (String, Required): Parent Venue ID.
  - `name` (String, Required): Sector name.
- **Lifecycle States**: Static Configuration.
- **Constraints**:
  - MUST belong to exactly one Venue.
- **Ownership**: World State Context.

### 1.6 Gate (`gat_`)

- **Identity**: Unique prefix format `gat_` followed by identifier string (e.g., `gat_entry_04`).
- **Description**: A specific physical turnstile, gate, or ingress/egress point within a Zone.
- **Responsibilities**: Ingress control, flow counting, bottleneck reporting.
- **Attributes**:
  - `id` (String, Required): Unique gate ID.
  - `zone_id` (String, Required): Parent Zone ID.
  - `status` (String, Required): Operational mode.
- **Lifecycle States**: `Open` $\rightarrow$ `Restrictive` $\rightarrow$ `Closed`.
- **Constraints**:
  - MUST belong to exactly one Zone.
- **Ownership**: World State Context.

### 1.7 Incident (`inc_`)

- **Identity**: Unique prefix format `inc_` followed by date and sequence (e.g., `inc_2026_0904`).
- **Description**: A material operational disruption, safety risk, accessibility bottleneck, or medical emergency.
- **Responsibilities**: Tracks status machine, escalation flags, and assigned resources.
- **Attributes**:
  - `id` (String, Required): Unique incident ID.
  - `venue_id` (String, Required): Venue where incident occurs.
  - `zone_id` (String, Required): Specific Zone impacted.
  - `gate_id` (String, Optional): Specific Gate impacted.
  - `classification` (String, Required): Incident Type (`LOST_CHILD`, `MEDICAL_EMERGENCY`, etc.).
  - `severity` (String, Required): Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - `status` (String, Required): Lifecycle state.
- **Lifecycle States**: `Detected` $\rightarrow$ `Assessed` $\rightarrow$ `RecommendationReady` $\rightarrow$ `HumanApproved` / `HumanRejected` $\rightarrow$ `Actioned` $\rightarrow$ `Resolved` $\rightarrow$ `Learned`.
- **Constraints**:
  - MUST belong to exactly one Venue.
  - MUST be governed by at most one active SOP at a time.
- **Ownership**: Incident Management Context.

### 1.8 Shift (`shf_`)

- **Identity**: Unique prefix format `shf_` followed by sequence string.
- **Description**: A scheduled block of time defining active duty hours.
- **Responsibilities**: Binds volunteer availability and position mapping.
- **Attributes**:
  - `id` (String, Required): Unique shift ID.
  - `start_time` (ISO-8601 String, Required): Shift start.
  - `end_time` (ISO-8601 String, Required): Shift end.
- **Lifecycle States**: `Scheduled` $\rightarrow$ `CheckedIn` $\rightarrow$ `Active` $\rightarrow$ `CheckedOut` $\rightarrow$ `Absent`.
- **Constraints**:
  - Time window MUST be positive (end time > start time).
- **Ownership**: Volunteer Management Context.

### 1.9 Task (`tsk_`)

- **Identity**: Unique prefix format `tsk_` followed by sequence.
- **Description**: A discrete actionable instruction dispatched to resolve an Incident.
- **Responsibilities**: Execution tracing, completion status, volunteer routing.
- **Attributes**:
  - `id` (String, Required): Unique task ID.
  - `incident_id` (String, Required): Target incident.
  - `assigned_volunteer_id` (String, Required): Volunteer executing.
  - `description` (String, Required): Action instructions.
  - `status` (String, Required): Completion state.
- **Lifecycle States**: `Assigned` $\rightarrow$ `Acknowledged` $\rightarrow$ `InProgress` $\rightarrow$ `Completed` / `Failed`.
- **Constraints**:
  - MUST belong to exactly one active Shift.
- **Ownership**: Incident Management Context.

### 1.10 Recommendation (`rec_`)

- **Identity**: Unique prefix format `rec_` followed by sequence string.
- **Description**: Candidate action plan and rationale generated by the AI Orchestrator.
- **Responsibilities**: Grounding proof, alternative analysis, safety validation tracking.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `incident_id` (String, Required): Target incident.
  - `proposed_actions` (Array of Strings, Required): Candidate tasks.
  - `supporting_evidence_ids` (Array of Strings, Required): Grounding links.
  - `confidence_score` (Float, Required): Calibration indicator.
- **Lifecycle States**: `Draft` $\rightarrow$ `Validating` $\rightarrow$ `Ready` $\rightarrow$ `Released` $\rightarrow$ `Accepted` / `Rejected`.
- **Constraints**:
  - MUST reference at least one supporting Evidence ID.
  - Cannot exist without a corresponding Context ID.
- **Ownership**: AI Intelligence Context.

### 1.11 SOP (`sop_`)

- **Identity**: Unique prefix format `sop_` followed by alphanumeric code.
- **Description**: Standard Operating Procedure detailing manual resolution steps.
- **Responsibilities**: Source text reference, version checks, role constraints.
- **Attributes**:
  - `id` (String, Required): Unique SOP ID.
  - `title` (String, Required): Document title.
  - `version` (String, Required): Active version string.
- **Lifecycle States**: `Draft` $\rightarrow$ `Approved` $\rightarrow$ `Active` $\rightarrow$ `Archived`.
- **Constraints**:
  - Static reference model once active.
- **Ownership**: Knowledge Management Context.

### 1.12 Policy (`pol_`)

- **Identity**: Unique prefix format `pol_` followed by rule name.
- **Description**: Operational rule or safety constraint checked by the Policy Engine.
- **Responsibilities**: Evaluation criteria, enforcement actions (Block/Escalate).
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `name` (String, Required): Policy name (e.g. `pol_evacuation_restriction`).
  - `type` (String, Required): Classification, e.g., `SAFETY`.
- **Lifecycle States**: `Active` $\rightarrow$ `Inactive`.
- **Constraints**:
  - Safety type policies MUST fail-closed on service timeout.
- **Ownership**: Admin & Governance Context.

### 1.13 Evidence (`evd_`)

- **Identity**: Unique prefix format `evd_` followed by hash/identifier.
- **Description**: A verified document slice or fact used for grounding.
- **Responsibilities**: RAG citations, graph relationship facts.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `source_type` (String, Required): `SOP` or `RELATIONAL_FACT`.
  - `content` (String, Required): Grounding statement text.
- **Lifecycle States**: `Ingested` $\rightarrow$ `Active` $\rightarrow$ `Deprecated`.
- **Constraints**:
  - MUST be linked to a parent SOP or entity relation.
- **Ownership**: Knowledge Management Context.

### 1.14 Observation (`obs_`)

- **Identity**: Unique prefix format `obs_` followed by alphanumeric string.
- **Description**: A raw sensor signal, crowd metric, or volunteer incident report.
- **Responsibilities**: Telemetry gathering, situational raw input.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `source` (String, Required): `VOLUNTEER` or `SENSOR`.
  - `raw_content` (String, Required): Ingested message/metrics.
- **Lifecycle States**: `Received` $\rightarrow$ `Assessed` $\rightarrow$ `Merged` / `Discarded`.
- **Constraints**:
  - Provenance metadata (timestamp, device) MUST be populated.
- **Ownership**: World State Context.

### 1.15 Decision (`dec_`)

- **Identity**: Unique prefix format `dec_` followed by transaction id.
- **Description**: Human committed action selecting or overriding a Recommendation.
- **Responsibilities**: Operational logs, learning updates, audit tracking.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `operator_id` (String, Required): Actor committing (Volunteer/Supervisor/Coordinator).
  - `recommendation_id` (String, Required): Reference recommendation.
  - `action_taken` (String, Required): State committed (Approved/Rejected/Overridden).
- **Lifecycle States**: `Pending` $\rightarrow$ `Committed` $\rightarrow$ `Recorded`.
- **Constraints**:
  - MUST log reasons for overrides.
- **Ownership**: Analytics & Learning Context.

### 1.16 Context (`ctx_`)

- **Identity**: Unique prefix format `ctx_` followed by assembly hash.
- **Description**: Canonical context object assembled before reasoning logic runs.
- **Responsibilities**: Encapsulates active state, constraints, and RAG hits.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `timestamp` (ISO-8601, Required): Assembly timestamp.
  - `incident_id` (String, Required): Active incident.
- **Lifecycle States**: `Assembling` $\rightarrow$ `Assembled` $\rightarrow$ `Stale`.
- **Constraints**:
  - Missing mandatory state fields MUST trigger warning/downgrade.
- **Ownership**: Context Engine Context.

### 1.17 Event (`evt_`)

- **Identity**: Unique prefix format `evt_` followed by event sequence.
- **Description**: Immutable record of a state transition in the monorepo services.
- **Responsibilities**: Microservices notifications, telemetry streams.
- **Attributes**:
  - `id` (String, Required): Unique event ID.
  - `type` (String, Required): Event classification key (e.g. `evt_incident_detected`).
  - `payload` (Object, Required): JSON data.
- **Lifecycle States**: `Published` $\rightarrow$ `Dispatched` $\rightarrow$ `Processed`.
- **Constraints**:
  - Must be immutable.
- **Ownership**: Event Bus.

### 1.18 Approval (`app_`)

- **Identity**: Unique prefix format `app_` followed by code.
- **Description**: Explicit authorization from a Supervisor or Coordinator to release a restricted task.
- **Responsibilities**: Security authorization, Release Gate check.
- **Attributes**:
  - `id` (String, Required): Unique ID.
  - `supervisor_id` (String, Required): Approving authority.
  - `recommendation_id` (String, Required): Recommendation requiring approval.
- **Lifecycle States**: `Requested` $\rightarrow$ `Granted` / `Denied` $\rightarrow$ `Logged`.
- **Constraints**:
  - Evacuation recommendations require Coordinator approval.
- **Ownership**: Policy & Trust Context.

---

## 2. Relationship Catalog

The semantic connections between entities form the relational Knowledge Graph.

| Source Entity    | Relationship Type | Target Entity    | Cardinality | Semantic Meaning                   | Lifecycle Dependency            |
| :--------------- | :---------------: | :--------------- | :---------: | :--------------------------------- | :------------------------------ |
| `Volunteer`      |   `ASSIGNED_TO`   | `Shift`          |    $N:1$    | Volunteer active schedule block    | Bounded by Shift active hours   |
| `Volunteer`      |   `REPORTS_TO`    | `Supervisor`     |    $N:1$    | Escalation and approval line       | Active during overlapping shift |
| `Volunteer`      |  `POSITIONED_AT`  | `Gate`           |    $N:1$    | Active deployment portal           | Cleared on CheckOut             |
| `Supervisor`     |     `MANAGES`     | `Zone`           |    $1:1$    | Supervisor zone overview authority | Bounded by Shift active hours   |
| `Gate`           |   `LOCATED_IN`    | `Zone`           |    $N:1$    | Spatial containment check          | Static mapping                  |
| `Zone`           |   `BELONGS_TO`    | `Venue`          |    $N:1$    | Spatial containment check          | Static mapping                  |
| `Incident`       |    `OCCURS_AT`    | `Gate`           |  $N:0..1$   | Incident location anchor           | Bounded by Incident resolution  |
| `Incident`       |     `IMPACTS`     | `Zone`           |    $N:1$    | Spatial footprint check            | Bounded by Incident resolution  |
| `Incident`       |   `GOVERNED_BY`   | `SOP`            |    $N:1$    | Standard resolution procedure      | Static configuration mapping    |
| `Incident`       |   `RESOLVED_BY`   | `Task`           |    $1:N$    | Execution steps committed          | Bounded by Task completion      |
| `Task`           |   `EXECUTED_BY`   | `Volunteer`      |    $N:1$    | Volunteer assigned to task         | Bounded by Task completion      |
| `Observation`    |    `TRIGGERS`     | `Incident`       |    $N:1$    | Signal becomes incident            | Observation merged              |
| `Recommendation` |  `PROPOSED_FOR`   | `Incident`       |    $N:1$    | Decision support output            | Cleared on incident resolution  |
| `Recommendation` |   `REFERENCES`    | `Evidence`       |    $N:N$    | Grounding citations                | Static grounding                |
| `Recommendation` |  `VALIDATED_BY`   | `Policy`         |    $N:N$    | Hard policy validation gate        | Static ruleset checks           |
| `Approval`       |   `AUTHORIZES`    | `Recommendation` |    $N:1$    | Supervisor release consent         | Precedes Task creation          |
| `Decision`       |     `COMMITS`     | `Recommendation` |    $1:1$    | human commits recommendation       | Immutable log update            |

---

## 3. Domain Invariants

Domain invariants are logical rules that must remain true at all times:

1.  **Spatial Containment Invariant**: A Gate MUST belong to exactly one Zone, which MUST belong to exactly one Venue. No Gate can float between Zones.
2.  **Command Authority Evacuation Invariant**: A Volunteer cannot approve evacuation Tasks. Only Supervisors or Coordinators can issue Approvals for evacuation class Recommendations.
3.  **Human-in-the-Loop Release Invariant**: Safety-critical incidents (severity High/Critical) MUST NOT release Recommendations as Tasks automatically. They require an Approval entity logged by a human Supervisor.
4.  **AI Grounding Invariant**: A Recommendation cannot exist without at least one supporting Evidence reference pointing to a valid SOP.
5.  **Context Freshening Invariant**: A Context object assembled for AI reasoning MUST contain world-state telemetry with a freshness timestamp under 30 seconds.

---

## 4. Lifecycle State Machines

### 4.1 Incident Lifecycle State Machine

```text
[Detected]
   │
   ▼ (Assessment logic checks classification & severity)
[Assessed]
   │
   ▼ (AI Orchestrator compiles Context and generates Recommendation)
[RecommendationReady] ────┐
   │                      │
   ▼ (Supervisor Approves)▼ (Supervisor Rejects)
[HumanApproved]       [HumanRejected]
   │                      │
   ▼ (Tasks Dispatched)   ▼ (Re-evaluate Context)
[Actioned]            [Assessed]
   │
   ▼ (Tasks Completed)
[Resolved]
   │
   ▼ (Feedback log updated to memory)
[Learned]
```
