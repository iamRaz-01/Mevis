import os

CONTEXT_API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../context-api"))
os.makedirs(CONTEXT_API_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(CONTEXT_API_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. query-contracts.md
write_file("query-contracts.md", """
# Query Contracts Specification

Defines logical query contract messages for requesting context.

---

## 1. Context Query Schema Layout
Queries requesting context MUST specify:
*   `requester_id`: Unique identifier of downstream component.
*   `context_scope`: `Incident` | `Volunteer` | `Zone` | `Medical`.
*   `target_id`: Associated entity identifier.
""")

# 2. context-capabilities.md
write_file("context-capabilities.md", """
# Context Capabilities Specification

Defines core capabilities exposed by the Context Intelligence subsystem.

---

## 1. Capabilities List
*   `BuildContext`: Compiles context snapshots.
*   `RetrieveContext`: Serves context snapshots to consumers.
*   `ValidateContext`: Audits context snapshots.
*   `InspectContext`: Audits lineage traces.
""")

# 3. update-contracts.md
write_file("update-contracts.md", """
# Update Contracts Specification

Defines contracts for submitting corrections and annotations.

---

## 1. Update Request Format
*   `context_id`: Targets the active context payload.
*   `modifier_id`: Authorized user identifier.
*   `field_annotations`: Key-value map representing manual edits.
""")

# 4. subscription-model.md
write_file("subscription-model.md", """
# Subscription Model Specification

Defines continuous update channels for dashboard consumers.

---

## 1. Subscription Filters
*   `channel_id`: Unique channel index.
*   `scope_filter`: Subscribes to specific target Zones or severities.
""")

# 5. snapshot-retrieval.md
write_file("snapshot-retrieval.md", """
# Snapshot Retrieval Specification

Defines snapshot guarantees and version correlation.

---

## 1. Version Correlation Rules
*   Snapshot requests MUST include version references correlating to World State Engine checkpoints.
""")

# 6. event-contracts.md
write_file("event-contracts.md", """
# Event Contracts Specification

Specifies event headers emitted by the Context Layer.

---

## 1. Emitted Events
*   `ContextCreated`: Emitted on successful compile.
*   `ContextInvalidated`: Emitted when quality checks fail on stale inputs.
""")

# 7. routing.md
write_file("routing.md", """
# Logical Routing Model

Details internal query routes.

---

## 1. Request Lifecycle Route
1.  Consumer Query Received
2.  Normalizer extracts parameters
3.  Context Builder queries World State
4.  Validator audits quality
5.  Consumer delivery
""")

# 8. integration-rules.md
write_file("integration-rules.md", """
# Integration & Anti-Corruption Rules

Rules preserving bounded context boundaries.

---

## 1. Constraints
*   Consumers MUST NOT bypass the Context Layer to query World State Engine directly.
*   All context payloads MUST complete validation before delivery.
""")

# 9. lifecycle-contracts.md
write_file("lifecycle-contracts.md", """
# Context Lifecycle Contracts

Maps lifecycle states of context queries.

---

## 1. Lifecycle States
*   `Requested`: Initial query received.
*   `Assembled`: Context Builder compiled parameters.
*   `Validated`: Passed validation check gates.
*   `Dispatched`: Served to consumer.
""")

# 10. api-schema.yaml
write_file("api-schema.yaml", """
# MEVIS Canonical API Configuration Contract Map

api_contracts:
  queries:
    - name: "retrieve_incident_context"
      required_params: ["requester_id", "target_id"]
  updates:
    - name: "submit_manual_annotation"
      required_params: ["context_id", "modifier_id", "field_annotations"]
""")

print("Successfully generated all 10 context-api specs.")
