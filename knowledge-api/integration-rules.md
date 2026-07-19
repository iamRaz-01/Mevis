# Integration Rules

Enforces boundary separation constraints.

---

## 1. Architecture Constraints

- Downstream systems MUST NOT query internal repositories or index clusters directly.
- All queries MUST traverse defined Query Contracts.
