# MEVIS Engineering Documentation Foundation

Welcome to the documentation foundation for the Mega Event Volunteer Intelligence System (MEVIS). This directory serves as the **single source of truth** for both human engineers and AI coding agents.

All implementations, architectures, and operations MUST conform to the rules, definitions, and invariants established here.

---

## 1. Documentation Hierarchy and Precedence

Whenever a conflict or ambiguity arises between documents, the following order of precedence SHALL apply (from MEC Chapter 1 Section 5):

| Priority | Document Type                                                                               | Authority Description                     | Status / Target                                               |
| :------: | :------------------------------------------------------------------------------------------ | :---------------------------------------- | :------------------------------------------------------------ |
|  **1**   | **[MEVIS Engineering Constitution (MEC)](./engineering/MEVIS%20Product%20Constitution.md)** | Highest Engineering Authority (Normative) | Rules, invariants, definitions, and compliance criteria       |
|  **2**   | **[Product Vision Document](./product/Product%20Vision%20doc%20v1.0.md)**                   | Intent Authority (Philosophical)          | The "Why", stakeholders, user needs, and product boundaries   |
|  **3**   | **Product Requirements Documents (PRDs)**                                                   | Functional Authority (Requirements)       | Feature specifications, user stories, and acceptance criteria |
|  **4**   | **[Architecture Decision Records (ADRs)](./adr/README.md)**                                 | Architectural Authority (Decisions)       | Relational design records resolving technical open decisions  |
|  **5**   | **Implementation**                                                                          | Executable Authority (Code & Specs)       | Source code, tests, and active deployments                    |

Lower-priority documents/artifacts **SHALL NOT** contradict higher-priority documents.

---

## 2. Directory Structure and Index

The MEVIS documentation is organized into logical functional folders to make it modular and easily parseable by autonomous AI agents:

### 📄 Product

- **[Product Vision Document](./product/Product%20Vision%20doc%20v1.0.md)**: Defines the executive vision, primary stakeholders (Volunteers, Coordinators, Fans), and product differentiation.

### 📖 Domain Language

- **[Domain Glossary & Ubiquitous Language](./domain/glossary.md)**: Defines the canonical vocabulary, operational terminology standard, domain rules, and naming standards.

### 📐 Engineering & Architecture

- **[MEVIS Engineering Constitution (MEC)](./engineering/MEVIS%20Product%20Constitution.md)**: Chapter 1 defining the core constitutional authority and the Open Decisions Register (`OD-001` through `OD-008`).
- **[MEVIS Architecture Specification](./architecture/MEVIS%20Architecture%20Specification%20v1.0.md)**: Details logical bounded contexts, system context maps, database schema outlines, and the Incident State Machine.
- **[MEVIS AI Reasoning Specification](./reasoning/MEVIS%20AI%20Reasoning%20Specification%20v1.0.md)**: Details the 12-stage Canonical Cognitive Loop, world-state logic, retrieval pipelines, policy/trust release gates, and the decision graph schema.

### 📜 Decision Records (ADRs)

- **[ADR Registry (README.md)](./adr/README.md)**: Chronological index of all formal Architecture Decision Records.
- **[ADR Template](./adr/ADR_TEMPLATE.md)**: Standard template layout for proposing new architectural decisions.

### ⚙️ Standards and Development

- **[Engineering Standards](./standards/standards.md)**: Coding, naming, repository conventions, and documentation standards optimized for human-AI collaboration.
- **[Development Workflow](./development/workflow.md)**: Branching strategy, git workflow, pull request rules, and commit message conventions.

---

## 3. Governance and Updates

1.  **Constitutional Amendments**: Modifying the MEC requires a formal amendment process to ensure stability. No feature or ADR may override MEC invariants.
2.  **Architecture Decisions**: Resolving open decisions (e.g., `OD-001` through `OD-008`) or introducing new components must be documented via an ADR using the [ADR Template](./adr/ADR_TEMPLATE.md).
3.  **Requirements Integration**: Every PRD must formulate requirements using RFC 2119 standards and map back to Product Vision objectives.
