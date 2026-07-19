# Context Specification — Recommendation Engine

This document defines the canonical specification for the Recommendation Engine Bounded Context.

---

## 1. Business Capability

Solves: Recommendation delivery & formatting.

## 2. Ubiquitous Language Mappings

- Context Owner: Operations Group.
- Authoritative terms: Recommendation, Approval.

## 3. Responsibilities

- Encapsulates state changes and validations for owned entities.
- Enforces domain validation limits.

## 4. Owned Entities

- Recommendation, Approval

## 5. Owned Events

- evt_recommendation_released

## 6. Owned Policies

- `pol_recommendation_engine_default_rules`

## 7. Public Commands

- `cmd_recommendation_engine_action`

## 8. Public Queries

- `qry_recommendation_engine_data`

## 9. Published Events

- evt_recommendation_released

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
