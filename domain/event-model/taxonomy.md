# MEVIS Event Taxonomy

This document describes the canonical event taxonomy of the Mega Event Volunteer Intelligence System (MEVIS). In MEVIS, events represent immutable historical facts that capture the evolution of the stadium's operational state over time.

---

## 1. Event Classification Schema

Every event belongs to one of nine functional namespaces:

1.  **Volunteer**: Scheduling, presence, and availability.
2.  **Incident**: Progression from detection through assessment, action, and post-resolution analysis.
3.  **Medical**: Patient symptoms, triage, stabilizes, and medical resource dispatches.
4.  **Security**: Access breaches, crowd surges, alerts.
5.  **Infrastructure**: Telemetry status of cameras, locks, display panels.
6.  **Weather**: Climatic warnings and stadium sensor warnings.
7.  **Communication**: Supervisor text broadcasts, voice checks.
8.  **Transport**: Bus updates, shuttle delays, parking.
9.  **Accessibility**: ADA compliance queries, wheelchair dispatches.

---

## 2. Event Semantics and Causality

To capture the physical chain of events, MEVIS events enforce explicit causality parameters. Every event contains three identifiers:

- **Event ID**: The unique identifier of the specific fact instance.
- **Correlation ID**: Group identifier tracking the overall transaction chain (e.g. tracking an entire lost child incident from reporting to resolution).
- **Causation ID**: The parent event ID that directly triggered this event.

### Example Causality Chain

```text
[evt_weather_alert_001] (Lightning Warning)
         │ (Causation ID: evt_weather_alert_001)
         ▼
[evt_crowd_surge_002] (North concourse bottleneck)
         │ (Causation ID: evt_crowd_surge_002)
         ▼
[evt_volunteer_reassigned_003] (Volunteer moved to Gate B12)
```

---

## 3. Event Contract Guidelines

Every event is represented as a JSON message that MUST adhere to the following contract rules:

1.  **Immutability**: Once an event is published, it MUST NOT be edited, updated, or deleted.
2.  **Metadata Schema Compliance**: Every event MUST match the common metadata format defined in `metadata-schema.json`.
3.  **Before/After Context**: Event descriptions must explicitly map how the world state changes before and after the event.
4.  **Confidence/Trust Metrics**: Source trust scores MUST be set according to the reporter (e.g., Camera telemetry is trusted higher than raw manual text entry).
5.  **Simulation Support**: Events must flag their simulation capabilities for synthetically generated scenario replays.
