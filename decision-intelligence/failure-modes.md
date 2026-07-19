# Failure Modes Specification

This document defines system behaviors when context or evidence is missing or corrupted.

---

## 1. Context Starvation

- _Detection_: Critical telemetry fields (like active volunteer locations) are null or stale.
- _Action_: System MUST degrade to manual override mode, label confidence as LOW, and ask operators for information.

## 2. Policy Conflict

- _Detection_: Two policies output contradictory results (e.g. evacuation requires opening gates, but security lockdown requires locking gates).
- _Action_: Fail-closed. Immediately halt autonomous dispatch, escalate to Coordinator, and trigger manual override.
