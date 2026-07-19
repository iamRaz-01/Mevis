# Freshness Validation Specification

Defines TTL thresholds and staleness handling protocols.

---

## 1. Expiration Rules

- **Stale Telemetry Degradation**: If volunteer coordinates age exceeds 40 seconds, the validation status MUST transition to `Stale`, reducing confidence by 30%.
