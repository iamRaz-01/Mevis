# Evaluation Framework Specification

Defines quality and safety thresholds evaluated on the platform.

---

## 1. Metric Thresholds

- **Groundedness**: All recommendations MUST ground in fetched SOP evidence.
- **Faithfulness**: Reasoning trace details MUST align with actual contexts.
- **Policy Compliance**: Violations of stadium policies MUST equal zero.
- **Latency**: Recommendation generation latency MUST remain under 5.0 seconds.
- **Human Acceptance**: Mapped ratio of accepted recommendations. Target: $> 85\%$.
