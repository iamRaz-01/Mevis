# State Consistency Model

Defines rules to resolve logical contradictions inside the World State Engine.

---

## 1. Consistency Resolution Rules

- **Duplicate Location Conflicts**: If a volunteer is reported in two zones at once, the engine MUST apply Trust Score Precedence (CCTV verification > GPS ping) or retain only the newer timestamp location.
- **Orphan Task Assignments**: A task assigned to a non-existent volunteer or closed incident MUST transition to `UNASSIGNED` status and raise a supervisor alert.
