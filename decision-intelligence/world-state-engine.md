# World State Engine Specification

This specification defines the logical structure and tracking model for the live **stadium world state**.

---

## 1. World State Schema

The World State is the in-memory consolidation of the stadium at time $T$. It is structured as follows:

- **Venue**: Live gates access states, capacity occupancy rates, elevator statuses.
- **Zones**: Active seating blocks, spectator congestion densities.
- **Gates**: Ingress/egress passenger entry flows, scanning speed alerts.
- **Volunteers**: Active check-in profiles, physical locations, check-in shift status.
- **Incidents**: Tracked incident lifecycles, locations, assigned paramedics.
- **Weather**: Meteorological telemetry, rain probability indicators.
- **Resources**: Available medical kits, transport shuttles, safety equipment.
- **Knowledge**: Citations, retrieved SOP guidelines.
- **Recommendations**: Dispatched tasks, active and historical.

---

## 2. In-Memory Engine Update Cycle

Every new observation parsed MUST invoke context assembly to compute delta modifications to the World State.
