# Consistency Validation Specification

Declares invariant rules ensuring relational consistency.

---

## 1. Inconsistent State Invariants

- **Duplicate Zone Containment**: An entity ID (e.g. Volunteer) MUST NOT occupy two separate zones simultaneously.
- **Incompatible Task Assignments**: A volunteer cannot hold status `Available` while assigned to an active task.
