# MEVIS Business Capability Mapping

This document maps business capabilities to bounded contexts and defines the RACI matrix for all operations.

---

## 1. Bounded Context RACI Matrix

| Capability / Task              | Volunteer Mgmt | Incident Mgmt | Decision Intel | Recommendation | Notification | Analytics |
| :----------------------------- | :------------: | :-----------: | :------------: | :------------: | :----------: | :-------: |
| **Manage Volunteer Shifts**    |     R / A      |       I       |       C        |       I        |      I       |     C     |
| **Ingest Observation**         |       C        |     R / A     |       C        |       I        |      I       |     I     |
| **Triage & Triage Escalation** |       I        |     R / A     |       C        |       I        |      I       |     C     |
| **Generate Recommendation**    |       I        |       C       |     R / A      |       R        |      I       |     I     |
| **Validate Safety Policies**   |       I        |       I       |       C        |     R / A      |      I       |     I     |
| **Broadcast Alerts**           |       I        |       I       |       I        |       C        |    R / A     |     I     |
| **Compute Operations KPIs**    |       I        |       I       |       I        |       I        |      I       |   R / A   |

- **R**: Responsible, **A**: Accountable, **C**: Consulted, **I**: Informed.
