# Operational Timeline — Medical Emergency Scenario

This document defines the chronological event sequence, state transitions, and interaction chains during a stadium spectator medical emergency.

---

## 1. Timeline Sequence

| Time      | Source / Actor      | Event ID              | Event Type                     | Description                                                                       | State Transitions triggered                                               |
| :-------- | :------------------ | :-------------------- | :----------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **09:41** | Volunteer App       | `evt_increport_001`   | `evt_incident_reported`        | Volunteer `vol_steward_104` reports spectator collapsed at Gate B12.              | `Incident` $\rightarrow$ `Detected`                                       |
| **09:42** | AI Engine           | `evt_incassess_002`   | `evt_incident_assessed`        | System registers incident classification as `MEDICAL_EMERGENCY`, severity `HIGH`. | `Incident` $\rightarrow$ `Assessed`                                       |
| **09:42** | AI Engine           | `evt_ctxcreate_003`   | `evt_context_assembled`        | RAG Context compiles referencing `SOP-14` (First Aid triage protocols).           | `Context` $\rightarrow$ `Assembled`                                       |
| **09:43** | AI Engine           | `evt_recgen_004`      | `evt_recommendation_generated` | Suggests dispatching nearest medical team and volunteer support.                  | `Recommendation` $\rightarrow$ `Draft`                                    |
| **09:43** | Policy Engine       | `evt_polpass_005`     | `evt_policy_passed`            | Policy check passes (validated against safety override protocols).                | `Recommendation` $\rightarrow$ `Ready`                                    |
| **09:43** | Trust Gate          | `evt_recrelease_006`  | `evt_recommendation_released`  | Recommendation displayed on Supervisor console.                                   | `Recommendation` $\rightarrow$ `Released`                                 |
| **09:44** | Supervisor App      | `dec_recapp_007`      | `dec_recommendation_approved`  | Supervisor `sup_zone_north` approves recommendation to dispatch.                  | `Incident` $\rightarrow$ `HumanApproved`                                  |
| **09:44** | Task Dispatch       | `evt_tskdispatch_008` | `evt_tasks_dispatched`         | Tasks dispatched to Volunteer `vol_steward_104` (Support) and Medical Team.       | `Task` $\rightarrow$ `Assigned`<br>`Incident` $\rightarrow$ `Actioned`    |
| **09:45** | Volunteer App       | `evt_tskack_009`      | `evt_task_acknowledged`        | Volunteer acknowledges target dispatch instructions on client device.             | `Task` $\rightarrow$ `Acknowledged`                                       |
| **09:45** | Volunteer App       | `evt_tskstart_010`    | `evt_task_started`             | Volunteer begins transit to the incident scene.                                   | `Task` $\rightarrow$ `InProgress`<br>`Volunteer` $\rightarrow$ `Busy`     |
| **09:48** | Medical Sensor      | `evt_medarrive_011`   | `evt_patient_stabilized`       | Medical team arrives, stabilizes, and treats patient.                             | `Task` $\rightarrow$ `InProgress`                                         |
| **09:55** | Coordinator Console | `dec_transreq_012`    | `dec_action_override`          | Coordinator requests ambulance shuttle transport to Gate B12 exit.                | `Incident` $\rightarrow$ `Actioned`                                       |
| **10:03** | Volunteer App       | `evt_tskcomplete_013` | `evt_task_completed`           | Volunteer confirms scene cleared and ambulance departed.                          | `Task` $\rightarrow$ `Completed`<br>`Volunteer` $\rightarrow$ `Available` |
| **10:04** | Incident Service    | `evt_incresolve_014`  | `evt_incident_resolved`        | Incident resolves since all tasks are completed.                                  | `Incident` $\rightarrow$ `Resolved`                                       |
| **10:07** | Learning Service    | `evt_learnlog_015`    | `evt_learning_logged`          | Post-incident feedback recorded to stadium memory feed.                           | `Incident` $\rightarrow$ `Learned`                                        |

---

## 2. Downstream Cascades and Invariant Audits

- **Command Invariant Audit**: Since the severity was `HIGH`, the transition of `Incident` from `RecommendationReady` $\rightarrow$ `HumanApproved` strictly required Supervisor approval (`dec_recapp_007`). No tasks were auto-dispatched, satisfying `REQ-DOM-INV-003`.
- **Resource Dependency**: Volunteer `vol_steward_104` was held in the `Busy` state for 18 minutes, preventing any parallel task collisions (`REQ-DOM-INV-006`).
