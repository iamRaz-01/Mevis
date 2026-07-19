# Context Specification — Volunteer Management

This document defines the canonical specification for the Volunteer Management Bounded Context.

---

## 1. Business Capability

Solves: Volunteer Profiles & Shift Rosters.

## 2. Ubiquitous Language Mappings

- Context Owner: Operations Group.
- Authoritative terms: Volunteer, Shift.

## 3. Responsibilities

- Encapsulates state changes and validations for owned entities.
- Enforces domain validation limits.

## 4. Owned Entities

- Volunteer, Shift

## 5. Owned Events

- evt_volunteer_checked_in

## 6. Owned Policies

- `pol_volunteer_management_default_rules`

## 7. Public Commands

- `cmd_volunteer_management_action`

## 8. Public Queries

- `qry_volunteer_management_data`

## 9. Published Events

- evt_volunteer_checked_in

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
