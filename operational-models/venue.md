# Venue Operational Model Specification

Defines the behavioral representation of the stadium Venue operational actor.

---

## 1. Operating Modes & Transitions

The Venue operates in one of three exclusive modes:

- `Standard`: Standard public entry/exit throughput.
- `Lockdown`: All ingress gates locked, security alarms armed.
- `Evacuation`: All egress gates unlocked, PA evacuation broadcasts enabled.

## 2. Constraints & Limits

- Max building occupancy capacity MUST NOT be exceeded.
