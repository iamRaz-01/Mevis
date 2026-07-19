# World Lookup Enrichment Specification

Enriches resolved entity profiles with the latest state metrics from the World State Engine.

---

## 1. Enrichment Targets

The pipeline MUST query active states for:

- Resolved responder status (e.g., `Available`, `Busy`).
- Target Zone coordinates and layout dimensions.
