# Contradiction Detection Specification

Detects conflicting instructions.

---

## 1. Conflicting Guidelines Flags

- If two active playbooks declare contradictory evacuation gates targets, the engine MUST raise an `UnresolvedContradiction` exception.
