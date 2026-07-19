# Canonical Observation Input Model

Defines the canonical input schema for all raw observations entering the MEVIS platform.

---

## 1. Observation Contract Schema

Every raw input MUST conform to the following schema structure:

- `observation_id` (String): Unique identifier.
- `source_type` (String): `Sensor`, `Volunteer`, `Camera`, or `Manual`.
- `telemetry_payload` (Object): Raw key-value mappings.
- `timestamp` (ISO-8601): Event occurrence timestamp.
- `integrity_checksum` (String): Verification code.
