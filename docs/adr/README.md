# Architecture Decision Records (ADR) Registry

This directory contains the chronological records of architectural decisions made for the MEVIS platform. It functions as the **architectural source of truth** subordinate to the MEVIS Engineering Constitution (MEC).

---

## 1. What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision, including the context in which it was made, the options considered, the chosen solution, and its consequences (trade-offs and downstream implications).

All new architectural decisions or modifications to existing designs MUST be recorded as an ADR using the **[ADR Template](./ADR_TEMPLATE.md)**.

---

## 2. Active ADR Registry

The following decisions have been formally adopted for the MEVIS project (referenced in the [Architecture Specification](../architecture/MEVIS%20Architecture%20Specification%20v1.0.md) Section 11):

| ADR ID | Title | Status | Date Adopted | Resolves Open Decision |
| :---: | :--- | :---: | :---: | :---: |
| **ADR-001** | Context assembly is mandatory before reasoning | Accepted | 2026-07-18 | `OD-005` (partial) |
| **ADR-002** | Human approval is required for safety-impacting actions | Accepted | 2026-07-18 | `OD-003` (partial) |
| **ADR-003** | Hybrid retrieval (vector + keyword + graph) | Accepted | 2026-07-18 | `OD-007` (partial) |
| **ADR-004** | Decision graph is mandatory for every recommendation | Accepted | 2026-07-18 | `OD-002` (partial) |
| **ADR-005** | Policy and trust are independent gates | Accepted | 2026-07-18 | — |
| **ADR-006** | Event-driven operational model | Accepted | 2026-07-18 | `OD-006` |
| **ADR-007** | Modular monolith for MVP, service extraction later | Accepted | 2026-07-18 | `OD-003` (partial) |

---

## 3. Creating a New ADR

To propose a new architectural decision:
1.  Copy the **[ADR Template](./ADR_TEMPLATE.md)** to a new file named `docs/adr/ADR-XXX_title_in_kebab_case.md` (where `XXX` is the next sequential 3-digit number).
2.  Fill in the sections (Context, Decision, Alternatives, Trade-offs, Consequences).
3.  Ensure the decision maps back to the **[Product Vision](../product/Product%20Vision%20doc%20v1.0.md)** and does not contradict any invariants in the **[MEVIS Engineering Constitution](../engineering/MEVIS%20Product%20Constitution.md)**.
4.  Submit a Pull Request following the **[Development Workflow](../development/workflow.md)** guidelines.
