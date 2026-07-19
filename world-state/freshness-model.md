# State Freshness Specification

Defines validity periods and decay metrics to prevent stale operational reasoning.

---

## 1. Freshness Policy Registry

The World State Engine MUST expire or flag states based on target parameters:

- **Volunteer GPS**: 30 seconds validity.
- **Crowd Density Telemetry**: 10 seconds validity.
- **Meteorological Weather Feed**: 5 minutes validity.
- **Active Medical Incidents**: Retained indefinitely until manually closed by Supervisor.
