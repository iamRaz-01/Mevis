# Explainability Model Specification

This document defines the structural template and rules for compiling explainable justifications for all AI decisions.

---

## 1. Explanation Contract Structure

Every recommendation explanation MUST contain the following sections:

1.  **Decision Summary**: Concise business overview of what is recommended.
2.  **Supporting Evidence**: Bulleted list of facts, timestamps, and source ratings.
3.  **Key Assumptions**: Grounding assumptions (e.g. "Assuming rain will continue for 30 minutes").
4.  **Rejected Alternatives**: Description of alternate paths considered and reasons for dismissal.
5.  **Remaining Risks**: Known trade-offs (e.g. "Reassigning Steward B leaves Gate 4 with lower staffing").
6.  **Policy Citations**: Reference IDs to active SOPs and bylaws.
