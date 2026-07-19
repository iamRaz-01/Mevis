# Recommendation State Machine Specification

This document defines the canonical operational lifecycle and state transitions for the Recommendation entity (`rec_`).

---

## 1. Purpose

The purpose of the Recommendation lifecycle is to trace candidate action plans from draft synthesis through validation, presentation, human selection, and downstream outcome evaluation.

## 2. Business Meaning

A Recommendation represents a structured advice model containing suggested tasks, grounding evidence, and safety policy status, helping operators make informed decisions quickly.

## 3. Initial State

`Draft`

## 4. Terminal States

- `Accepted`
- `Rejected`

## 5. State Definitions

- **Draft**: The initial raw task sequence compiled by the AI Orchestrator.
- **Validating**: The recommendation is evaluated against the Policy Engine to check safety rules and constraints.
- **Ready**: Validation succeeded, and the recommendation is marked as safe.
- **Released**: The recommendation is visible to the target operator's console (Supervisor or Coordinator).
- **Accepted**: The human operator has approved and executed the proposed tasks.
- **Rejected**: The human operator has dismissed or overridden the recommendation.

## 6. Entry Conditions

- **Ready**:
  - MUST be in `Validating` state.
  - Policy Engine validation check MUST return `PASSED` status.
- **Released**:
  - MUST be in `Ready` state.
  - Confidence score MUST exceed the threshold configured for its incident classification.

## 7. Exit Conditions

- **Released**:
  - MUST transition to `Accepted` or `Rejected` based on the operator's response.

## 8. Allowed Transitions

- `Draft` $\rightarrow$ `Validating`
- `Validating` $\rightarrow$ `Ready`
- `Validating` $\rightarrow$ `Rejected` (if policy checks block the recommendation)
- `Ready` $\rightarrow$ `Released`
- `Released` $\rightarrow$ `Accepted`
- `Released` $\rightarrow$ `Rejected`

## 9. Forbidden Transitions

- `Draft` $\rightarrow$ `Released` (cannot display recommendations without validating policies first).
- `Accepted` $\rightarrow$ `Rejected` (immutable terminal states).
- `Rejected` $\rightarrow$ `Released` (rejected advice cannot be re-presented).

## 10. Recovery Paths

- **Policy Engine Timeout Fallback**:
  - If the Policy Engine does not respond within 3 seconds during the `Validating` state, the recommendation fails-closed and transitions directly to `Rejected`.

## 11. Timeouts

- **Decision SLA**: 5 minutes. If a released recommendation remains unacted upon for 5 minutes, it is marked as `Rejected` (Stale) and a notification is dispatched.

## 12. Triggering Events

- `evt_recommendation_generated` $\rightarrow$ Moves to `Draft`.
- `evt_policy_validation_started` $\rightarrow$ Moves to `Validating`.
- `evt_policy_passed` $\rightarrow$ Moves to `Ready`.
- `evt_policy_failed` $\rightarrow$ Moves to `Rejected`.
- `evt_recommendation_released` $\rightarrow$ Moves to `Released`.
- `dec_recommendation_approved` $\rightarrow$ Moves to `Accepted`.
- `dec_recommendation_rejected` or `dec_action_override` $\rightarrow$ Moves to `Rejected`.

## 13. Required Permissions

- `Validating` $\rightarrow$ `Ready`: Automated system Policy Engine only.
- `Released` $\rightarrow$ `Accepted`: Supervisor or Coordinator.

## 14. AI Decision Points

- **Confidence Score Calibration**: AI calculates a confidence estimate of the recommendation. If below the threshold (e.g. 80%), the recommendation is held back from auto-release.

## 15. Human Approval Points

- **Human Override**: Operators can reject the recommendation and substitute manual tasks. This triggers an override auditing log.

## 16. Metrics

- `RecommendationAcceptanceRate`: Percentage of released recommendations that transition to `Accepted`.
- `ValidationLatency`: Milliseconds spent in the `Validating` state.
- `OverrideRate`: Ratio of rejections accompanied by manual task creations.
