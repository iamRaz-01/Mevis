# Operational Timeline — Lost Child Scenario

This document defines the chronological event sequence, state transitions, and interaction chains during a stadium lost child incident.

---

## 1. Timeline Sequence

| Time      | Source / Actor   | Event ID              | Event Type                     | Description                                                                  | State Transitions triggered                                               |
| :-------- | :--------------- | :-------------------- | :----------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **16:10** | Volunteer App    | `evt_increport_201`   | `evt_incident_reported`        | Volunteer `vol_steward_104` reports parent requesting help finding child.    | `Incident` $\rightarrow$ `Detected`                                       |
| **16:11** | AI Engine        | `evt_incassess_202`   | `evt_incident_assessed`        | System registers incident classification as `LOST_CHILD`, severity `HIGH`.   | `Incident` $\rightarrow$ `Assessed`                                       |
| **16:11** | AI Engine        | `evt_ctxcreate_203`   | `evt_context_assembled`        | Context compiles referencing `SOP-09` (Missing Person search protocol).      | `Context` $\rightarrow$ `Assembled`                                       |
| **16:12** | AI Engine        | `evt_recgen_204`      | `evt_recommendation_generated` | Suggests securing gates in Zone North, pushing description to volunteers.    | `Recommendation` $\rightarrow$ `Draft`                                    |
| **16:12** | Policy Engine    | `evt_polpass_205`     | `evt_policy_passed`            | Policy check passes (validated against privacy and security rules).          | `Recommendation` $\rightarrow$ `Ready`                                    |
| **16:12** | Trust Gate       | `evt_recrelease_206`  | `evt_recommendation_released`  | Recommendation displayed on Supervisor console.                              | `Recommendation` $\rightarrow$ `Released`                                 |
| **16:13** | Supervisor App   | `dec_recapp_207`      | `dec_recommendation_approved`  | Supervisor `sup_zone_north` approves search deployment.                      | `Incident` $\rightarrow$ `HumanApproved`                                  |
| **16:13** | Task Dispatch    | `evt_tskdispatch_208` | `evt_tasks_dispatched`         | Tasks dispatched to Volunteer `vol_steward_104` (Support parent) and others. | `Task` $\rightarrow$ `Assigned`<br>`Incident` $\rightarrow$ `Actioned`    |
| **16:14** | Volunteer App    | `evt_tskack_209`      | `evt_task_acknowledged`        | Volunteer `vol_steward_104` acknowledges task.                               | `Task` $\rightarrow$ `Acknowledged`                                       |
| **16:14** | Volunteer App    | `evt_tskstart_210`    | `evt_task_started`             | Volunteer begins staying with parent, obtaining photo/description details.   | `Task` $\rightarrow$ `InProgress`<br>`Volunteer` $\rightarrow$ `Busy`     |
| **16:15** | Communication    | `evt_broadcast_211`   | `evt_broadcast_sent`           | Coordinator broadcasts child photo/description to all active volunteers.     | None                                                                      |
| **16:21** | Volunteer App    | `evt_childfound_212`  | `evt_observation_received`     | Volunteer `vol_steward_108` reports matching child located at Gate C12.      | `Observation` $\rightarrow$ `Received`                                    |
| **16:22** | Supervisor App   | `dec_reunite_213`     | `dec_action_override`          | Supervisor coordinates volunteer handoff to reunite parent and child.        | `Incident` $\rightarrow$ `Actioned`                                       |
| **16:28** | Volunteer App    | `evt_tskcomplete_214` | `evt_task_completed`           | Volunteer `vol_steward_104` confirms parent and child reunited.              | `Task` $\rightarrow$ `Completed`<br>`Volunteer` $\rightarrow$ `Available` |
| **16:29** | Incident Service | `evt_incresolve_215`  | `evt_incident_resolved`        | Incident resolves successfully.                                              | `Incident` $\rightarrow$ `Resolved`                                       |
| **16:32** | Learning Service | `evt_learnlog_216`    | `evt_learning_logged`          | Log search duration, match confidence, and details for post-event.           | `Incident` $\rightarrow$ `Learned`                                        |

---

## 2. Downstream Cascades and Invariant Audits

- **Privacy Invariant**: Photo and personal descriptions are flagged as restricted, and their cached memory entries on mobile devices are automatically purged upon the `evt_incident_resolved` event.
- **Causality Chain**: The broadcast event (`evt_broadcast_211`) directly triggered the second observation (`evt_childfound_212`) by enabling search awareness.
