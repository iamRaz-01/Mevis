# MEVIS Authoritative Ownership Registry

This matrix lists the single bounded context owner for each entity, event, and policy.

---

## 1. Entity and Event Ownership Matrix

| Bounded Context    | Owned Entities                    | Owned Events                    | Owned Decisions / Policies |
| :----------------- | :-------------------------------- | :------------------------------ | :------------------------- |
| **Volunteer Mgmt** | `Volunteer`, `Shift`              | `evt_volunteer_checked_in`      | `dec_shift_checkin`        |
| **Incident Mgmt**  | `Incident`, `Task`, `Observation` | `evt_incident_detected`         | `dec_incident_triaged`     |
| **Knowledge Mgmt** | `SOP`, `Evidence`                 | None                            | None                       |
| **Context Intel**  | `Context`                         | `evt_context_assembled`         | None                       |
| **Decision Intel** | `Decision`                        | `evt_policy_validation_started` | `pol_safety_sop_lock`      |
| **Recommendation** | `Recommendation`, `Approval`      | `evt_recommendation_released`   | `dec_rec_approval`         |
| **Notification**   | `Notification`                    | `evt_alert_delivered`           | None                       |
