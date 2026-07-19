# Decision Taxonomy Specification

This document defines the formal taxonomy of operational decisions within the MEVIS platform.

---

## 1. Decision Categories

### 1.1 Navigation Decisions

- **Purpose**: Optimize routing patterns for volunteers, equipment, and crowd flows.
- **Required Context**: Live location telemetry, active gate statuses, zone occupancy.
- **Required Evidence**: Ground-truth route blockage alerts, structural map data.
- **Applicable Policies**: Stadium structural constraints, pedestrian flow limits.
- **Risk Level**: LOW to MEDIUM.
- **Human Approval**: Autonomous recommendation; no supervisor sign-off required for standard volunteer routing.

### 1.2 Medical Decisions

- **Purpose**: Resolve patient triaging, paramedic dispatches, and ambulance escalations.
- **Required Context**: Patient vitals/symptoms description, location, nearby medical assets.
- **Required Evidence**: Paramedic location telemetry, START Triage guidelines.
- **Applicable Policies**: Medical response SLAs, HIPAA/privacy guidelines.
- **Risk Level**: HIGH to CRITICAL.
- **Human Approval**: MUST be reviewed and approved by a Supervisor or Coordinator.

### 1.3 Security Decisions

- **Purpose**: Mitigate access violations, suspicious activity reports, or perimeter intrusions.
- **Required Context**: Sensor logs, CCTV camera detection status, volunteer field observations.
- **Required Evidence**: Matching credential logs, photo/video feeds.
- **Applicable Policies**: Security perimeter rules, local law enforcement escalation protocols.
- **Risk Level**: HIGH to CRITICAL.
- **Human Approval**: LOCK/Evacuate command actions MUST be cleared by the Coordinator.

### 1.4 Accessibility Decisions

- **Purpose**: Maintain ADA compliance, direct wheelchair support, and bypass elevator failures.
- **Required Context**: Accessible route status, elevator telemetry, volunteer positions.
- **Required Evidence**: Elevator offline event alerts, wheelchair asset availability logs.
- **Applicable Policies**: ADA compliance regulations, stadium inclusion mandates.
- **Risk Level**: LOW.
- **Human Approval**: Auto-dispatched to the nearest active volunteer.

### 1.5 Volunteer Decisions

- **Purpose**: Coordinate shift rosters, break times, workload balancing, and fatigue prevention.
- **Required Context**: Check-in status, total shift hours worked, current active task list.
- **Required Evidence**: Shift scheduler tables, task completion rates.
- **Applicable Policies**: Labor rules, shift maximum break thresholds.
- **Risk Level**: LOW.
- **Human Approval**: Break recommendations suggested to Volunteer; auto-approved on click.

### 1.6 Transport Decisions

- **Purpose**: Direct spectator shuttle buses, resolve parking overflow, and flag route delays.
- **Required Context**: Shuttle arrival times, parking capacity indicators, local traffic API feeds.
- **Required Evidence**: Bus delay alerts, parking gate sensor logs.
- **Applicable Policies**: Traffic management plans, parking override rules.
- **Risk Level**: MEDIUM.
- **Human Approval**: Re-routing suggestions shown to transport dispatch supervisor.

### 1.7 Operational Decisions

- **Purpose**: Balance crowd queues, manage ticket scanning issues, and dispatch resources.
- **Required Context**: Gate flow rates, average scanner verification times.
- **Required Evidence**: Ingress telemetry logs, scanner network alerts.
- **Applicable Policies**: Maximum queue duration limits (SLA).
- **Risk Level**: MEDIUM.
- **Human Approval**: Suggested to local Gate Supervisor.

### 1.8 Emergency Decisions

- **Purpose**: Evacuate stadium seating zones or concourses due to extreme weather or safety breaches.
- **Required Context**: Weather radar, lighting sensors, crowd counts.
- **Required Evidence**: Meteorological authority storm warnings, safety breach logs.
- **Applicable Policies**: Mega-event emergency evacuation protocols, legal safety limits.
- **Risk Level**: CRITICAL.
- **Human Approval**: STRICTLY requires Coordinator and Stadium Command sign-off.
