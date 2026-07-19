# Volunteer State Machine Specification

This document defines the canonical operational lifecycle and state transitions for the Volunteer entity (`vol_`).

---

## 1. Purpose

The purpose of the Volunteer lifecycle is to track human resource readiness, scheduling state, and active task deployment throughout event operations.

## 2. Business Meaning

A Volunteer represents an active, trained operational unit positioned inside the stadium concourse, gates, or seating zones who is capable of performing tasks and reporting observations.

## 3. Initial State

`Registered`

## 4. Terminal States

`Inactive`

## 5. State Definitions

- **Registered**: The volunteer is onboarded into the database but has not yet been physically verified.
- **Verified**: Identity and credential checks are completed. Eligible for shift scheduling.
- **Checked-In**: The volunteer has scanned their event QR code at their designated check-in desk, starting their shift.
- **Available**: The volunteer is on duty, active, and waiting to receive a task dispatch.
- **Busy**: The volunteer is actively executing an assigned task.
- **Break**: The volunteer is resting and temporarily suspended from receiving tasks.
- **Checked-Out**: The volunteer has completed their shift and checked out of the stadium.
- **Inactive**: The volunteer is deactivated from the system due to security, administrative, or post-event reasons.

## 6. Entry Conditions

- **Available**:
  - MUST be in `Checked-In`, `Busy` (after task completion), or `Break` state.
  - Volunteer MUST have no active task assignments.
- **Busy**:
  - MUST be in `Available` state.
  - MUST have a valid `Task` entity dispatched and acknowledged.

## 7. Exit Conditions

- **Available**:
  - MUST exit to `Busy` (on task dispatch), `Break` (on supervisor consent), or `Checked-Out` (at end of shift).
- **Busy**:
  - MUST complete or fail the active task before returning to `Available`.

## 8. Allowed Transitions

- `Registered` $\rightarrow$ `Verified`
- `Verified` $\rightarrow$ `Checked-In`
- `Checked-In` $\rightarrow$ `Available`
- `Available` $\rightarrow$ `Busy`
- `Busy` $\rightarrow$ `Available`
- `Available` $\rightarrow$ `Break`
- `Break` $\rightarrow$ `Available`
- `Available` $\rightarrow$ `Checked-Out`
- `Checked-Out` $\rightarrow$ `Inactive`

## 9. Forbidden Transitions

- `Registered` $\rightarrow$ `Busy` (MUST check-in and verify first).
- `Checked-Out` $\rightarrow$ `Available` (MUST check-in for a new shift).
- `Busy` $\rightarrow$ `Break` (MUST complete or hand off active task first).

## 10. Recovery Paths

- **Connection Lost Loop**:
  - If a busy volunteer loses network connectivity, they enter a logical offline recovery loop (`Busy` $\rightarrow$ `ConnectionLost` $\rightarrow$ `Busy`). The system retains their task state until reconnection or supervisor manual override.

## 11. Timeouts

- **Break Timeout**: 45 minutes. If a volunteer remains in the `Break` state for over 45 minutes, a warning alert is sent to their Supervisor.
- **Stale Busy Timeout**: 60 minutes. If a volunteer is in `Busy` state for a task with an expected duration of 15 minutes, the system flags the task as stalled.

## 12. Triggering Events

- `evt_volunteer_registered` $\rightarrow$ Moves to `Registered`.
- `evt_volunteer_verified` $\rightarrow$ Moves to `Verified`.
- `evt_volunteer_checked_in` $\rightarrow$ Moves to `Checked-In`.
- `evt_task_assigned` $\rightarrow$ Moves to `Busy`.
- `evt_task_completed` or `evt_task_failed` $\rightarrow$ Moves to `Available`.
- `evt_break_started` $\rightarrow$ Moves to `Break`.
- `evt_break_ended` $\rightarrow$ Moves to `Available`.
- `evt_volunteer_checked_out` $\rightarrow$ Moves to `Checked-Out`.

## 13. Required Permissions

- `Registered` $\rightarrow$ `Verified`: Admin or Coordinator role only.
- `Available` $\rightarrow$ `Break`: Volunteer self-request, with Supervisor approval.
- `Available` $\rightarrow$ `Busy`: Dispatched by the system or Coordinator.

## 14. AI Decision Points

- **Task Matching Suggestion**: When a volunteer enters the `Available` state, the AI Orchestrator checks nearby incidents and suggests optimal next task allocations.

## 15. Human Approval Points

- **Shift Overrides**: A Supervisor MUST manually approve emergency check-out overrides if a volunteer has an uncompleted task.

## 16. Metrics

- `UtilizationRate`: Total minutes spent in `Busy` state divided by total shift duration.
- `TaskCount`: Number of tasks completed per shift.
- `AverageTaskDuration`: Mean execution time across completed tasks.
