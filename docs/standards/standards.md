# MEVIS Engineering Standards

This document establishes the coding, naming, repository, and documentation standards for the MEVIS platform. All contributors—both human software engineers and autonomous AI coding agents—**MUST** adhere strictly to these conventions.

These standards are designed to ensure consistency (`OBJ-001`), traceability (`OBJ-003`), and maintainability across the lifetime of the MEVIS platform, directly supporting the **[Product Vision](../product/Product%20Vision%20doc%20v1.0.md)** and the **[MEVIS Engineering Constitution (MEC)](../engineering/MEVIS%20Product%20Constitution.md)**.

---

## 1. Coding Standards

### 1.1 Architectural Modularity

1.  **Single Responsibility Principle (SRP)**: Every component, class, service, and function **MUST** have exactly one operational purpose. If a function performs multiple tasks (e.g., retrieving data and validating policies), it **MUST** be refactored.
2.  **Stateless Services**: Bounded context logic (e.g., AI Orchestrator, Context Engine, Policy Engine) **SHOULD** be stateless. State **MUST** be explicitly modeled in the World State Engine (`world_state_version`) and persisted in the Operational DB or Redis cache.
3.  **Dependency Inversion**: Services **MUST** depend on abstractions (interfaces/types) rather than concrete implementations. This ensures testability and enables seamless mock injections.

### 1.2 Type Safety

1.  **Strict Static Typing**: All implementation code **MUST** use strict type definitions (e.g., TypeScript in strict mode, Go, or Python with explicit type hinting enforced by linters like `mypy`).
2.  **No Dynamic/Implicit Types**: The use of implicit or dynamic types (`any` in TypeScript, raw untyped dictionaries in Python, `interface{}` in Go without explicit justification) is **PROHIBITED** in domain schemas and service interfaces.
3.  **Strict Schema Validation**: All input boundaries (API payloads, event payloads, database entries) **MUST** validate schemas at runtime (e.g., using `Zod` in TypeScript, `Pydantic` in Python).

### 1.3 Error Handling and Envelopes

1.  **Deterministic Error Capture**: Errors **MUST NOT** be swallowed silently. Exceptions **MUST** be caught, logged with trace context, and wrapped in standard error envelopes.
2.  **Structured Error Envelope**: All API error responses **MUST** conform to the structure defined in [Architecture Spec Section 8.1](../architecture/MEVIS%20Architecture%20Specification%20v1.0.md#81-external-api-style):
    ```json
    {
      "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error description",
        "trace_id": "trc_xyz123",
        "retryable": false
      }
    }
    ```
3.  **Safety-Critical Failures**: If a dependency (such as the Policy Engine or Trust Gate) is unavailable or fails, the calling service **MUST** default to a secure fail-closed state (e.g., block recommendation release for high-risk flows as mandated by `REQ-AI-019` / AI Spec).

### 1.4 Automated Testing Mandates

1.  **Unit Tests**: Every public function and business logic pathway **MUST** have corresponding unit tests.
2.  **Grounding & Verification Tests**: AI orchestration layers **MUST** have test cases validating that citations are correctly extracted and matched.
3.  **Regression Suites**: Code updates **MUST NOT** degrade baseline metrics. Build/CI pipelines **MUST** execute regression checks on the core cognitive loop stages.

---

## 2. Naming Conventions

Consistency in naming allows AI coding agents and human developers to navigate and search the codebase with high efficiency.

### 2.1 File and Directory Naming

1.  **Directories**: All directory names **MUST** use lowercase `kebab-case` (e.g., `src/context-engine/`, `tests/unit-tests/`).
2.  **Source Files**: Source files **MUST** use `kebab-case` matching their primary component (e.g., `context-manager.ts`, `policy-validator.py`).
3.  **Documentation Files**: Markdown files **MUST** use lowercase `kebab-case` (e.g., `git-workflow.md`), except for constitutional chapters (`MEC-CHXX.md`) or system-critical root files (e.g., `README.md`, `LICENSE.md`).

### 2.2 Code Symbols Naming

1.  **Classes & Types**: **MUST** use `PascalCase` (e.g., `WorldStateEngine`, `CanonicalContext`).
2.  **Interfaces**: **MUST** use `PascalCase` and clearly represent contract abstractions (e.g., `IEvidenceRetriever`, `IPolicyValidator`).
3.  **Functions & Methods**: **MUST** use `camelCase` and start with a verb (e.g., `assembleContext()`, `evaluatePolicy()`).
4.  **Variables & Properties**: **MUST** use `camelCase` (e.g., `worldStateVersion`, `incidentSeverity`).
5.  **Constants & Enums**: **MUST** use `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `SOP_CONFIDENCE_THRESHOLD`).

---

## 3. Repository Conventions

### 3.1 Repository Layout

All future microservices or modular monolith structures **MUST** follow this standardized top-level repository layout:

```text
/
├── docs/               # System documentation foundation
├── config/             # Environment, lint, and deployment configurations
├── src/                # Source code
│   ├── [bounded-context-1]/
│   └── [bounded-context-2]/
├── tests/              # Test suites
│   ├── unit/
│   ├── integration/
│   └── regression/
├── scripts/            # Helper scripts and automation utilities
├── README.md           # Project entrypoint
└── .gitignore          # Git exclusion rules
```

### 3.2 Configuration Files

1.  **No Hardcoded Secrets**: Secrets, credentials, keys, and tokens **MUST NOT** be checked into version control. Use `.env.example` to define required variables and inject them via secure environment managers or secrets managers.
2.  **Deterministic Dependency Lockfiles**: All dependency managers **MUST** commit lockfiles (e.g., `package-lock.json`, `poetry.lock`, `pnpm-lock.yaml`) to ensure deterministic builds.

---

## 4. Documentation Standards

### 4.1 Markdown Guidelines

1.  **Format**: All documentation **MUST** use standard GitHub Flavored Markdown (GFM).
2.  **Title Hierarchy**: A markdown file **MUST** contain exactly one H1 (`#`) element at the beginning. Subheadings **MUST** follow clean hierarchical nesting (H2 `##`, H3 `###`).
3.  **Clickable File Links**: Every document reference **MUST** utilize clickable relative markdown links (e.g., `[README](../README.md)` or `[MEC](../engineering/MEVIS%20Product%20Constitution.md)`). Avoid raw paths.
4.  **No Placeholders**: Never include empty placeholders or "TODO" sections in normative documents. All requirements **MUST** be complete.

### 4.2 Code Documentation and Comments

1.  **Docstrings**: All public API endpoints, classes, interfaces, and public functions **MUST** include descriptive docstrings detailing input arguments, return values, type assumptions, and thrown exceptions.
2.  **AI Prompts Documentation**: Files containing prompt templates or system instructions for LLMs **MUST** include inline comments documenting:
    - The model target
    - Expected input variables
    - Policy or safety filters applied
    - Evidence grounding mechanisms
3.  **Traceability Annotations**: Code implementing specific constitutional requirements **SHOULD** include inline comments referencing the requirement ID (e.g., `// Conforms to MEC REQ-AI-004`).
