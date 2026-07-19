# Context Ownership Specification

Defines context owners and validation authorities across the MEVIS platform.

---

## 1. Context Ownership Registry

Every context type is owned and validated by exactly one logical bounded context:

- **Incident Context**: Owned by `Incident Management` context.
- **Volunteer Context**: Owned by `Volunteer Management` context.
- **Medical Operations Context**: Jointly coordinated, but validated by `Incident Management`.
