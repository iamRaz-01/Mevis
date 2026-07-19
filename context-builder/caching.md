# Context Caching & Reuse Specification

Defines reuse and invalidation triggers to optimize processing.

---

## 1. Caching Invalidation rules

Contexts for specific decisions can be cached unless:

- An update delta is received for any contained entity (e.g. Volunteer relocates).
- Active incident severity changes.
