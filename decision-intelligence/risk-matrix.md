# Risk Matrix Specification

This document defines the multi-dimensional risk assessment scoring model.

---

## 1. Risk Dimensions

Every Recommendation MUST evaluate risk across five dimensions on a scale of 1 to 5 (1 = Minimal, 5 = Critical):

1.  **Safety Risk**: Danger to fans, staff, or volunteers.
2.  **Operational Risk**: Stadium flow bottlenecks or scan delays.
3.  **Reputational Risk**: Media or public perception.
4.  **Resource Risk**: Starving other zones of volunteers.
5.  **Time Criticality**: Rapid progression likelihood.

## 2. Escalation Logic

- If Safety Risk $\ge$ 4 $
ightarrow$ Escalate to Coordinator, enforce Approval Lock.
- If Operational Risk $\ge$ 3 $
ightarrow$ Notify Zone Supervisor.
