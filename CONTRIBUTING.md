# Contributing to MEVIS

Welcome to the Mega Event Volunteer Intelligence System (MEVIS) repository! We are excited to build this Cognitive Operations Platform together.

This repository is developed by both human developers and autonomous AI coding agents. To maintain consistency and safety, all contributors **MUST** follow these contributing guidelines.

---

## 1. Getting Started

### 1.1 Prerequisites

- **Node.js**: Version 24 or newer.
- **npm**: Version 11 or newer.
- **Git**: Checked out and configured locally.

### 1.2 Local Setup

1.  Clone the repository and navigate to the root directory.
2.  Install dependencies at the root workspace:
    ```bash
    npm install
    ```
3.  Verify the local verification package runs successfully:
    ```bash
    npm run typecheck
    npm test
    npm run lint
    ```

---

## 2. Directory Structure and Scope

We follow a strict monorepo layout:

- `/apps`: User interfaces (Volunteers & Ops dashboards).
- `/services`: Core backend microservices.
- `/packages`: Shared modules (e.g., `@mevis/core`).
- `/docs`: System architecture and constitutional specifications.
- `/prompts`: Versioned LLM instruction templates.
- `/knowledge`: Domain manuals, grounding data, and SOP reference files.

Please review the **[Repository Directory Map](./README.md#-repository-directory-map)** for details.

---

## 3. Development and Code Standards

### 3.1 Code Style and Naming

All source files, variables, classes, and comments **MUST** adhere to the **[MEVIS Engineering Standards](./docs/standards/standards.md)**:

- Use `camelCase` for functions and variables.
- Use `PascalCase` for classes and types.
- Ensure strict typing is enabled (no implicit `any` allowed).

### 3.2 Documentation and Code Verification

- Keep comments up to date.
- Write unit tests for all business logic and helper functions.
- Never commit code that fails local compiling, formatting, or linting.

---

## 4. Git and Commit Conventions

We enforce Conventional Commits and trunk-based development.

### 4.1 Branching Strategy

- Prefix your branches with `feature/`, `bugfix/`, `docs/`, `refactor/`, `chore/`, or `agents/`.
- Include the issue number in the branch name if applicable.
- See the **[Git Branching Strategy](./docs/development/workflow.md#1-branching-strategy)** for details.

### 4.2 Commit Messages

Commits **MUST** use the Conventional Commits 1.0.0 format:

```text
feat(reasoning): add decision graph node verification
fix(policy): resolve memory leak in validator loop
```

See the **[Commit Message Conventions](./docs/development/workflow.md#2-commit-message-conventions)** for formatting scope and types list.

### 4.3 Pull Request Protocol

1.  Open a PR with a description detailing the objective, changes, and testing evidence.
2.  Complete the **MEC Invariant Checklist** in the PR template to confirm safety compliance.
3.  Ensure all CI pipelines (format, lint, compile, unit test, build check) pass.
4.  All PRs are merged via **Squash and Merge** to maintain a linear history.
5.  See the **[Pull Request Rules](./docs/development/workflow.md#3-pull-request-pr-rules)**.

---

## 5. Security

Do not commit API credentials, certificates, database connection strings, or personal data. Report security vulnerabilities following the steps in **[SECURITY.md](./SECURITY.md)**.
