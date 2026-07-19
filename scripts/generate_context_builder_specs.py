import os

CONTEXT_BUILDER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../context-builder"))
os.makedirs(CONTEXT_BUILDER_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(CONTEXT_BUILDER_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. pipeline.md
write_file("pipeline.md", """
# Context Builder Pipeline Specification

This document defines the sequential logical processing stages of the **Context Builder Pipeline**.

---

## 1. Pipeline Stages Overview

The Context Builder Pipeline transforms raw observations into decision-ready Context Objects through the following stages:
1.  **Normalization**: Canonicalizes raw payload schemas.
2.  **Entity Resolution**: Links identifiers (e.g. `vol_steward_104`).
3.  **World Lookup**: Enriches with current World State variables.
4.  **Knowledge Retrieval**: Attaches SOP documentation guidelines.
5.  **Policy Retrieval**: Matches safety constraints.
6.  **Constraint Resolution**: Evaluates capacity limits.
7.  **Historical Context**: Appends logs.
8.  **Context Enrichment**: Expands relationship graphs.
9.  **Context Assembly**: Generates final output object.
10. **Context Validation**: Asserts invariants.
11. **Context Scoring**: Evaluates quality metrics.
""")

# 2. normalization.md
write_file("normalization.md", """
# Observation Normalization Specification

Converts heterogeneous raw observations into unified ingestion formats.

---

## 1. Ingestion Normalization Rules

*   **Payload Normalization**: Normalizes field names (e.g. `GPS_Latitude` $\rightarrow$ `coordinates`).
*   **Timestamp Synchronization**: Converts all update clocks to UTC ISO-8601.
*   **Confidence Propagation**: Propagates trust attributes from observation sources.
""")

# 3. entity-resolution.md
write_file("entity-resolution.md", """
# Entity Resolution Specification

Matches telemetry observation entities to valid World Model registry IDs.

---

## 1. Resolution Rules
*   **ID Mapping**: String references like "Steward John B12" resolve to `vol_steward_104`.
*   **Ambiguity Resolution**: If matching is ambiguous, the resolver MUST defer to spatial proximity or report a resolution error.
""")

# 4. world-lookup.md
write_file("world-lookup.md", """
# World Lookup Enrichment Specification

Enriches resolved entity profiles with the latest state metrics from the World State Engine.

---

## 1. Enrichment Targets
The pipeline MUST query active states for:
*   Resolved responder status (e.g., `Available`, `Busy`).
*   Target Zone coordinates and layout dimensions.
""")

# 5. knowledge-retrieval.md
write_file("knowledge-retrieval.md", """
# SOP & Knowledge Retrieval Specification

Appends relevant standard operating procedures (SOPs) and manuals to the context.

---

## 1. Retrieval Bounds
*   SOP retrieval MUST target only documents matched to the triggering incident classification.
*   Retrieved guidelines attach to context payloads as immutable evidence documents.
""")

# 6. policy-retrieval.md
write_file("policy-retrieval.md", """
# Policy Retrieval Specification

Retrieves regulatory constraints and venue directives relevant to target decisions.

---

## 1. Policy Mapping
*   Decisions involving gate flow MUST retrieve crowd evacuation limits.
*   Decisions involving medical dispatch MUST retrieve triage escalation boundaries.
""")

# 7. constraint-resolution.md
write_file("constraint-resolution.md", """
# Constraint Resolution Specification

Appends operational capacity constraints to prevent out-of-bounds decisions.

---

## 1. Ingestion Constraints
*   **Capacity Limit**: Max capacity markers of target zones.
*   **Certification Requirements**: Volunteer training certificates checked against assignment rules.
""")

# 8. historical-context.md
write_file("historical-context.md", """
# Historical Context Specification

Appends recent temporal state change sequences to support escalations.

---

## 1. Temporal history scope
*   Includes incident reports within the past 2 hours.
*   Includes recent volunteer patrol routes to track fatigue indices.
""")

# 9. enrichment.md
write_file("enrichment.md", """
# Context Enrichment Specification

Synthesizes relationship maps and metadata parameters into one explainable payload.

---

## 1. Enrichment Mapping
*   Draws spatial adjacency trees around resolved incident centers.
*   Builds bidirectional links connecting active responders, target incidents, and nearby medical stations.
""")

# 10. context-assembly.md
write_file("context-assembly.md", """
# Context Assembly Specification

Compiles final Context Object outputs conforming to schema configurations.

---

## 1. Payload Composition Rules
The output payload MUST combine:
*   Entities list and active telemetry variables.
*   Policy rules and SOP references.
*   Aggregate confidence and freshness scores.
""")

# 11. validation.md
write_file("validation.md", """
# Context Validation Specification

Runs final invariant verification tests before broadcasting context payloads.

---

## 1. Pipeline Invariants
A compiled context MUST be rejected if:
*   It lacks policy mappings for High severity incidents.
*   Freshness scores of Critical telemetry exceed 40 seconds.
""")

# 12. scoring.md
write_file("scoring.md", """
# Context Quality Scoring Specification

Evaluates context quality properties.

---

## 1. Quality scoring metrics

*   **Completeness**: Percentage of resolved entities containing valid states.
*   **Traceability**: Presence of source citations for all attached policies.
*   **Freshness Score**: Arithmetic mean age of all included pings.
""")

# 13. caching.md
write_file("caching.md", """
# Context Caching & Reuse Specification

Defines reuse and invalidation triggers to optimize processing.

---

## 1. Caching Invalidation rules
Contexts for specific decisions can be cached unless:
*   An update delta is received for any contained entity (e.g. Volunteer relocates).
*   Active incident severity changes.
""")

# 14. freshness.md
write_file("freshness.md", """
# Context Freshness Specification

Determines overall context lifetimes and refresh frequencies.

---

## 1. Context Expiration Policies
*   Operational Context: Expired after 15 seconds.
*   Emergency evacuation context: Active refresh loop requested every 5 seconds.
""")

print("Successfully generated all 14 context builder specs.")
