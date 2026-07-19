# Evidence Grading Model Specification

This document defines how evidence items are graded and weighted to prevent reasoning hallucination.

---

## 1. Evidence Attributes

Every evidence element in the RAG pipeline MUST include the following properties:

- `source_id` (String): Source identifier.
- `source_trust` (Float): Hardcoded trust score (0.0 to 1.0) based on category.
- `timestamp` (ISO-8601): Observation time.
- `freshness` (Float): Decay function of age.
- `reliability` (Float): Historical success tracking.

---

## 2. Source Trust Score Registry

- **Fixed CCTV Video Telemetry**: 0.95
- **Turnstile Sensors**: 0.92
- **Meteorological Authority API**: 0.90
- **Active Volunteer App GPS**: 0.85
- **Supervisor Manual Check-In**: 0.80
- **Volunteer Text Report**: 0.70
- **Unverified Fan Social Feed**: 0.30
