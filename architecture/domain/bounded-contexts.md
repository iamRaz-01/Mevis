# Bounded Context Registry & Decision Records

This document catalogs the 10 canonical bounded contexts of the MEVIS platform.

---

## 1. The Bounded Context Registry

1.  **Volunteer Management**: Manages volunteers, rosters, active shifts, presence tracking, and check-in.
2.  **Incident Management**: Triages, assesses, dispatches, and tracks incident lifecycles.
3.  **Knowledge Management**: Indexes SOP manuals, provides evidence context hits.
4.  **Context Intelligence**: Assembles live situational snapshots.
5.  **Decision Intelligence**: Evaluates hypotheses, risk scores, and reasons.
6.  **Recommendation Engine**: Formats, prioritizes, and compiles recommendations.
7.  **Notification**: Handles alert deliveries (SMS, push, email).
8.  **Authentication**: Manages user credentials, permissions, and security sessions.
9.  **Analytics**: Tracks long-term KPIs, historical reports, and dashboards.
10. **Administration**: Configures venue maps, gates, schedules, and permissions.

---

## 2. Context Partition Decision Records (CDR)

### CDR-001: Separation of Recommendation Engine from Decision Intelligence

- **Decision**: Separate recommendation formatting and dispatch from reasoning logic.
- **Justification**: Separation allows multiple reasoning engines (e.g. LLMs, rules engine fallbacks) to reuse a single recommendation delivery contract.
