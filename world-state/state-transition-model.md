# Live State Transition Specification

Defines live operational transition states, triggers, and lock rules.

---

## 1. Transition Lock States

To resolve simultaneous updates, transitions compile locking indicators:

- `Pending`: Transition request submitted, locking target entity.
- `Applied`: Mutation successful, lock released.
- `Rejected`: Invariant validation failed, transaction rejected.
- `Superseded`: Newer timestamp transaction arrived before completion; older update is dismissed.
