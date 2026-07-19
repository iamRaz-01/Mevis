# Operational Timeline — Crowd Surge Scenario

This document defines the chronological event sequence, state transitions, and interaction chains during a stadium turnstile crowd surge bottleneck.

---

## 1. Timeline Sequence

| Time      | Source / Actor   | Event ID              | Event Type                     | Description                                                                     | State Transitions triggered                                               |
| :-------- | :--------------- | :-------------------- | :----------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **14:00** | Turnstile Sensor | `evt_flowcount_101`   | `evt_crowd_flow_count`         | Concourse North entrance turnstile reports flow exceeding 120 people/min.       | None                                                                      |
| **14:01** | Camera Telemetry | `evt_surge_102`       | `evt_crowd_surge_detected`     | CV Camera estimates density at Gate C3 above 4.5 people/sqm.                    | `Incident` $\rightarrow$ `Detected`                                       |
| **14:01** | AI Engine        | `evt_incassess_103`   | `evt_incident_assessed`        | System registers incident classification as `CROWD_SURGE`, severity `CRITICAL`. | `Incident` $\rightarrow$ `Assessed`                                       |
| **14:02** | AI Engine        | `evt_ctxcreate_104`   | `evt_context_assembled`        | Context compiles referencing `SOP-22` (Crowd Flow & Gate closures).             | `Context` $\rightarrow$ `Assembled`                                       |
| **14:02** | AI Engine        | `evt_recgen_105`      | `evt_recommendation_generated` | Recommends closing Gate C3, opening escape routes, re-routing volunteers.       | `Recommendation` $\rightarrow$ `Draft`                                    |
| **14:02** | Policy Engine    | `evt_polpass_106`     | `evt_policy_passed`            | Policy check passes (validated against emergency stadium safety limits).        | `Recommendation` $\rightarrow$ `Ready`                                    |
| **14:03** | Trust Gate       | `evt_recrelease_107`  | `evt_recommendation_released`  | Recommendation displayed on Coordinator station console.                        | `Recommendation` $\rightarrow$ `Released`                                 |
| **14:03** | Coord Console    | `dec_recapp_108`      | `dec_recommendation_approved`  | Coordinator approves recommendation (Gate closing requires coordinator).        | `Incident` $\rightarrow$ `HumanApproved`                                  |
| **14:03** | Turnstile API    | `evt_gateclose_109`   | `evt_gate_closed`              | Turnstiles at Gate C3 automatically close.                                      | `Gate` $\rightarrow$ `Closed`                                             |
| **14:04** | Task Dispatch    | `evt_tskdispatch_110` | `evt_tasks_dispatched`         | Tasks dispatched to nearest active volunteers to redirect incoming fans.        | `Task` $\rightarrow$ `Assigned`<br>`Incident` $\rightarrow$ `Actioned`    |
| **14:04** | Volunteer App    | `evt_tskack_111`      | `evt_task_acknowledged`        | Volunteer `vol_steward_104` acknowledges redirection instructions.              | `Task` $\rightarrow$ `Acknowledged`                                       |
| **14:05** | Volunteer App    | `evt_tskstart_112`    | `evt_task_started`             | Volunteer begins crowd redirection at North Concourse intersection.             | `Task` $\rightarrow$ `InProgress`<br>`Volunteer` $\rightarrow$ `Busy`     |
| **14:15** | Turnstile Count  | `evt_flowcount_113`   | `evt_crowd_flow_count`         | Flow counts back below 40 people/min; density normalizes to 1.5 people/sqm.     | None                                                                      |
| **14:18** | Volunteer App    | `evt_tskcomplete_114` | `evt_task_completed`           | Volunteer reports concourse intersection clear.                                 | `Task` $\rightarrow$ `Completed`<br>`Volunteer` $\rightarrow$ `Available` |
| **14:19** | Incident Service | `evt_incresolve_115`  | `evt_incident_resolved`        | Incident resolves since turnstiles normalized and tasks completed.              | `Incident` $\rightarrow$ `Resolved`                                       |
| **14:22** | Learning Service | `evt_learnlog_116`    | `evt_learning_logged`          | Crowd metrics and response latency committed to stadium memory buffer.          | `Incident` $\rightarrow$ `Learned`                                        |

---

## 2. Downstream Cascades and Invariant Audits

- **Gate Constraint**: Gate C3 transitioned to `Closed`, triggering dynamic route update alerts to all nearby volunteers.
- **Causality Mappings**: Turnstile telemetry (`evt_flowcount_101`) directly caused CV Camera detection (`evt_surge_102`), driving the critical safety event chain.
- **Coordinator Gate**: Gate closures are flagged as safety-critical, requiring Coordinator console clearance rather than Supervisor zone authorization.
