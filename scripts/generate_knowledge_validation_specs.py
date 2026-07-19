import os

VALIDATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../knowledge-validation"))
os.makedirs(VALIDATION_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(VALIDATION_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. validation-framework.md
write_file("validation-framework.md", """
# Knowledge Validation, Provenance & Citation Framework

Defines the quality assurance framework checking retrieved knowledge items.

---

## 1. Quality Filters Flow
Validation proceeds sequentially through:
1.  **Source Check**: Authoritative verification.
2.  **Lineage Trace**: Provenance verification.
3.  **Expiry Audit**: Freshness checking.
4.  **Clash Verification**: Contradiction detection.
5.  **Outcomes compilation**: Rating availability.
""")

# 2. source-validation.md
write_file("source-validation.md", """
# Source Validation Specification

Verifies source credentials.

---

## 1. Authoritative Credentials
*   Retrieved knowledge MUST resolve back to an active organizational owner ID.
*   Approved documents MUST possess valid electronic authorization sign tags.
""")

# 3. provenance.md
write_file("provenance.md", """
# Provenance Model Specification

Represents document lineage and revision histories.

---

## 1. Provenance Lineage Records
*   Every processed chunk MUST trace lineage back to parent asset version tags.
""")

# 4. citation.md
write_file("citation.md", """
# Citation Specification

Ensures explainability citations.

---

## 1. Citation Formatting Guidelines
*   Citations MUST capture: chunk ID, parent document identifier, specific section numbers, and revision tags.
""")

# 5. trust-model.md
write_file("trust-model.md", """
# Trust Model Specification

Computes overall candidate trustworthiness.

---

## 1. Trust Score Parameters
Trust score aggregates:
*   **Authority Proximity**: Source ownership classification.
*   **Revision Recency**: Elapsed time from last review.
""")

# 6. freshness.md
write_file("freshness.md", """
# Freshness Validation Specification

Defines document expiry rules.

---

## 1. Expiration Conditions
*   SOP chunks MUST undergo review every 365 days. Chunks failing review audits MUST transition status to `RequiresReview`.
""")

# 7. completeness.md
write_file("completeness.md", """
# Completeness Specification

Asserts structural coverage.

---

## 1. Mandatory Attributes
*   Chunks are complete ONLY when specifying: Owner ID, domain classification, and traceability markers.
""")

# 8. contradiction.md
write_file("contradiction.md", """
# Contradiction Detection Specification

Detects conflicting instructions.

---

## 1. Conflicting Guidelines Flags
*   If two active playbooks declare contradictory evacuation gates targets, the engine MUST raise an `UnresolvedContradiction` exception.
""")

# 9. deprecation.md
write_file("deprecation.md", """
# Deprecation Model Specification

Filters out archived or superseded documents.

---

## 1. Superseded Rules
*   When a new document version publishes, older versions MUST transition status to `Deprecated`.
""")

# 10. integrity.md
write_file("integrity.md", """
# Integrity Specification

Validates reference and structural consistency.

---

## 1. Consistency Rules
*   References to cross-linked manuals MUST resolve to valid active knowledge indexes.
""")

# 11. validation-outcomes.md
write_file("validation-outcomes.md", """
# Validation Outcomes Specification

Configures standard validation outcomes.

---

## 1. Outcomes Registry
*   `Validated`: Approved for active reasoning.
*   `RequiresReview`: Flagged with warnings.
*   `Rejected`: Denied for reasoning loop.
""")

print("Successfully generated all 11 knowledge-validation specs.")
