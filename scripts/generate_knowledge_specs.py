import os

KNOWLEDGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../knowledge"))
os.makedirs(KNOWLEDGE_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(KNOWLEDGE_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. architecture.md
write_file("architecture.md", """
# Knowledge Architecture Specification

Defines the conceptual architecture of the Knowledge Intelligence Layer.

---

## 1. Architectural Boundaries
The Knowledge Layer represents the authoritative repository of institutional knowledge (SOPs, playbooks, guidelines).
*   It MUST remain conceptually distinct from dynamic World State (real-time reality observations).
*   It exposes static reference documentation needed by Context Intelligence and Decision Intelligence.
""")

# 2. taxonomy.md
write_file("taxonomy.md", """
# Knowledge Taxonomy Specification

Organizes operational knowledge assets into logical categories.

---

## 1. Categories
*   `SOP`: Standard Operating Procedures detailing routing and responder checklists.
*   `EmergencyProcedures`: Step-by-step actions for weather evacs, crowd crush, or threats.
*   `Policies`: Governance rules (e.g., maximum building capacities).
*   `Guidelines`: Training handbooks and best practices.
""")

# 3. hierarchy.md
write_file("hierarchy.md", """
# Knowledge Hierarchy Specification

Defines the hierarchical structure of knowledge items.

---

## 1. Hierarchy Layout
Every knowledge asset MUST follow this structure:
```text
Domain (e.g., Medical Operations)
└── Knowledge Collection (e.g., Cardiac Emergency Response)
    └── Knowledge Asset (e.g., AED Deployment SOP)
        └── Section (e.g., Ingress Clearances)
            └── Topic (e.g., Ambulance Access Routes)
```
""")

# 4. ownership.md
write_file("ownership.md", """
# Knowledge Ownership Model

Defines clear roles and governance responsibility.

---

## 1. Roles
*   **Operational Owner**: Responsible for writing and maintaining contents.
*   **Governance Owner**: Responsible for final validation audit and approval check.
""")

# 5. governance.md
write_file("governance.md", """
# Knowledge Governance Specification

Outlines the approval and publication compliance parameters.

---

## 1. Rules
*   Every published asset MUST undergo a mandatory review cycle every 12 months.
*   Modification of any safety-critical policy triggers context validation failures for downstream reasoning if missing approval tags.
""")

# 6. lifecycle.md
write_file("lifecycle.md", """
# Knowledge Lifecycle Specification

Maps stages of knowledge items.

---

## 1. States & Transitions
An asset progresses through:
*   `Draft`: Work in progress.
*   `Review`: Subject to owner checks.
*   `Approved`: Validated but pending release.
*   `Published`: Active and visible to Context Intelligence.
*   `Deprecated`: Replaced by a newer version.
*   `Archived`: Inactive historical file.
""")

# 7. trust-model.md
write_file("trust-model.md", """
# Knowledge Trust Model

Defines parameters weighting the reliability of reference documentation.

---

## 1. Trust Dimensions
*   **Review Status**: Validated assets possess standard weight.
*   **Recency Decay**: Age parameters reduce trust metrics if reviews exceed scheduled intervals.
""")

# 8. versioning.md
write_file("versioning.md", """
# Knowledge Versioning Model

Enforces revision tracking.

---

## 1. Semantic Versioning Rules
*   Every knowledge asset MUST follow semantic versioning rules (`Major.Minor.Patch`).
*   Major updates indicate breaking changes (e.g. evacuation route changes).
""")

# 9. relationships.md
write_file("relationships.md", """
# Knowledge Relationships Model

Maps dependencies and cross-references.

---

## 1. Relationship Types
*   `References`: Cites another policy.
*   `Supersedes`: Completely replaces an older version.
*   `Complements`: Adds optional detail to a primary SOP.
""")

# 10. metadata.md
write_file("metadata.md", """
# Knowledge Metadata Specification

Defines standardized fields for metadata indexing.

---

## 1. Required Metadata Attributes
Every asset payload MUST include:
*   `asset_id`: String prefix matching domain boundaries.
*   `title`: Human readable title.
*   `domain`: Bounded context label (Medical, Security, Volunteer).
*   `version`: SemVer string.
*   `owner_id`: Responsible steward identifier.
""")

print("Successfully generated all 10 knowledge specs.")
