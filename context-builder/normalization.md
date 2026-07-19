# Observation Normalization Specification

Converts heterogeneous raw observations into unified ingestion formats.

---

## 1. Ingestion Normalization Rules

- **Payload Normalization**: Normalizes field names (e.g. `GPS_Latitude` $
ightarrow$ `coordinates`).
- **Timestamp Synchronization**: Converts all update clocks to UTC ISO-8601.
- **Confidence Propagation**: Propagates trust attributes from observation sources.
