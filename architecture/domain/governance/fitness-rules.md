# MEVIS Architectural Fitness Rules

This specification establishes rules to assert modular integrity in the repository.

---

## 1. Fitness Rules

1.  **Acyclic Dependency Rule**: No circular dependency loops (Context A $
ightarrow$ Context B $
ightarrow$ Context A) are allowed.
2.  **Encapsulation Rule**: Contexts MUST hide internal database schemas; external queries MUST go through ACL or contract interfaces.
3.  **Stability Rule**: Changing a public contract requires minor version increments.
