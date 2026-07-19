# Digital Twin World Evolution Model

This specification defines how the Digital Twin evolves over time, handling state migration, telemetry decay, and snapshot retention.

---

## 1. State Mutation and Decay

Digital Twin properties decay in validity over time unless refreshed by new telemetry observations:

- **GPS Telemetry Decay**: Volunteer location validity decays exponentially.
  \[ V(t) = V_0 \cdot e^{-\lambda t} \]
  Where $\lambda = 0.05$ (validity drops below 15% after 40 seconds of zero updates).
- **Incident State Migration**: Open incidents with no updates for 10 minutes automatically transition to a `STALE` verification status.

## 2. Snapshot Retention

Operational snapshots are archived into long-term history databases every 5 minutes.
