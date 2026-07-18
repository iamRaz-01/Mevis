# MEVIS Domain Glossary and Ubiquitous Language

This document establishes the canonical vocabulary, operational terminology, domain rules, and naming standards for the MEVIS platform.

In accordance with the **[MEVIS Engineering Constitution (MEC)](../engineering/MEVIS%20Product%20Constitution.md)**, every software component, API model, database schema, AI prompt, developer check, and documentation file **MUST** use these terms consistently.

No two terms in this glossary shall have overlapping meanings. Using forbidden synonyms in code, specifications, or commits is strictly prohibited.

---

## 1. Ubiquitous Language Dictionary

| Term               | Meaning                                                                                                                                 | System Scope                             | Synonyms (Allowed)              | Forbidden Synonyms               | Owner            | Lifecycle States                                                                                                                                                                                  |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- | :------------------------------ | :------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Volunteer**      | A registered event assistant who performs assigned operations, monitors event spaces, reports observations, and executes tasks.         | Volunteer UI, scheduling, task execution | steward, assistant, helper      | coordinator, manager, supervisor | Coordinator      | `Registered` $\rightarrow$ `Active` (on Shift) $\rightarrow$ `CheckedOut` $\rightarrow$ `Suspended`                                                                                               |
| **Shift**          | A scheduled block of time during which a Volunteer or Supervisor is active at a designated Gate or Zone.                                | Scheduling, check-in, presence check     | duty, scheduled hours           | incident, task, route            | Coordinator      | `Scheduled` $\rightarrow$ `CheckedIn` $\rightarrow$ `Active` $\rightarrow$ `CheckedOut` $\rightarrow$ `Absent`                                                                                    |
| **Zone**           | A larger defined geographical partition of a Venue containing multiple Gates or Routes.                                                 | Spatial engine, incident grouping        | sector, wing, concourse         | venue, gate, state               | Venue Manager    | Static Configuration                                                                                                                                                                              |
| **Gate**           | A specific entry or exit portal within a Zone of a Venue where Volunteers are stationed to manage flow.                                 | Navigation, flow monitoring              | turnstile, entrypoint, exit     | zone, venue, door                | Venue Manager    | `Open` $\rightarrow$ `Restrictive` $\rightarrow$ `Closed`                                                                                                                                         |
| **Venue**          | The complete stadium, arena, or mega-event location containing Zones and Gates.                                                         | Global context, spatial models           | stadium, arena                  | zone, gate, city                 | Venue Manager    | `Offline` $\rightarrow$ `PreEvent` $\rightarrow$ `LiveEvent` $\rightarrow$ `PostEvent`                                                                                                            |
| **Incident**       | Any material operational disruption, safety risk, accessibility bottleneck, or medical emergency in the Venue.                          | Incident triage, state machine           | disruption, emergency, issue    | recommendation, event, action    | Coordinator      | `Detected` $\rightarrow$ `Assessed` $\rightarrow$ `RecommendationReady` $\rightarrow$ `HumanApproved` / `HumanRejected` $\rightarrow$ `Actioned` $\rightarrow$ `Resolved` $\rightarrow$ `Learned` |
| **Crowd**          | The collective group of event attendees or fans moving through Zones or Gates.                                                          | Flow analysis, safety control            | spectators, fans, crowd flow    | staff, volunteers                | Security Chief   | `Normal` $\rightarrow$ `Congested` $\rightarrow$ `Bottleneck` $\rightarrow$ `Critical`                                                                                                            |
| **Supervisor**     | An experienced operations manager who manages Volunteers in specific Zones, triages incidents, and approves safety-critical actions.    | Supervisor UI, incident triage           | lead steward, zone manager      | volunteer, coordinator           | Coordinator      | `Active` $\rightarrow$ `CheckedOut` $\rightarrow$ `Suspended`                                                                                                                                     |
| **Coordinator**    | The highest operations room coordinator who manages all Supervisors/Volunteers, handles global escalations, and overrides settings.     | Command Center UI, global settings       | dispatcher, command operator    | supervisor, volunteer            | Venue Management | `Active` $\rightarrow$ `Offline`                                                                                                                                                                  |
| **SOP**            | Standard Operating Procedure: a verified document detailing instructions, requirements, and steps to resolve a specific incident class. | Knowledge layer, RAG                     | procedure, manual, guide        | policy, recommendation           | Coordinator      | `Draft` $\rightarrow$ `Approved` $\rightarrow$ `Active` $\rightarrow$ `Archived`                                                                                                                  |
| **Recommendation** | A candidate action plan and rationale generated by the AI Orchestrator to assist in resolving an Incident.                              | AI Orchestrator, reasoning loop          | proposal, candidate plan        | command, order, decision, SOP    | AI Orchestrator  | `Draft` $\rightarrow$ `Validating` $\rightarrow$ `Ready` $\rightarrow$ `Released` $\rightarrow$ `Accepted` / `Rejected`                                                                           |
| **Context**        | The canonical context object containing current world state, incident data, user role, active policies, and retrieved RAG details.      | Context Engine, reasoning pipeline       | request context, context object | state, history, inputs           | Context Engine   | `Assembling` $\rightarrow$ `Assembled` $\rightarrow$ `Stale`                                                                                                                                      |
| **Event**          | A technical message representing a discrete state transition within the system.                                                         | Event bus, system integration            | domain event, system event      | incident, mega-event             | Event Bus        | `Published` $\rightarrow$ `Dispatched` $\rightarrow$ `Processed`                                                                                                                                  |
| **Decision**       | The final action choice committed by a human operator (Supervisor/Coordinator/Volunteer) in response to a Recommendation.               | Human-in-the-loop, audit log             | committed action, choice        | recommendation, event            | Human Operator   | `Pending` $\rightarrow$ `Committed` $\rightarrow$ `Recorded`                                                                                                                                      |
| **Observation**    | A single raw signal, sensor reading, or volunteer report entered into the system before assessment.                                     | Ingestion, world state engine            | alert, signal, raw report       | incident, decision               | Volunteer        | `Received` $\rightarrow$ `Assessed` $\rightarrow$ `Merged` / `Discarded`                                                                                                                          |
| **Evidence**       | Verified documents, factual relationships, or RAG outputs used by the AI to justify a Recommendation.                                   | Grounding layer, decision graph          | citation, fact                  | assumption, hypothesis           | Knowledge Layer  | `Ingested` $\rightarrow$ `Active` $\rightarrow$ `Deprecated`                                                                                                                                      |
| **Risk**           | The probability and operational/safety impact of potential negative outcomes from a candidate action.                                   | Risk Analysis, safety evaluation         | hazard, threat, cost            | incident, policy                 | Risk Agent       | `Evaluated` $\rightarrow$ `Recorded`                                                                                                                                                              |
| **Policy**         | An executable rule or constraint that defines whether a candidate action is allowed or requires escalation (e.g., Safety Policy).       | Policy Engine, Release Gate              | rule, constraint                | SOP, recommendation              | Coordinator      | `Active` $\rightarrow$ `Inactive`                                                                                                                                                                 |
| **Task**           | A discrete, actionable instruction assigned to a Volunteer or Supervisor to resolve an Incident.                                        | Action layer, assistant dashboard        | job, assigned todo              | incident, recommendation         | Volunteer        | `Assigned` $\rightarrow$ `Acknowledged` $\rightarrow$ `InProgress` $\rightarrow$ `Completed` / `Failed`                                                                                           |
| **Escalation**     | The action of raising an incident's priority level or routing it to a higher role due to SLA breaches or policy constraints.            | Incident triage, routing                 | referral, priority raise        | resolution, decline              | Policy Engine    | `Initiated` $\rightarrow$ `Acknowledged` $\rightarrow$ `Reassigned`                                                                                                                               |
| **Approval**       | The explicit human authorization required to release a safety-critical Recommendation or execute a restricted Task.                     | Trust Gate, Human-in-the-loop            | authorization, release consent  | request, suggestion              | Supervisor       | `Requested` $\rightarrow$ `Granted` / `Denied` $\rightarrow$ `Logged`                                                                                                                             |

---

## 2. Operational Terminology Standard

### 2.1 Incident Classifications

To avoid overlapping or arbitrary incident names, all incidents **MUST** be classified under one of the following standard classifications:

- `LOST_CHILD`: Incident involving missing minors or separated families.
- `MEDICAL_EMERGENCY`: Injury, acute illness, or cardiac arrest requiring first responders.
- `CROWD_SURGE`: Severe density accumulation at gates, stairs, or turnstiles.
- `GATE_CLOSURE`: Physical locking or operational restriction of entry/exit turnstiles.
- `SEVERE_WEATHER`: Weather alerts (lightning, high heat, storms) prompting local evacuation or shelter-in-place.
- `TRANSPORT_DISRUPTION`: Major shuttle, bus, or train delays affecting fan arrival/departure.
- `SECURITY_BREACH`: Unauthorized entry into restricted venue areas or suspicious package detection.
- `ACCESSIBILITY_BOTTLENECK`: Obstruction or malfunction of ramps, elevators, or dedicated seating.

### 2.2 Crowd Terminology

Crowd status values **MUST** map to the following metrics:

- `FLOW_RATE`: The number of people passing a gate per minute (people/min).
- `CROWD_DENSITY`: Crowd occupancy measured in people per square meter ($\text{p/m}^2$).
- `CONGESTION_LEVEL`: One of `LOW` ($< 1\text{ p/m}^2$), `MEDIUM` ($1\text{ to }2.5\text{ p/m}^2$), `HIGH` ($2.5\text{ to }4\text{ p/m}^2$), or `CRITICAL` ($> 4\text{ p/m}^2$).
- `BOTTLENECK`: A local geographical feature creating artificial congestion.

### 2.3 Medical Terminology

All medical incidents **MUST** utilize the standard **START Triage** color codes:

- `TRIAGE_MINOR` (Green): Minor injuries, walking wounded; requires basic first aid.
- `TRIAGE_DELAYED` (Yellow): Serious injuries, but breathing and circulation are stable; not immediate life threats.
- `TRIAGE_IMMEDIATE` (Red): Life-threatening airway, breathing, or circulatory emergency; requires immediate transport/AED.
- `TRIAGE_DECEASED` (Black): No pulse or respiration after airway opening; deceased.

### 2.4 Security Terminology

Security operations **MUST** use these designations:

- `INCIDENT_PERIMETER`: The physical radius isolated around an active incident.
- `SECURE_ACCESS_ZONE`: Restricted event operations spaces.
- `COMMAND_AUTHORITY`: The ultimate emergency command center (which MEVIS assists but never overrides).

### 2.5 Accessibility Terminology

Accessibility actions **MUST** reference:

- `ADA_COMPLIANCE`: Americans with Disabilities Act spatial standards.
- `ASSISTIVE_TRANSIT`: Wheelchair escorts and cart routes.
- `ELEVATOR_FAILURE` / `AUXILIARY_AID`: Standard classification terms for accessibility failures.

---

## 3. Domain Rules

The following business rules represent hard operational logic constraints. They **MUST** be programmatically enforced in the Policy Engine:

1.  **Evacuation Rule**: A Volunteer **MUST NOT** authorize or execute an evacuation. Evacuation commands **MUST** only be authorized by a Coordinator or a verified Command Authority.
2.  **Safety Invariant (Safety over Optimization)**: Any candidate Recommendation that violates a safety Policy **MUST** be blocked (`DENY`) from release. Optimization algorithms (e.g. queue reduction) **MUST NOT** override safety policies.
3.  **Human-in-the-Loop Constraint**: High-risk recommendations (e.g., executing a `GATE_CLOSURE` or directing a crowd re-routing) **MUST** require explicit human Approval (from a Supervisor or Coordinator) before being converted into a Task.
4.  **SLA Escalation Rule**: If a `MEDICAL_EMERGENCY` or `CROWD_SURGE` incident remains in the `Detected` or `Assessed` state without an assigned Volunteer or Supervisor for more than 3 minutes, the system **MUST** trigger an automatic Escalation to the Coordinator.
5.  **Evidence Grounding Rule**: Every recommendation released by the AI Orchestrator **MUST** reference at least one Evidence citation from an active SOP. High-risk recommendations **MUST** reference at least two independent Evidence items.

---

## 4. Code Naming Standards

To translate this glossary into clean codebase semantics, all entity database primary keys and code identifiers **MUST** use the following unique prefixes:

- Volunteer: `vol_` (e.g., `vol_88301`)
- Shift: `shf_` (e.g., `shf_9921`)
- Zone: `zon_` (e.g., `zon_north_concourse`)
- Gate: `gat_` (e.g., `gat_entry_04`)
- Venue: `ven_` (e.g., `ven_stadium_01`)
- Incident: `inc_` (e.g., `inc_2026_0904`)
- SOP: `sop_` (e.g., `sop_medical_triage`)
- Recommendation: `rec_` (e.g., `rec_99201`)
- Context: `ctx_` (e.g., `ctx_assembly_8820`)
- Event: `evt_` (e.g., `evt_incident_detected`)
- Decision: `dec_` (e.g., `dec_approval_104`)
- Observation: `obs_` (e.g., `obs_crowd_alert`)
- Evidence: `evd_` (e.g., `evd_sop_page_12`)
- Policy: `pol_` (e.g., `pol_evac_restriction`)
- Task: `tsk_` (e.g., `tsk_check_gate_04`)
- Approval: `app_` (e.g., `app_gate_lock`)
