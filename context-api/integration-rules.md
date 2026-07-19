# Integration & Anti-Corruption Rules

Rules preserving bounded context boundaries.

---

## 1. Constraints

- Consumers MUST NOT bypass the Context Layer to query World State Engine directly.
- All context payloads MUST complete validation before delivery.
