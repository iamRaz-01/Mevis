# State Update Model Specification

Defines merge, replacement, and partial modification rules for World State delta increments.

---

## 1. Update Ingestion Rules

- **Unit Updates**: Updates targeting a single entity (e.g. Volunteer GPS change) modify only that entity block; the rest of the world remains unchanged.
- **Partial Updates**: Observations containing incomplete fields (e.g., Volunteer battery level update only) do not overwrite spatial or assignment parameters.
- **LWW (Last-Write-Wins) Merge**: If duplicate updates target the same property, the telemetry item with the newer event timestamp MUST overwrite the older state.
