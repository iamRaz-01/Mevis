# Digital Twin Architecture Specification

This document defines the conceptual architecture of the MEVIS stadium **Digital Twin**.

---

## 1. Physical vs. Digital Synchronization

The Digital Twin is the authoritative in-memory representation of physical reality at Lusail Stadium.

- **Ingestion Feed**: Incoming observation events update the active state variables.
- **State Alignment**: Delays MUST remain under 5 seconds to support time-critical safety dispatches.
- **Decoupled Consumers**: Downstream planner and risk assessor AI agents read only from the Digital Twin, not from raw telemetry pings.
