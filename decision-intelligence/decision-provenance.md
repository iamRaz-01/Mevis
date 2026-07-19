# Decision Provenance & Audit Trail Specification

This document defines the schema for compiling historical audit logs of decisions.

---

## 1. Audit Trail Mappings

The system MUST maintain an immutable cryptographic record mapping:

```text
[Observation ID] ──> [Context Assembly Hash] ──> [Evidence Reference IDs] ──>
[Hypothesis Probabilities] ──> [Risk Score] ──> [Policy Engine Pass Hash] ──>
[Recommendation ID] ──> [Human Approval Signature] ──> [Task Completion Events]
```

This sequence guarantees that any coordinator or auditor can reconstruct exactly why an action was taken.
