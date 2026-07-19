import os

CONTEXT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../context"))
os.makedirs(CONTEXT_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(CONTEXT_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. context-model.md
write_file("context-model.md", """
# Context Model Specification

This specification defines the canonical structure of a **Context Object** in the MEVIS platform.

---

## 1. Context Object Structure

A Context Object represents the minimal subset of operational parameters required for one reasoning decision. Every Context Object MUST contain:
*   `context_id` (String): Prefix-compliant context ID.
*   `context_type` (String): Categorized context scope classification.
*   `decision_scope` (String): The target reasoning task (e.g. Incident dispatch).
*   `lifetime` (Integer): Time-to-live in seconds.
*   `entities` (Array): Valid entities linked from the World State.
*   `confidence` (Float): Composite probability score [0.0, 1.0].
*   `freshness` (Float): Calculated average age metric.
""")

# 2. context-taxonomy.md
write_file("context-taxonomy.md", """
# Context Taxonomy Specification

Classifies every category of context object that can exist within the MEVIS cognitive architecture.

---

## 1. Taxonomy Classes

*   **Operational Context**: Live tracking information about active volunteers, shift layouts, and current locations.
*   **Incident Context**: Localized details regarding a specific reported incident.
*   **Medical Context**: Scope parameters outlining first aid supplies, responder availability, and transport routes.
*   **Emergency Context**: High-urgency context compiling severe weather alerts, evacuation gates, and perimeter alarms.
""")

# 3. context-hierarchy.md
write_file("context-hierarchy.md", """
# Context Hierarchy Specification

Defines containment, inheritance, and parent-child aggregation rules for Context scopes.

---

## 1. Containment Chain

Context inherits rules hierarchically from parent contexts:

```text
Global Context
   └── Venue Context (Stadium)
         └── Zone Context (Concourse North)
               └── Incident Context (Local Incident #204)
                     └── Volunteer Context (Assigned Responder)
```

## 2. Inheritance Rules
*   Child contexts MUST inherit constraints from parent levels (e.g. Venue evacuation plans override Zone task assignments).
*   Aggregation MUST remain acyclic; child nodes cannot act as parents of superior nodes.
""")

# 4. context-composition.md
write_file("context-composition.md", """
# Context Composition Specification

Defines how Context Objects are assembled from World State, Knowledge, Policies, and Constraints.

---

## 1. Logical Composition Formula

Context is composed via logical filters:
\[ \text{Context} = \text{Filter}(\text{World State}) \cup \text{Retrieve}(\text{Knowledge Base}) \cup \text{Map}(\text{Operational Policies}) \]

## 2. Inclusion & Exclusion Rules
*   **Inclusion**: Include only entities within walking range or boundary sectors.
*   **Exclusion**: Exclude raw CCTV video footage, full historical volunteer logs, and non-operational ticketing metrics.
""")

# 5. context-prioritization.md
write_file("context-prioritization.md", """
# Context Prioritization Specification

Defines relevance levels and urgency weights for entities inside Context Objects.

---

## 1. Prioritization Levels

*   **Critical**: Life-safety telemetry (e.g., active cardiac arrest status, gate blockage alarms).
*   **High**: Active incident status and direct responder locations.
*   **Medium**: Standard patrol routes and shift assignments.
*   **Low**: Battery levels or secondary equipment logs.
""")

# 6. context-ownership.md
write_file("context-ownership.md", """
# Context Ownership Specification

Defines context owners and validation authorities across the MEVIS platform.

---

## 1. Context Ownership Registry

Every context type is owned and validated by exactly one logical bounded context:
*   **Incident Context**: Owned by `Incident Management` context.
*   **Volunteer Context**: Owned by `Volunteer Management` context.
*   **Medical Operations Context**: Jointly coordinated, but validated by `Incident Management`.
""")

# 7. context-metadata.md
write_file("context-metadata.md", """
# Context Metadata Specification

Outlines universal properties shared by all Context Objects.

---

## 1. Metadata Schema Headers

Every context payload MUST contain the following header metadata properties:
*   `context_id` (String): Unique identifier.
*   `version` (Integer): Incremental version number.
*   `created_time` (ISO-8601): Time of creation.
*   `updated_time` (ISO-8601): Time of last refresh modification.
*   `source_count` (Integer): Number of contributing telemetry sources.
*   `evidence_count` (Integer): Number of verified policy attachments.
""")

# 8. context-schema.yaml
write_file("context-schema.yaml", """
# MEVIS Canonical Context Logical Schema Map
# Implementation independent outline

context_definition:
  id_pattern: "^ctx_[a-zA-Z0-9_-]+$"
  metadata:
    - name: "version"
      type: "Integer"
    - name: "confidence"
      type: "Float"
  composition:
    sources:
      - "world_state"
      - "knowledge_base"
      - "policies"
""")

print("Successfully generated all context specifications.")
