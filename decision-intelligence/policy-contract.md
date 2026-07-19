# Policy Engine Contract Specification

This document defines the interface input and output schemas for the Policy Validation Gate.

---

## 1. Input Contract

- `context` (Object): Active stadium telemetry context.
- `proposed_actions` (Array of Tasks): Suggested instructions.
- `risk_profiles` (Object): safety and operational risk indexes.

## 2. Output Contract

- `status` (String): `PASSED`, `BLOCKED`, `ESCALATED`.
- `violating_rule_id` (String, Optional): Mapped invariant identifier.
- `remediation` (String, Optional): Advice for re-planning.
