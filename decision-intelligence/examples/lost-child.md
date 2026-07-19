# Decision Trace — Lost Child Example

This document traces a missing child search decision through the 13-stage reasoning pipeline.

---

## 1. Pipeline execution Trace

### Observation (Stage 1)

- **Source**: Volunteer App.
- **Content**: Parent reports missing 6-year-old child wearing a red shirt, last seen near zone North food stalls.
- **Event ID**: `evt_increport_201`

### Context Assembly (Stage 2)

- **Venue**: `ven_stadium_01` (Lusail Stadium).
- **Zone**: `zon_north_concourse`
- **Active Volunteers in Zone**: 8 stewards.
- **Adjacent Exits**: Gate C12, C13, and C14.

### Situation Assessment (Stage 3)

- **Assessment**: Missing person risk. Classification: `LOST_CHILD`. Severity: `HIGH`.

### Evidence Collection (Stage 4)

- **Evidence Item 1**: Parent identity and matching seat credentials verified. Trust: 0.80.
- **Evidence Item 2**: Missing child protocol `SOP-09` (Missing Person search loop). Trust: 0.90.

### Hypothesis Generation (Stage 5)

- **Hypothesis A**: Child wandered toward nearest stadium exit gates (Gate C12/C13).
- **Hypothesis B**: Child remains lost inside the concourse retail stalls area.
- **Hypothesis C**: Child left the stadium perimeter (Low probability, perimeter gates are closed to unaccompanied minors).

### Reasoning (Stage 6)

- **Evaluation**: Focus primary search in food concourse retail loops, while placing exit gates on secondary alert.

### Risk Assessment (Stage 7)

- **Safety Risk**: 4 (Child safety threat).
- **Operational Risk**: 1 (No direct structural bottleneck).
- **Time Criticality**: 4 (SLA search window active).
- **Overall Risk Score**: 3.5 / 5.0.

### Policy Validation (Stage 8)

- **Rules checked**: Checked against `pol_privacy_missing_person`. Child descriptions and photo shares are restricted to checked-in staff devices.
- **Compliance status**: `PASSED`.

### Recommendation Generation (Stage 9)

- **Action**: Dispatch Steward `vol_steward_104` to stay with parent. Broadcast description to all 8 stewards in zone concourse. Place turnstile gates C12-C14 on minor description match alert.
- **Confidence**: 0.88
- **Required Approvals**: Supervisor `sup_zone_north`.

### Explanation Generation (Stage 10)

- **Summary**: Trigger missing child search protocol SOP-09 in zone North.
- **Evidence**: Observation `evt_increport_201` backed by seat scan logs confirming family check-in.
- **Assumptions**: Child remains within zone concourse limits.
- **Alternatives rejected**: Total Gate Lockdown (rejected as out of proportion; child is not believed to be abducted based on report).

### Human Approval & Execution (Stage 11 & 12)

- Approved by Supervisor. Search dispatched. Child located successfully at Gate C12 turnstiles.
