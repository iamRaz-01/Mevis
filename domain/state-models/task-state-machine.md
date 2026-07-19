# Task State Machine Specification

This document defines the canonical operational lifecycle and state transitions for the Task entity (`tsk_`).

---

## 1. Purpose

The purpose of the Task lifecycle is to trace the execution steps dispatched to volunteers to resolve an operational incident.

## 2. Business Meaning

A Task represents a discrete physical action instruction (e.g. "Deliver wheelchair to Gate B12", "Report crowd density at Gate A3").

## 3. Initial State

`Assigned`

## 4. Terminal States

- `Completed`
- `Failed`

## 5. State Definitions

- **Assigned**: The task is created and mapped to an active volunteer, but not yet acknowledged.
- **Acknowledged**: The volunteer sees the task on their mobile interface and acknowledges it.
- **InProgress**: The volunteer has physically started the task (e.g., transit to location begun).
- **Completed**: The volunteer has successfully finished the task, verified by location check-in or supervisor check.
- **Failed**: The task cannot be completed due to blockage, lack of materials, or volunteer unavailability.

## 6. Entry Conditions

- **Assigned**:
  - Target volunteer MUST be in `Available` state.
  - Incident MUST be in `HumanApproved` state.
- **InProgress**:
  - MUST be in `Acknowledged` state.

## 7. Exit Conditions

- **InProgress**:
  - MUST exit to `Completed` (upon positive verification) or `Failed` (if resolution is blocked).

## 8. Allowed Transitions

- `Assigned` $\rightarrow$ `Acknowledged`
- `Acknowledged` $\rightarrow$ `InProgress`
- `InProgress` $\rightarrow$ `Completed`
- `InProgress` $\rightarrow$ `Failed`
- `Assigned` $\rightarrow$ `Failed` (e.g. volunteer checks out before acknowledging).

## 9. Forbidden Transitions

- `Assigned` $\rightarrow$ `Completed` (cannot complete without starting).
- `Completed` $\rightarrow`InProgress` (completed tasks cannot be reopened).
- `Failed` $\rightarrow$ `Completed` (must re-assign as a new task ID).

## 10. Recovery Paths

- **Re-assignment Path**:
  - If a task transitions to `Failed`, the AI Orchestrator catches this failure and suggests reassignment to a different volunteer, creating a new `Task` entity instance.

## 11. Timeouts

- **Acknowledgment Timeout**: 3 minutes. If a volunteer does not acknowledge a task within 3 minutes of dispatch, the task is marked as `Failed` and reassigned.
- **Execution SLA Timeout**: Varies by task category (e.g. 10 minutes for equipment delivery).

## 12. Triggering Events

- `evt_task_assigned` $\rightarrow$ Moves to `Assigned`.
- `evt_task_acknowledged` $\rightarrow$ Moves to `Acknowledged`.
- `evt_task_started` $\rightarrow$ Moves to `InProgress`.
- `evt_task_completed` $\rightarrow$ Moves to `Completed`.
- `evt_task_failed` $\rightarrow$ Moves to `Failed`.

## 13. Required Permissions

- `Assigned` $\rightarrow$ `Failed`: Automated system timeout or Supervisor override.
- `InProgress` $\rightarrow$ `Completed`: Volunteer self-report, or Supervisor validation.

## 14. AI Decision Points

- **Auto-Failure Detection**: AI monitors volunteer telemetry (location drift, inactivity) to predict task stall or imminent failure, notifying supervisors.

## 15. Human Approval Points

- **Manual Task Cancellation**: A Supervisor can cancel and force-fail a task at any time.

## 16. Metrics

- `TaskExecutionTime`: Minutes from `InProgress` to `Completed`.
- `AckDelay`: Seconds from `Assigned` to `Acknowledged`.
- `SuccessRate`: Percentage of assigned tasks that reach `Completed`.
