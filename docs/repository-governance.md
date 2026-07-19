# MEVIS Repository Governance Guidelines

This document outlines workspace regulations ensuring structural stability as the monorepo scales.

---

## 1. Naming Conventions

- **Packages**: MUST use scope prefix `@mevis/` (e.g. `@mevis/core`, `@mevis/logger`).
- **Services**: MUST use lowercase, dash-separated names (e.g. `services/context-service`).
- **Apps**: MUST use lowercase, dash-separated names (e.g. `apps/dashboard`).

---

## 2. Commit Conventions

We enforce Conventional Commits layout:

- `feat(...)`: New features.
- `fix(...)`: Corrections.
- `docs(...)`: Documentation changes.
- `refactor(...)`: Clean code updates.

---

## 3. Branching & PR Guidelines

- The `main` branch is protected.
- Feature branches MUST use `feature/<ticket-id>-<description>` prefix.
- PRs require successful CI pipeline status passing.
