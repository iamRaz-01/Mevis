# MEVIS Shared Kernel Specification

This document defines the core concepts shared across all contexts.

---

## 1. Shared Kernel Core Fields

The following entities and fields are shared as published language:

- `venue_id`: Static stadium reference.
- `user_id`: Cross-context identity reference.
- `timestamp`: Universal ISO-8601 timeline parameter.

These fields are immutable and MUST use identical formats in all context API schemas.
