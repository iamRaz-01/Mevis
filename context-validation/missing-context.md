# Missing Context Handling

Defines dynamic degradation rules when required parameters are missing.

---

## 1. Recoverable vs. Critical Gaps

- **Recoverable Gaps**: Missing battery metrics or shift history. Resolves to default values.
- **Critical Omissions**: Missing active incident coordinates or policy maps. Context is marked `Invalid`.
