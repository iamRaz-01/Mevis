import os

VALIDATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../context-validation"))
os.makedirs(VALIDATION_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(VALIDATION_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. validation-rules.md
write_file("validation-rules.md", """
# Context Validation Pipeline Rules

This document specifies the validation engine pipeline execution steps and rules.

---

## 1. Validation Flow Pipeline

Before Context is released downstream, it MUST proceed sequentially through:
1.  **Schema Check**: Structural validation checks.
2.  **Completeness Validation**: Confirms necessary entities are present.
3.  **Freshness Validation**: Outlines validation limits.
4.  **Consistency Invariant Verification**: Blocks logical circular references.
5.  **Contradiction Analysis**: Checks overlapping reports.
6.  **Confidence Grading**: Grades trust metadata values.
""")

# 2. completeness.md
write_file("completeness.md", """
# Completeness Validation Specification

Defines required vs. optional elements for decision contexts.

---

## 1. Completeness Criteria

*   **Mandatory Elements**: Triggering incident, sector coordinates, and active responders.
*   **Optional Elements**: Secondary weather forecasts and past shift history logs.
""")

# 3. freshness.md
write_file("freshness.md", """
# Freshness Validation Specification

Defines TTL thresholds and staleness handling protocols.

---

## 1. Expiration Rules
*   **Stale Telemetry Degradation**: If volunteer coordinates age exceeds 40 seconds, the validation status MUST transition to `Stale`, reducing confidence by 30%.
""")

# 4. consistency.md
write_file("consistency.md", """
# Consistency Validation Specification

Declares invariant rules ensuring relational consistency.

---

## 1. Inconsistent State Invariants
*   **Duplicate Zone Containment**: An entity ID (e.g. Volunteer) MUST NOT occupy two separate zones simultaneously.
*   **Incompatible Task Assignments**: A volunteer cannot hold status `Available` while assigned to an active task.
""")

# 5. contradiction.md
write_file("contradiction.md", """
# Contradiction Detection Specification

Handles conflicting observations or duplicate reports from heterogeneous sources.

---

## 1. Contradiction Rules
*   If GPS pings contradict manual coordinator updates, the engine MUST apply Trust Precedence Rules (Coordinator > Automated GPS).
*   Unresolved conflicts MUST flag the context as `Requires Manual Review` and raise an alarm.
""")

# 6. missing-context.md
write_file("missing-context.md", """
# Missing Context Handling

Defines dynamic degradation rules when required parameters are missing.

---

## 1. Recoverable vs. Critical Gaps
*   **Recoverable Gaps**: Missing battery metrics or shift history. Resolves to default values.
*   **Critical Omissions**: Missing active incident coordinates or policy maps. Context is marked `Invalid`.
""")

# 7. confidence.md
write_file("confidence.md", """
# Confidence Assessment Specification

Structures trust scoring without choosing mathematical algorithms.

---

## 1. Trust Scoring Dimensions
*   **Source Quality**: Weighted source credibility values.
*   **Completeness Grade**: Rate of filled required state attributes.
*   **Disagreement Decay**: Deducts score when conflicting observation reports exist.
""")

# 8. quality-framework.md
write_file("quality-framework.md", """
# Quality & Health Framework

Outlines the 8 core quality dimensions auditing context objects.

---

## 1. Quality Dimensions

1.  **Completeness**: Required metrics coverage.
2.  **Freshness**: Telemetry data age.
3.  **Consistency**: No invariant check violations.
4.  **Confidence**: Weighted composite trust score.
5.  **Traceability**: Evidence citation paths.
6.  **Relevance**: Minimal scope matching.
7.  **Explainability**: Logged reasons for inclusion.
8.  **Integrity**: Schema validator conformity.
""")

# 9. validation-outcomes.md
write_file("validation-outcomes.md", """
# Context Validation Outcomes

Defines outputs and escalation targets of the validation engine.

---

## 1. Outcome Registry

*   `Valid`: Released downstream immediately.
*   `Valid with Warnings`: Released with flagged confidence metrics.
*   `Requires Enrichment`: Re-entered into Context Builder.
*   `Requires Manual Review`: Escalated to Human Supervisor console.
*   `Invalid`: Terminated, raising alert.
""")

# 10. validation-schema.yaml
write_file("validation-schema.yaml", """
# MEVIS Canonical Validation Configuration Schema Map

validation_rules:
  pipeline:
    - stage: "schema"
      mandatory: true
    - stage: "completeness"
      mandatory: true
    - stage: "freshness"
      mandatory: true
""")

print("Successfully generated all context validation specs.")
