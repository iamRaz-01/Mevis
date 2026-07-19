# MEVIS Communication Matrix

Defines integration patterns and communication contracts between bounded contexts.

---

## 1. Context Integration Patterns

| Source Context     | Target Context     | Integration Pattern | Trigger                       | Contract Schema                |
| :----------------- | :----------------- | :-----------------: | :---------------------------- | :----------------------------- |
| **Incident Mgmt**  | **Context Intel**  |    Domain Event     | `evt_incident_detected`       | `event-schema.json`            |
| **Context Intel**  | **Decision Intel** |       Command       | Context assembled             | `decision-contract.yaml`       |
| **Knowledge Mgmt** | **Decision Intel** |        Query        | Retrieve RAG SOP facts        | `policy-contract.md`           |
| **Recommendation** | **Notification**   |       Command       | Publish recommendation        | `metadata-schema.json`         |
| **Volunteer Mgmt** | **Analytics**      |     Query (ACL)     | Retrieve aggregate shift logs | `volunteer-analytics-acl.yaml` |
