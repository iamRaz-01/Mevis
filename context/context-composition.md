# Context Composition Specification

Defines how Context Objects are assembled from World State, Knowledge, Policies, and Constraints.

---

## 1. Logical Composition Formula

Context is composed via logical filters:
\[ ext{Context} = ext{Filter}( ext{World State}) \cup ext{Retrieve}( ext{Knowledge Base}) \cup ext{Map}( ext{Operational Policies}) \]

## 2. Inclusion & Exclusion Rules

- **Inclusion**: Include only entities within walking range or boundary sectors.
- **Exclusion**: Exclude raw CCTV video footage, full historical volunteer logs, and non-operational ticketing metrics.
