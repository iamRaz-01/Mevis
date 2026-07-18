# MEVIS Development Workflow and Git Conventions

This document outlines the git workflow, branching strategy, commit message standards, and pull request review rules for the MEVIS project. These guidelines ensure a clean repository history, enable automated release notes, and establish a high-trust verification pipeline for both human engineers and AI coding agents.

All contributors **MUST** conform to these development guidelines.

---

## 1. Branching Strategy

MEVIS utilizes a structured, trunk-based branching model. The main branch is the sole production branch and **MUST** always remain stable.

### 1.1 Branch Classifications

All development branch names **MUST** begin with one of the following prefixes, followed by a forward slash (`/`) and a short, descriptive, kebab-case name:

| Prefix      | Description                                                 | Example                        |
| :---------- | :---------------------------------------------------------- | :----------------------------- |
| `feature/`  | Development of a new feature or capability                  | `feature/context-assembly`     |
| `bugfix/`   | Resolution of an identified bug or incident                 | `bugfix/policy-timeout`        |
| `docs/`     | Updates or additions to documentation                       | `docs/workflow-updates`        |
| `refactor/` | Code structure cleanups without logic changes               | `refactor/world-state-engine`  |
| `chore/`    | Maintenance tasks, library upgrades, tooling adjustments    | `chore/lint-setup`             |
| `agents/`   | Isolated branches used by AI agents for research/prototypes | `agents/ai-cognitive-loop-mvp` |

### 1.2 Branch Creation Rules

1.  **Issue Linkage**: Every development branch **SHOULD** reference the corresponding GitHub issue ID where applicable (e.g., `feature/issue-1-documentation-foundation`).
2.  **Trunk Alignment**: Short-lived branches are preferred. All branches **MUST** branch off `main` and merge back to `main` via pull requests.

---

## 2. Commit Message Conventions

MEVIS adopts the **Conventional Commits 1.0.0** specification. Structured commit messages are critical for automated changelogs and trace auditing.

### 2.1 Commit Message Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 2.2 Allowed Commit Types (`<type>`)

| Type       | Description                                                              |
| :--------- | :----------------------------------------------------------------------- |
| `feat`     | A new feature or capability (corresponds to a minor version bump)        |
| `fix`      | A bug fix or incident resolution (corresponds to a patch version bump)   |
| `docs`     | Documentation modifications                                              |
| `style`    | Changes that do not affect the meaning of the code (formatting, linting) |
| `refactor` | A code change that neither fixes a bug nor adds a feature                |
| `perf`     | A code change that improves execution performance or reduces latency     |
| `test`     | Adding missing tests or correcting existing test suites                  |
| `build`    | Changes that affect the build system or external dependencies            |
| `ci`       | Changes to CI/CD configurations, workflows, and test runners             |
| `chore`    | Other changes that don't modify src or test files                        |
| `revert`   | Reverts a previous commit                                                |

### 2.3 Scope (`<scope>`)

The scope is optional but highly recommended. It represents the specific codebase section or bounded context impacted (e.g., `feat(reasoning):`, `fix(gateway):`, `docs(standards):`).

### 2.4 Examples

- `feat(reasoning): implement trust scoring release gate`
- `docs(adr): add ADR-001 context assembly record`
- `fix(policy): resolve timeout in validation execution`

---

## 3. Pull Request (PR) Rules

All changes merged into `main` **MUST** pass through a Pull Request. Direct pushes to `main` are **PROHIBITED** (enforced by branch protection rules).

### 3.1 PR Title and Description

1.  **Title**: The PR title **MUST** follow the Conventional Commit format (e.g., `feat(standards): establish repo standards`).
2.  **PR Description**: The PR description **MUST** include:
    - **Objective**: What problem does this PR solve? Reference the issue ID (e.g., `Closes #1`).
    - **Summary of Changes**: Bullet points of changes made.
    - **Verification**: Proof of testing (command outputs, logs, unit test results).
    - **MEC Invariants Impact**: Clear statement indicating that all constitutional invariants are satisfied.

### 3.2 Required Verification Checks (CI/CD Gates)

Before a PR can be merged, the following automated checks **MUST** succeed:

1.  **Build**: The project builds successfully with zero compilation or syntax errors.
2.  **Lint**: Code passes all linting rules (zero errors or critical warnings).
3.  **Tests**: 100% of the automated test suite passes successfully.
4.  **Security**: Vulnerability scans and prompt-injection static analyses pass.

### 3.3 Merge Strategy

To maintain a clean, linear git history on `main`, all PRs **MUST** use **Squash and Merge**. This packs all commits in the PR branch into a single, clean commit on `main`.

---

## 4. Human-in-the-Loop Review Guidelines

In accordance with constitutional invariant **INV-002** (Human authority override), human review is an essential gate for safety-critical operations.

1.  **Code Approvals**: A Pull Request **MUST** receive approval from at least one human Lead Developer before merging if it affects core AI reasoning, safety policy engines, or database models.
2.  **AI Code Auditing**: AI coding agents **MAY** review and comment on PRs, checking for syntax, style, and standards compliance. However, an AI agent **MUST NOT** merge code changes autonomously without human authorization.

---

## 5. Branch Protection Recommendations

To preserve repository safety and code quality, the following rules **SHOULD** be configured in GitHub repository settings for the `main` branch:

1.  **Require a pull request before merging**: 
    *   Enable "Require approvals" (minimum of 1 approval from a human reviewer).
    *   Enable "Dismiss stale pull request approvals when new commits are pushed".
    *   Enable "Require review from Code Owners" (restricting core constitutional and spec folders as per `/CODEOWNERS`).
2.  **Require status checks to pass before merging**:
    *   Enable "Require branches to be up to date before merging".
    *   Add `Code Quality and Build Checks` as a required status check (defined in `.github/workflows/ci.yml`).
3.  **Require conversation resolution before merging**: All review comments and discussions **MUST** be marked resolved.
4.  **Block force pushes and branch deletions**: Prevent history rewriting or accidental loss of `main` history.

