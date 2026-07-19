# Decision Trace — Crowd Surge Example

This document traces a crowd redirection decision through the 13-stage reasoning pipeline.

---

## 1. Pipeline execution Trace

### Observation (Stage 1)

- **Source**: CCTV Flow Camera.
- **Content**: Density at Gate C3 exceeds 4.5 people/sqm.
- **Event ID**: `evt_surge_102`

### Context Assembly (Stage 2)

- **Venue**: `ven_stadium_01` (Lusail Stadium).
- **Zone**: `zon_north_concourse`
- **Gate**: `gat_entry_03` (turnstile bottleneck).
- **Flow Count**: 135 entries/min.
- **Nearby Volunteers**: 4 stewards active in adjacent concourse.

### Situation Assessment (Stage 3)

- **Assessment**: Serious congestion bottleneck. Classification: `CROWD_SURGE`. Severity: `CRITICAL`.

### Evidence Collection (Stage 4)

- **Evidence Item 1**: Turnstile sensor telemetry matching high entry rate. Trust: 0.92.
- **Evidence Item 2**: `SOP-22` (Crowd control and exit door redirects). Trust: 0.90.

### Hypothesis Generation (Stage 5)

- **Hypothesis A**: turnstile scanner network outage (Pruned after check confirms scan network is online).
- **Hypothesis B**: Ingress gate bottleneck due to scanner slowdown. (Probable).
- **Hypothesis C**: Spectator backup from blockages inside the zone. (Possible).

### Reasoning (Stage 6)

- **Evaluation**: Telemetry confirms turnstile flow is high but concourse exits are saturated. Open backup gates and redirect flow.

### Risk Assessment (Stage 7)

- **Safety Risk**: 4 (Crush hazard).
- **Operational Risk**: 4 (Ingress queue delay).
- **Time Criticality**: 4 (Quick mitigation required).
- **Overall Risk Score**: 4.0 / 5.0.

### Policy Validation (Stage 8)

- **Rules checked**: Verified against `pol_gate_override_policy`. Closed gates C4 and C5 can be opened under override conditions.
- **Compliance status**: `PASSED`.

### Recommendation Generation (Stage 9)

- **Action**: Execute Gate C3 closing override command. Open adjacent Gate C4 to split the queue. Dispatch 3 stewards to redirect oncoming fans.
- **Confidence**: 0.94
- **Required Approvals**: Coordinator (Gate locking is locked to coordinator authority).

### Explanation Generation (Stage 10)

- **Summary**: Open Gate C4 and redirect crowd to split the queue bottleneck.
- **Evidence**: CCTV video analyzer density warning `evt_surge_102` confirmed by turnstile flow rate metrics.
- **Assumptions**: Splitting the queue will not create a secondary bottleneck at Gate C4 concourse area.
- **Alternatives rejected**: Total gate entry lock (would cause dangerous crowd backing outside gates).

### Human Approval (Stage 11)

- **Sign-off**: Approved by Coordinator station 2 at 14:03.

### Execution & Learning (Stage 12 & 13)

- Turnstiles open. Crowd density normalizes to 1.5 people/sqm. Successfully committed to memory.
