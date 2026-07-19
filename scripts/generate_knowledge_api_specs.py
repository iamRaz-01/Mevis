import os

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../knowledge-api"))
os.makedirs(API_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(API_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. query-contracts.md
write_file("query-contracts.md", """
# Query Integration Contracts

Defines the logical operations used by downstream clients to request evidence.

---

## 1. Query Payload Semantics
*   Requests MUST declare: Client identifier context, query intent string, target domain, and threshold trust indices.
""")

# 2. retrieval-contracts.md
write_file("retrieval-contracts.md", """
# Retrieval Contracts Specification

Defines retrieval capabilities returning compiled packages.

---

## 1. Output Guarantees
*   The Knowledge Layer MUST return structured Evidence Packages matching target domains.
""")

# 3. citation-contracts.md
write_file("citation-contracts.md", """
# Citation Contracts

Defines logical explainability citations.

---

## 1. Citation Structural Schema
Every returned evidence step citations maps:
*   chunk identifier, section coordinates, document identifier, and version indicators.
""")

# 4. subscription-model.md
write_file("subscription-model.md", """
# Subscription Model Semantics

Governs continuous updates push.

---

## 1. Subscriptions Scopes
*   Subscribers (Context Builder, Decision Intelligence) MAY register interest in specific domains (e.g. Medical emergency).
""")

# 5. update-contracts.md
write_file("update-contracts.md", """
# Update Contracts Specification

Manages knowledge corrections and annotations.

---

## 1. Update Ingress Checks
*   Corrections and annotations requests MUST submit to validation pipelines before publication.
""")

# 6. version-retrieval.md
write_file("version-retrieval.md", """
# Version Retrieval Contracts

Obtains historical revisions of assets.

---

## 1. Version Identifiers
*   Revisions MUST map to standard SemVer format to maintain auditability.
""")

# 7. event-contracts.md
write_file("event-contracts.md", """
# Event Contracts Specification

Lists standard lifecycle event messages.

---

## 1. Emitted Events
*   `KnowledgeApproved`: Emitted when asset verification finishes.
*   `KnowledgeDeprecated`: Triggered when asset supersession occurs.
""")

# 8. routing.md
write_file("routing.md", """
# Routing Responsibilities

Maps routing of requests.

---

## 1. Router Flow Duties
*   Receives requests $\rightarrow$ Verifies credentials $\rightarrow$ Queries index space $\rightarrow$ Validates outcomes $\rightarrow$ Returns Evidence Package.
""")

# 9. integration-rules.md
write_file("integration-rules.md", """
# Integration Rules

Enforces boundary separation constraints.

---

## 1. Architecture Constraints
*   Downstream systems MUST NOT query internal repositories or index clusters directly.
*   All queries MUST traverse defined Query Contracts.
""")

# 10. interaction-lifecycle.md
write_file("interaction-lifecycle.md", """
# Interaction Lifecycle Specification

Defines communication lifecycles.

---

## 1. Lifecycle Transitions
*   `Submitted` $\rightarrow$ `Authorized` $\rightarrow$ `Fetched` $\rightarrow$ `Dispatched` $\rightarrow$ `Closed`.
""")

# 11. api-schema.yaml
write_file("api-schema.yaml", """
# MEVIS Knowledge Layer OpenAPI Contract Representation
openapi: "3.0.0"
info:
  title: "MEVIS Knowledge Intelligence API"
  version: "1.0.0"
paths:
  /evidence/query:
    post:
      summary: "Query evidence packages"
      responses:
        "200":
          description: "Evidence compiled successfully"
""")

print("Successfully generated all 11 knowledge-api specs.")
