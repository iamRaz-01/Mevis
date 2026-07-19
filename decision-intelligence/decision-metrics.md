# Decision Metrics Specification

This document defines the key performance indicators tracked to audit AI reasoning.

---

## 1. Core KPIs

- **Acceptance Rate (AR)**: Number of recommendations accepted by operators divided by total recommendations presented.
- **Human Override Rate (HOR)**: Ratio of recommendations rejected in favor of manually drafted actions.
- **Policy Violations (PV)**: Number of AI recommendations that violated a policy (MUST remain 0).
- **Decision Latency (DL)**: Seconds from observation ingestion to ready recommendation.
- **Utility Calibration (UC)**: Correlation coefficient between predicted confidence and actual task success rates.
