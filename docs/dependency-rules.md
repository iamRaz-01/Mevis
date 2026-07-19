# MEVIS Dependency Rules & Import Boundaries

Defines rules mapping imports boundaries between monorepo layers to prevent circular architectures.

---

## 1. Allowed Dependencies Graph

- **Apps (`apps/*`)**: Can reference **Services** and **Packages**.
- **Services (`services/*`)**: Can reference **Packages**.
- **Packages (`packages/*`)**: Can reference other packages only if lower in the dependency chain.

---

## 2. Forbidden Imports

- **Packages** MUST NOT import from `services/*` or `apps/*`.
- **Services** MUST NOT import from `apps/*`.
- Violation of these rules will fail CI verification checking.
