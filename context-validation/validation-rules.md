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
