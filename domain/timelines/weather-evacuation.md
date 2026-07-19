# Operational Timeline — Severe Weather Evacuation Scenario

This document defines the chronological event sequence, state transitions, and interaction chains during a stadium severe weather evacuation.

---

## 1. Timeline Sequence

| Time      | Source / Actor     | Event ID              | Event Type                     | Description                                                                           | State Transitions triggered                                               |
| :-------- | :----------------- | :-------------------- | :----------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **20:00** | Meteorological API | `evt_weather_401`     | `evt_lightning_detected`       | Heavy lightning warning detected within 5km radius of the stadium.                    | `Incident` $\rightarrow$ `Detected`                                       |
| **20:01** | AI Engine          | `evt_incassess_402`   | `evt_incident_assessed`        | Incident registers as `SEVERE_WEATHER`, severity `CRITICAL`.                          | `Incident` $\rightarrow$ `Assessed`                                       |
| **20:01** | AI Engine          | `evt_ctxcreate_403`   | `evt_context_assembled`        | Context compiles referencing `SOP-01` (Stadium Evacuation and Sheltering).            | `Context` $\rightarrow$ `Assembled`                                       |
| **20:02** | AI Engine          | `evt_recgen_404`      | `evt_recommendation_generated` | Recommends shelter-in-place concourse routing, opening gates, and volunteer dispatch. | `Recommendation` $\rightarrow$ `Draft`                                    |
| **20:02** | Policy Engine      | `evt_polpass_405`     | `evt_policy_passed`            | Policy check passes (validated against stadium shelter limits).                       | `Recommendation` $\rightarrow$ `Ready`                                    |
| **20:02** | Trust Gate         | `evt_recrelease_406`  | `evt_recommendation_released`  | Recommendation displayed on Coordinator station console.                              | `Recommendation` $\rightarrow$ `Released`                                 |
| **20:03** | Coord Console      | `dec_recapp_407`      | `dec_recommendation_approved`  | Coordinator approves partial evacuation/shelter routing.                              | `Incident` $\rightarrow$ `HumanApproved`                                  |
| **20:03** | Turnstile API      | `evt_openall_408`     | `evt_gate_open_override`       | All gates set to open override mode to speed evacuation flow.                         | `Gate` $\rightarrow$ `Open`                                               |
| **20:04** | Task Dispatch      | `evt_tskdispatch_409` | `evt_tasks_dispatched`         | Evacuation guidance tasks dispatched to all active concourse volunteers.              | `Task` $\rightarrow$ `Assigned`<br>`Incident` $\rightarrow$ `Actioned`    |
| **20:05** | Volunteer App      | `evt_tskack_410`      | `evt_task_acknowledged`        | Volunteer `vol_steward_104` acknowledges task.                                        | `Task` $\rightarrow$ `Acknowledged`                                       |
| **20:05** | Volunteer App      | `evt_tskstart_411`    | `evt_task_started`             | Volunteer begins guiding spectators to inner shelter concourses.                      | `Task` $\rightarrow$ `InProgress`<br>`Volunteer` $\rightarrow$ `Busy`     |
| **20:30** | CV Cameras         | `evt_shelterok_412`   | `evt_crowd_flow_stabilized`    | Density normalizes, spectators successfully moved to indoor zones.                    | None                                                                      |
| **20:35** | Volunteer App      | `evt_tskcomplete_413` | `evt_task_completed`           | Volunteer reports concourse seating zones completely clear.                           | `Task` $\rightarrow$ `Completed`<br>`Volunteer` $\rightarrow$ `Available` |
| **20:36** | Incident Service   | `evt_incresolve_414`  | `evt_incident_resolved`        | Incident resolves successfully.                                                       | `Incident` $\rightarrow$ `Resolved`                                       |
| **20:40** | Learning Service   | `evt_learnlog_415`    | `evt_learning_logged`          | Total evacuation durations and flow metrics logged to memory buffer.                  | `Incident` $\rightarrow$ `Learned`                                        |

---

## 2. Downstream Cascades and Invariant Audits

- **Emergency Authority Invariant**: Evacuation recommendations require Coordinator approval (`dec_recapp_407`), ensuring strict adherence to the safety gate rules defined in `REQ-DOM-INV-002`.
- **Gate Operations Override**: Turnstile controllers set all doors to `Open` override (`evt_openall_408`), changing all Gate entities to open states immediately.
