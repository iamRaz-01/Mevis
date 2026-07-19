# Digital Twin Boundaries Specification

Defines what data is inside vs. outside the responsibility of the MEVIS Digital Twin.

---

## 1. Boundary Registry

### 1.1 Inside the Digital Twin

- ✔ Live active volunteer coordinates.
- ✔ Current triaged operational incidents.
- ✔ Live gate access control lock states.
- ✔ Active medical kit locations.
- ✔ Live stadium weather observations.

### 1.2 Outside the Digital Twin

- ✖ Ticket sales transactions (managed by Ticketing Context).
- ✖ Long-term payroll/HR data (managed by HR database).
- ✖ Multi-terabyte CCTV raw video storage files.
- ✖ Off-site municipal road traffic reports.
