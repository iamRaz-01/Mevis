# Decision Lifecycle Specification

This document defines the lifecycle states and allowed transitions of the Decision object (`dec_`).

---

## 1. Lifecycle State Definitions

- **Created**: Initial state when an observation triggers pipeline assembly.
- **Analyzed**: Context assembly and situation assessment completed.
- **RiskAssessed**: Multidimensional risk evaluation scores computed.
- **PolicyValidated**: Checked against safety rules, SOP boundaries, and constraints.
- **Recommended**: AI Orchestrator has finalized candidate tasks and justifications.
- **Presented**: Recommendation is displayed on the target operator's screen interface.
- **Accepted**: Human approved the suggestion, or low-risk auto-execution triggered.
- **Rejected**: Operator dismissed the advice.
- **Executed**: Underlying tasks have been dispatched and completed.
- **Evaluated**: Execution outcomes, delays, and feedback metrics collected.
- **Archived**: Logged into the long-term memory database for future similarity search.

---

## 2. Allowed Transitions

- `Created` $
ightarrow$ `Analyzed`
- `Analyzed` $
ightarrow$ `RiskAssessed`
- `RiskAssessed` $
ightarrow$ `PolicyValidated`
- `PolicyValidated` $
ightarrow$ `Recommended` (if policy checks pass)
- `PolicyValidated` $
ightarrow$ `Rejected` (if policy checks fail)
- `Recommended` $
ightarrow$ `Presented`
- `Presented` $
ightarrow$ `Accepted`
- `Presented` $
ightarrow$ `Rejected`
- `Accepted` $
ightarrow$ `Executed`
- `Executed` $
ightarrow$ `Evaluated`
- `Evaluated` $
ightarrow$ `Archived`
