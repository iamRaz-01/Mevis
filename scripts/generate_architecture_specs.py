import os

ARCH_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../architecture/domain"))
GOV_DIR = os.path.join(ARCH_DIR, "governance")
SPEC_DIR = os.path.join(ARCH_DIR, "context-specifications")

os.makedirs(ARCH_DIR, exist_ok=True)
os.makedirs(GOV_DIR, exist_ok=True)
os.makedirs(SPEC_DIR, exist_ok=True)

def write_file(base_dir, filename, content):
    filepath = os.path.join(base_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {os.path.basename(filepath)}")

# 1. Architecture Principles
write_file(ARCH_DIR, "architecture-principles.md", """
# MEVIS Domain Architecture Principles

This document defines the core guidelines governing the logical architecture of the MEVIS platform.

---

## 1. Architectural Principles

### 1.1 Domain-Driven Design (DDD)
*   **Definition**: The software partition model MUST reflect the real operational business contexts of mega-event operations.
*   **Rule**: Bounded contexts MUST encapsulate their business language and entities to prevent model bleeding.

### 1.2 AI-First Design Principles
*   **Definition**: Architectural metadata MUST be structured programmatically so that autonomous AI coding agents can discover ownership, rules, and boundaries without human guidance.
*   **Rule**: Bounded context directories expose `routing metadata` schemas defining owned scopes.

### 1.3 Event-First Communication
*   **Definition**: Contexts SHOULD integrate primarily via asynchronous, immutable Domain Events rather than synchronous RPC calls to decouple systems.

### 1.4 Single Ownership Principle
*   **Definition**: Every entity, event, policy, and rule has exactly one bounded context owner.

### 1.5 Loose Coupling & High Cohesion
*   **Definition**: Inter-context communication occurs only through public contracts and anti-corruption translation layers.
""")

# 2. Capability Map
write_file(ARCH_DIR, "capability-map.md", """
# MEVIS Business Capability Mapping

This document maps business capabilities to bounded contexts and defines the RACI matrix for all operations.

---

## 1. Bounded Context RACI Matrix

| Capability / Task | Volunteer Mgmt | Incident Mgmt | Decision Intel | Recommendation | Notification | Analytics |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Manage Volunteer Shifts** | R / A | I | C | I | I | C |
| **Ingest Observation** | C | R / A | C | I | I | I |
| **Triage & Triage Escalation** | I | R / A | C | I | I | C |
| **Generate Recommendation** | I | C | R / A | R | I | I |
| **Validate Safety Policies** | I | I | C | R / A | I | I |
| **Broadcast Alerts** | I | I | I | C | R / A | I |
| **Compute Operations KPIs** | I | I | I | I | I | R / A |

*   **R**: Responsible, **A**: Accountable, **C**: Consulted, **I**: Informed.
""")

# 3. Bounded Contexts overview
write_file(ARCH_DIR, "bounded-contexts.md", """
# Bounded Context Registry & Decision Records

This document catalogs the 10 canonical bounded contexts of the MEVIS platform.

---

## 1. The Bounded Context Registry

1.  **Volunteer Management**: Manages volunteers, rosters, active shifts, presence tracking, and check-in.
2.  **Incident Management**: Triages, assesses, dispatches, and tracks incident lifecycles.
3.  **Knowledge Management**: Indexes SOP manuals, provides evidence context hits.
4.  **Context Intelligence**: Assembles live situational snapshots.
5.  **Decision Intelligence**: Evaluates hypotheses, risk scores, and reasons.
6.  **Recommendation Engine**: Formats, prioritizes, and compiles recommendations.
7.  **Notification**: Handles alert deliveries (SMS, push, email).
8.  **Authentication**: Manages user credentials, permissions, and security sessions.
9.  **Analytics**: Tracks long-term KPIs, historical reports, and dashboards.
10. **Administration**: Configures venue maps, gates, schedules, and permissions.

---

## 2. Context Partition Decision Records (CDR)

### CDR-001: Separation of Recommendation Engine from Decision Intelligence
*   **Decision**: Separate recommendation formatting and dispatch from reasoning logic.
*   **Justification**: Separation allows multiple reasoning engines (e.g. LLMs, rules engine fallbacks) to reuse a single recommendation delivery contract.
""")

# 4. Context Map
write_file(ARCH_DIR, "context-map.md", """
# MEVIS Bounded Context Map

This document defines upstream/downstream dependencies and ACL patterns across MEVIS.

---

## 1. Upstream/Downstream Context Mappings

*   **Volunteer Management (Upstream)** $\rightarrow$ **Context Intelligence (Downstream)** [Customer-Supplier]
*   **Incident Management (Upstream)** $\rightarrow$ **Context Intelligence (Downstream)** [Customer-Supplier]
*   **Context Intelligence (Upstream)** $\rightarrow$ **Decision Intelligence (Downstream)** [Published Language]
*   **Knowledge Management (Upstream)** $\rightarrow$ **Decision Intelligence (Downstream)** [Shared Kernel]
*   **Decision Intelligence (Upstream)** $\rightarrow$ **Recommendation Engine (Downstream)** [Customer-Supplier]
*   **Recommendation Engine (Upstream)** $\rightarrow$ **Notification (Downstream)** [Customer-Supplier]
*   **Volunteer Management (Upstream)** $\rightarrow$ **Analytics (Downstream)** [Anti-Corruption Layer]
""")

# 5. Ownership Matrix
write_file(ARCH_DIR, "ownership-matrix.md", """
# MEVIS Authoritative Ownership Registry

This matrix lists the single bounded context owner for each entity, event, and policy.

---

## 1. Entity and Event Ownership Matrix

| Bounded Context | Owned Entities | Owned Events | Owned Decisions / Policies |
| :--- | :--- | :--- | :--- |
| **Volunteer Mgmt** | `Volunteer`, `Shift` | `evt_volunteer_checked_in` | `dec_shift_checkin` |
| **Incident Mgmt** | `Incident`, `Task`, `Observation` | `evt_incident_detected` | `dec_incident_triaged` |
| **Knowledge Mgmt** | `SOP`, `Evidence` | None | None |
| **Context Intel** | `Context` | `evt_context_assembled` | None |
| **Decision Intel** | `Decision` | `evt_policy_validation_started` | `pol_safety_sop_lock` |
| **Recommendation** | `Recommendation`, `Approval` | `evt_recommendation_released` | `dec_rec_approval` |
| **Notification** | `Notification` | `evt_alert_delivered` | None |
""")

# 6. Communication Matrix
write_file(ARCH_DIR, "communication-matrix.md", """
# MEVIS Communication Matrix

Defines integration patterns and communication contracts between bounded contexts.

---

## 1. Context Integration Patterns

| Source Context | Target Context | Integration Pattern | Trigger | Contract Schema |
| :--- | :--- | :---: | :--- | :--- |
| **Incident Mgmt** | **Context Intel** | Domain Event | `evt_incident_detected` | `event-schema.json` |
| **Context Intel** | **Decision Intel** | Command | Context assembled | `decision-contract.yaml` |
| **Knowledge Mgmt** | **Decision Intel** | Query | Retrieve RAG SOP facts | `policy-contract.md` |
| **Recommendation** | **Notification** | Command | Publish recommendation | `metadata-schema.json` |
| **Volunteer Mgmt** | **Analytics** | Query (ACL) | Retrieve aggregate shift logs | `volunteer-analytics-acl.yaml` |
""")

# 7. Integration Rules
write_file(ARCH_DIR, "integration-rules.md", """
# MEVIS Integration Rules

Defines the allowed vs. forbidden communication rules to protect the architecture from erosion.

---

## 1. Allowed Communications
*   **Incident Management** $\rightarrow$ **Context Intelligence** (Publish state change events).
*   **Decision Intelligence** $\rightarrow$ **Recommendation Engine** (Send validated decisions).
*   **Recommendation Engine** $\rightarrow$ **Notification** (Command to send alerts).

## 2. Forbidden Communications
*   **Analytics** $\rightarrow$ **Volunteer Management** (Analytics MUST NOT write/modify volunteer profiles).
*   **Notification** $\rightarrow$ **Incident Management** (Notifications MUST NOT change incident state directly).
*   **Authentication** $\rightarrow$ **Decision Intelligence** (Authentication context MUST remain decoupled from operational reasoning).
""")

# 8. Shared Kernel
write_file(ARCH_DIR, "shared-kernel.md", """
# MEVIS Shared Kernel Specification

This document defines the core concepts shared across all contexts.

---

## 1. Shared Kernel Core Fields

The following entities and fields are shared as published language:
*   `venue_id`: Static stadium reference.
*   `user_id`: Cross-context identity reference.
*   `timestamp`: Universal ISO-8601 timeline parameter.

These fields are immutable and MUST use identical formats in all context API schemas.
""")

# 9. Governance files
write_file(GOV_DIR, "fitness-rules.md", """
# MEVIS Architectural Fitness Rules

This specification establishes rules to assert modular integrity in the repository.

---

## 1. Fitness Rules

1.  **Acyclic Dependency Rule**: No circular dependency loops (Context A $\rightarrow$ Context B $\rightarrow$ Context A) are allowed.
2.  **Encapsulation Rule**: Contexts MUST hide internal database schemas; external queries MUST go through ACL or contract interfaces.
3.  **Stability Rule**: Changing a public contract requires minor version increments.
""")

write_file(GOV_DIR, "validation-rules.md", """
# MEVIS Context Validation Rules

Enforces boundary controls on pull requests and code generation.

---

## 1. Validation Rules

*   Every newly created entity MUST be registered in the `ownership-matrix.md`.
*   Any API contract modification MUST update the corresponding `anti-corruption-layers/` schema mapping.
""")

write_file(GOV_DIR, "decision-traceability.md", """
# MEVIS Architectural Decision Traceability

Maps contexts back to business capabilities, ADR decisions, and ontology schemas.

---

## 1. Traceability Registry

*   **Context**: Decision Intelligence
    *   *Capability*: Operational Decision Support.
    *   *Related ADR*: `ADR-007` (Policy Gate Engine).
    *   *Ontology Schema*: `decision.schema.json`.
""")

# 10. Context specifications
contexts = [
    ("volunteer-management", "Volunteer Profiles & Shift Rosters", "Volunteer, Shift", "evt_volunteer_checked_in"),
    ("incident-management", "Incident Triage & Task Dispatching", "Incident, Task, Observation", "evt_incident_detected"),
    ("knowledge-management", "SOP Document Indexes & Citations", "SOP, Evidence", "None"),
    ("context-intelligence", "Live Situation Snapshot compilation", "Context", "evt_context_assembled"),
    ("decision-intelligence", "Logical reasoning & Risk Assessment", "Decision", "evt_policy_validation_started"),
    ("recommendation-engine", "Recommendation delivery & formatting", "Recommendation, Approval", "evt_recommendation_released"),
    ("notification", "Alert SMS and push broadcast dispatches", "Notification", "evt_alert_delivered"),
    ("authentication", "User access controls & sessions", "User", "evt_user_authenticated"),
    ("analytics", "Long-term KPI reporting & outcome audit", "AnalyticsReport", "None"),
    ("administration", "Stadium master map configuration", "Venue, Zone, Gate", "None")
]

for name, desc, entities, events in contexts:
    write_file(SPEC_DIR, f"{name}.md", f"""
# Context Specification — {name.replace('-', ' ').title()}

This document defines the canonical specification for the {name.replace('-', ' ').title()} Bounded Context.

---

## 1. Business Capability
Solves: {desc}.

## 2. Ubiquitous Language Mappings
*   Context Owner: Operations Group.
*   Authoritative terms: {entities}.

## 3. Responsibilities
*   Encapsulates state changes and validations for owned entities.
*   Enforces domain validation limits.

## 4. Owned Entities
*   {entities}

## 5. Owned Events
*   {events}

## 6. Owned Policies
*   `pol_{name.replace('-', '_')}_default_rules`

## 7. Public Commands
*   `cmd_{name.replace('-', '_')}_action`

## 8. Public Queries
*   `qry_{name.replace('-', '_')}_data`

## 9. Published Events
*   {events}

## 10. Consumed Events
*   None

## 11. Integration Rules
*   MUST use Anti-Corruption Layer when exposing internal models.

## 12. Dependencies
*   Required upstream contexts: None.

## 13. Forbidden Responsibilities
*   MUST NOT update entities owned by other contexts directly.

## 14. Non-Goals
*   Does not handle technical connection issues or presentation.

## 15. Future Evolution
*   Maturity: Supporting. Extraction: Eligible if load increases.
""")

print("Generated all 21 domain architecture files.")
