# Incident State Machine Specification

This document defines the canonical operational lifecycle and state transitions for the Incident entity (`inc_`).

---

## 1. Purpose

The purpose of the Incident lifecycle is to drive any operational disruption, medical emergency, security threat, or crowd surge from discovery through mitigation and learning.

## 2. Business Meaning

An Incident represents a verified problem occurring in a specific zone or gate of the stadium that requires resource mobilization and SOP execution.

## 3. Initial State

`Detected`

## 4. Terminal States

`Learned`

## 5. State Definitions

- **Detected**: An observation report indicates a potential problem. It is logged but not yet triaged.
- **Assessed**: Incident severity (LOW, MEDIUM, HIGH, CRITICAL) and classification are verified by a human operator or automated triage.
- **RecommendationReady**: The AI Orchestrator has assembled the Context and compiled an actionable Recommendation.
- **HumanApproved**: A human Supervisor or Coordinator has reviewed and approved the Recommendation.
- **HumanRejected**: An operator has rejected the recommendation, requiring context re-evaluation.
- **Actioned**: Associated tasks have been generated and dispatched to volunteers.
- **Resolved**: Mitigation tasks are successfully completed, and the physical threat or issue is eliminated.
- **Learned**: Operational post-mortem feedback is recorded in the long-term memory buffer.

## 6. Entry Conditions

- **RecommendationReady**:
  - MUST be in `Assessed` or `HumanRejected` state.
  - A valid RAG context MUST be compiled.
- **Actioned**:
  - MUST be in `HumanApproved` state.
  - At least one valid `Task` entity MUST be generated.

## 7. Exit Conditions

- **Assessed**:
  - MUST exit to `RecommendationReady` once context is successfully generated.
- **Resolved**:
  - MUST exit to `Learned` once the post-incident survey is compiled.

## 8. Allowed Transitions

- `Detected` $\rightarrow$ `Assessed`
- `Assessed` $\rightarrow$ `RecommendationReady`
- `RecommendationReady` $\rightarrow$ `HumanApproved`
- `RecommendationReady` $\rightarrow$ `HumanRejected`
- `HumanApproved` $\rightarrow$ `Actioned`
- `HumanRejected` $\rightarrow$ `Assessed`
- `Actioned` $\rightarrow$ `Resolved`
- `Resolved` $\rightarrow$ `Learned`

## 9. Forbidden Transitions

- `Detected` $\rightarrow$ `Resolved` (cannot skip assessment and actions).
- `Actioned` $\rightarrow$ `RecommendationReady` (cannot regenerate recommendations while tasks are active in the field).
- `Resolved` $\rightarrow$ `Assessed` (cannot reopen a resolved incident; a new incident must be created instead).

## 10. Recovery Paths

- **Re-dispatch Loop**:
  - If dispatched tasks fail (`Task` state becomes `Failed`), the Incident falls back from `Actioned` $\rightarrow$ `Assessed` to allow re-recommendation or manual dispatch.

## 11. Timeouts

- **Triage SLA Timeout**: If a detected incident is not assessed within 5 minutes, it escalates to high priority.
- **Stale Action SLA Timeout**: If an incident is `Actioned` for over 30 minutes without task completions, it triggers a coordinator alert.

## 12. Triggering Events

- `evt_incident_detected` $\rightarrow$ Moves to `Detected`.
- `evt_incident_assessed` $\rightarrow$ Moves to `Assessed`.
- `evt_recommendation_generated` $\rightarrow$ Moves to `RecommendationReady`.
- `evt_recommendation_approved` $\rightarrow$ Moves to `HumanApproved`.
- `evt_recommendation_rejected` $\rightarrow$ Moves to `HumanRejected`.
- `evt_tasks_dispatched` $\rightarrow$ Moves to `Actioned`.
- `evt_incident_resolved` $\rightarrow$ Moves to `Resolved`.
- `evt_learning_logged` $\rightarrow$ Moves to `Learned`.

## 13. Required Permissions

- `RecommendationReady` $\rightarrow$ `HumanApproved`: Supervisor or Coordinator.
- `Assessed` $\rightarrow$ `RecommendationReady`: Automated AI orchestrator or Coordinator.

## 14. AI Decision Points

- **Classification & Severity Estimation**: The AI triage classifier processes incoming observations to automatically suggest the incident's class and severity.
- **Recommendation Synthesis**: AI engine drafts the optimal task sequences based on historical matching of active SOPs.

## 15. Human Approval Points

- **Evacuation Approval**: If classification is `SEVERE_WEATHER` or `CROWD_SURGE` requiring evacuation, a Coordinator MUST issue the approval.

## 16. Metrics

- `TimeToTriage`: Minutes from `Detected` to `Assessed`.
- `TimeToResolution`: Minutes from `Detected` to `Resolved`.
- `SlaCompliance`: Percentage of incidents resolved within the standard class SLA timeline.
