# Decision Trace — Medical Incident Example

This document traces a medical dispatch decision through the 13-stage reasoning pipeline.

---

## 1. Pipeline execution Trace

### Observation (Stage 1)

- **Source**: Volunteer App.
- **Content**: "Spectator collapsed at entry Gate B12; unconscious but breathing."
- **Event ID**: `evt_increport_001`

### Context Assembly (Stage 2)

- **Venue**: `ven_stadium_01` (Lusail Stadium).
- **Zone**: `zon_north_concourse`
- **Gate**: `gat_entry_12`
- **Shift**: `shf_morning_0904` (Steward `vol_steward_104` active).
- **Nearby Paramedics**: Medical Team 3 (stationed at North Tunnel, status: Available).
- **Weather**: Clear, 28°C.

### Situation Assessment (Stage 3)

- **Assessment**: Potential acute cardiac or heat distress. Classification: `MEDICAL_EMERGENCY`. Severity: `HIGH`.

### Evidence Collection (Stage 4)

- **Evidence Item 1**: `SOP-14` (First Aid triage rules for unconscious spectators). Trust: 0.90 (Fresh).
- **Evidence Item 2**: Volunteer `vol_steward_104` GPS verified at Gate B12 location. Trust: 0.85 (Fresh).

### Hypothesis Generation (Stage 5)

- **Hypothesis A**: Heatstroke collapse (Highly probable based on weather and location).
- **Hypothesis B**: Cardiac arrest (Critical risk, must evaluate).
- **Hypothesis C**: False alarm (Pruned; probability < 5% based on volunteer report).

### Reasoning (Stage 6)

- **Evaluation**: Volunteer report verified via location telemetry. Heatstroke and Cardiac arrest require identical initial dispatch actions. Select Hypothesis A + B mitigation.

### Risk Assessment (Stage 7)

- **Safety Risk**: 5 (Life safety concern).
- **Operational Risk**: 2 (Localized concourse congestion).
- **Time Criticality**: 5 (Immediate action required).
- **Overall Risk Score**: 4.0 / 5.0.

### Policy Validation (Stage 8)

- **Rules checked**: Checked against `pol_medical_dispatch_rules`. Dispatched team must have BLS (Basic Life Support) certification. Medical Team 3 matches.
- **Compliance status**: `PASSED`.

### Recommendation Generation (Stage 9)

- **Action**: Dispatch Medical Team 3 to Gate B12 concourse immediately. Instruct Steward `vol_steward_104` to maintain perimeter and assist.
- **Confidence**: 0.92
- **Required Approvals**: Supervisor `sup_zone_north`.

### Explanation Generation (Stage 10)

- **Summary**: Dispatch Medical Team 3 to treat unconscious spectator.
- **Evidence**: Volunteer observation `evt_increport_001` matching first-aid protocol `SOP-14`.
- **Assumptions**: Spectator remains at Gate B12 concourse area.
- **Alternatives rejected**: Automatic ambulance call (medical team must triage on-scene first per SOP).
- **Risks**: Staffing concourse North is reduced by one medical team.

### Human Approval (Stage 11)

- **Sign-off**: Approved by Supervisor `sup_zone_north` at 09:44.

### Execution (Stage 12)

- Tasks assigned and completed. Patient stabilized.

### Outcome Evaluation & Learning (Stage 13)

- **Outcome**: Success. Response duration: 4 minutes. Acknowledgment delay: 15 seconds. Committed to memory.
