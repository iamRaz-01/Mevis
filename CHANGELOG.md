# Changelog

All notable changes to the MEVIS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-alpha.1] - 2026-07-18

This release establishes the core project specifications and initial repository workspace configurations under **Milestone 0 — Project Foundation**.

### Added

- **Documentation Foundation**:
  - Moved the MEVIS Engineering Constitution, Product Vision, Architecture, and AI Reasoning specifications to their structured directories under `/docs`.
  - Created the central documentation index (`docs/README.md`) mapping priorities 1 to 5.
  - Established the Architecture Decision Record (ADR) registry index and template.
  - Drafted coding standards (`docs/standards/standards.md`) and development workflows (`docs/development/workflow.md`).
- **Repository Engineering Foundation**:
  - Configured Node.js/npm workspaces for monorepo management.
  - Added `eslint.config.js`, `.prettierrc`, `.editorconfig`, and `tsconfig.json` configurations.
  - Created a TypeScript verification package `@mevis/core` under `packages/core/` with compiled unit tests.
  - Configured a GitHub Actions CI workflow skeleton (`.github/workflows/ci.yml`) triggering on pushes and pull requests.
  - Created repository metadata including `CONTRIBUTING.md`, `LICENSE`, `CODEOWNERS`, `SECURITY.md`, and this `CHANGELOG.md`.
  - Created issue and PR templates to standardize repository lifecycle communications.
