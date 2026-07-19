# Context Specification — Decision Intelligence

This document defines the canonical specification for the Decision Intelligence Bounded Context.

---

## 1. Business Capability

Solves: Logical reasoning & Risk Assessment.

## 2. Ubiquitous Language Mappings

- Context Owner: Operations Group.
- Authoritative terms: Decision.

## 3. Responsibilities

- Encapsulates state changes and validations for owned entities.
- Enforces domain validation limits.

## 4. Owned Entities

- Decision

## 5. Owned Events

- evt_policy_validation_started

## 6. Owned Policies

- `pol_decision_intelligence_default_rules`

## 7. Public Commands

- `cmd_decision_intelligence_action`

## 8. Public Queries

- `qry_decision_intelligence_data`

## 9. Published Events

- evt_policy_validation_started

## 10. Consumed Events

- None

## 11. Integration Rules

- MUST use Anti-Corruption Layer when exposing internal models.

## 12. Dependencies

- Required upstream contexts: None.

## 13. Forbidden Responsibilities

- MUST NOT update entities owned by other contexts directly.

## 14. Non-Goals

- Does not handle technical connection issues or presentation.

## 15. Future Evolution

- Maturity: Supporting. Extraction: Eligible if load increases.
