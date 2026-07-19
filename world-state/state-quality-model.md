# State Quality & Health Model

Defines measurable health metrics for the Digital Twin state.

---

## 1. Health indicators

- **Coverage**: Ratio of reporting telemetry sensors to target installations.
- **Freshness**: Mean age of active spatial coordinates.
- **Latency**: milliseconds from observation ingress to active version release (target: $< 200$ms).
- **Confidence**: Weighted mean of all active entity confidence values.
- **Missing Data**: Count of null or expired state properties.
- **Conflict Count**: Number of unresolved active contradictions.
