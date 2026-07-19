# Operational Timeline — Security Threat Scenario

This document defines the chronological event sequence, state transitions, and interaction chains during a stadium security breach or threat incident.

---

## 1. Timeline Sequence

| Time      | Source / Actor   | Event ID              | Event Type                     | Description                                                                     | State Transitions triggered                                               |
| :-------- | :--------------- | :-------------------- | :----------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **19:00** | Smart Gate       | `evt_breach_301`      | `evt_security_breach_detected` | Intrusion sensor flags gate door open without credential scan in Zone East.     | `Incident` $\rightarrow$ `Detected`                                       |
| **19:01** | AI Engine        | `evt_incassess_302`   | `evt_incident_assessed`        | System registers incident classification as `SECURITY_BREACH`, severity `HIGH`. | `Incident` $\rightarrow$ `Assessed`                                       |
| **19:01** | AI Engine        | `evt_ctxcreate_303`   | `evt_context_assembled`        | Context compiles referencing `SOP-07` (Intrusion and perimeter sweeps).         | `Context` $\rightarrow$ `Assembled`                                       |
| **19:02** | AI Engine        | `evt_recgen_304`      | `evt_recommendation_generated` | Recommends locking adjacent gates, dispatching patrol, alerting volunteers.     | `Recommendation` $\rightarrow$ `Draft`                                    |
| **19:02** | Policy Engine    | `evt_polpass_305`     | `evt_policy_passed`            | Policy check passes (validated against facility protection rules).              | `Recommendation` $\rightarrow$ `Ready`                                    |
| **19:02** | Trust Gate       | `evt_recrelease_306`  | `evt_recommendation_released`  | Recommendation displayed on Coordinator station console.                        | `Recommendation` $\rightarrow$ `Released`                                 |
| **19:03** | Coord Console    | `dec_recapp_307`      | `dec_recommendation_approved`  | Coordinator approves safety dispatch.                                           | `Incident` $\rightarrow$ `HumanApproved`                                  |
| **19:03** | Smart Lock API   | `evt_lockgates_308`   | `evt_gate_locked`              | Adjacent perimeter doors locked automatically via API command.                  | `Gate` $\rightarrow$ `Closed`                                             |
| **19:04** | Task Dispatch    | `evt_tskdispatch_309` | `evt_tasks_dispatched`         | Tasks dispatched to security patrol and nearest monitoring volunteers.          | `Task` $\rightarrow$ `Assigned`<br>`Incident` $\rightarrow$ `Actioned`    |
| **19:05** | Volunteer App    | `evt_tskack_310`      | `evt_task_acknowledged`        | Volunteer `vol_steward_104` acknowledges monitoring task.                       | `Task` $\rightarrow$ `Acknowledged`                                       |
| **19:05** | Volunteer App    | `evt_tskstart_311`    | `evt_task_started`             | Volunteer begins sweep of eastern concourse exits.                              | `Task` $\rightarrow$ `InProgress`<br>`Volunteer` $\rightarrow$ `Busy`     |
| **19:12** | Patrol Team      | `evt_seccatch_312`    | `evt_observation_received`     | Security team reports trespassers located and escorted out of the venue.        | `Observation` $\rightarrow$ `Received`                                    |
| **19:15** | Volunteer App    | `evt_tskcomplete_313` | `evt_task_completed`           | Volunteer confirms concourse exits secured, no secondary breach signs.          | `Task` $\rightarrow$ `Completed`<br>`Volunteer` $\rightarrow$ `Available` |
| **19:16** | Incident Service | `evt_incresolve_314`  | `evt_incident_resolved`        | Incident resolves successfully.                                                 | `Incident` $\rightarrow$ `Resolved`                                       |
| **19:20** | Learning Service | `evt_learnlog_315`    | `evt_learning_logged`          | Intruders exit point telemetry and reaction logs updated to memory.             | `Incident` $\rightarrow$ `Learned`                                        |

---

## 2. Downstream Cascades and Invariant Audits

- **Security Lock Invariant**: Lock command `evt_lockgates_308` override was handled safely, restricting volunteer assignments to outside the immediate buffer zone to prevent placing volunteers in danger.
- **Causality Chain**: Intruder entry sensor trigger `evt_breach_301` drove the downstream smart locks execution without introducing human delay loops.
