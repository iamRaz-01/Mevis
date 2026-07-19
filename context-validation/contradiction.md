# Contradiction Detection Specification

Handles conflicting observations or duplicate reports from heterogeneous sources.

---

## 1. Contradiction Rules

- If GPS pings contradict manual coordinator updates, the engine MUST apply Trust Precedence Rules (Coordinator > Automated GPS).
- Unresolved conflicts MUST flag the context as `Requires Manual Review` and raise an alarm.
