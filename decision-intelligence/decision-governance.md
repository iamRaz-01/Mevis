# Decision Governance Specification

Consolidates decision memory storage, provenance mapping, and metrics tracking.

---

## 1. Provenance Audit Trails

Every recommendation MUST record the lineage hash chain:
`Observation ID` $
ightarrow$ `Context Assembly Hash` $
ightarrow$ `Evidence IDs` $
ightarrow$ `Risk Score` $
ightarrow$ `Policy Pass` $
ightarrow$ `Recommendation ID`.

---

## 2. Core KPIs

- **Acceptance Rate (AR)**: Target $> 85\%$.
- **Human Override Rate (HOR)**: Target $< 15\%$.
- **Decision Latency**: Target $< 5$ sec.
