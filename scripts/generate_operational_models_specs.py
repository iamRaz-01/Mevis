import os

OPERATIONAL_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../operational-models"))
os.makedirs(OPERATIONAL_MODELS_DIR, exist_ok=True)

def write_file(filename, content):
    filepath = os.path.join(OPERATIONAL_MODELS_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated {filename}")

# 1. venue.md
write_file("venue.md", """
# Venue Operational Model Specification

Defines the behavioral representation of the stadium Venue operational actor.

---

## 1. Operating Modes & Transitions
The Venue operates in one of three exclusive modes:
*   `Standard`: Standard public entry/exit throughput.
*   `Lockdown`: All ingress gates locked, security alarms armed.
*   `Evacuation`: All egress gates unlocked, PA evacuation broadcasts enabled.

## 2. Constraints & Limits
*   Max building occupancy capacity MUST NOT be exceeded.
""")

# 2. zone.md
write_file("zone.md", """
# Zone Operational Model Specification

Defines the behavioral representation of the Zone operational actor.

---

## 1. Zone States & Visibility
*   `Standard`: Standard operations, occupancy below capacity limits.
*   `Congested`: Occupancy exceeds capacity threshold, triggers route redirections.
*   `Blocked`: Blocked pathways, triggers bypass route calculations.
""")

# 3. gate.md
write_file("gate.md", """
# Gate Operational Model Specification

Defines the behavioral representation of the Gate operational actor.

---

## 1. Gate States & Throughput
*   `Open`: Active throughput processing.
*   `Closed`: Locks engaged.
*   `EmergencyEgress`: Safety breaks triggered, one-way exit flow active.
""")

# 4. volunteer.md
write_file("volunteer.md", """
# Volunteer Operational Model Specification

Defines the behavioral representation of the Volunteer operational actor.

---

## 1. Volunteer Lifecycle States
*   `Available`: Ready for task assignment.
*   `Assigned`: En route to a task zone.
*   `Busy`: Executing task operations.
*   `Resting`: Shift rest break active.
*   `EmergencySupport`: High severity override active.
*   `Unavailable`: Signed off or check-in expired.
""")

# 5. incident.md
write_file("incident.md", """
# Incident Operational Model Specification

Defines the behavioral representation of the Incident operational actor.

---

## 1. Incident Lifecycle States
*   `Reported`: Initial observation logged, verification pending.
*   `Triaged`: Severity and location confirmed.
*   `Responding`: Responders dispatched and en route.
*   `Contained`: Threat or emergency stabilized.
*   `Resolved`: Closed, documentation complete.
""")

# 6. resource.md
write_file("resource.md", """
# Resource Operational Model Specification

Defines the behavioral representation of the Resource operational actor.

---

## 1. Resource Allocations
*   `Available`: Ready for dispatch.
*   `Assigned`: Allocated to active incident.
*   `Maintenance`: Maintenance checks active.
""")

# 7. crowd.md
write_file("crowd.md", """
# Crowd Operational Model Specification

Defines the behavioral representation of the Crowd operational actor.

---

## 1. Crowd Density Safety Bounds
*   `Low`: Occupancy $< 0.30$ people/$m^2$.
*   `High`: Occupancy $\ge 0.50$ people/$m^2$.
*   `Critical`: Occupancy $\ge 0.80$ people/$m^2$ (triggers emergency overrides).
""")

# 8. weather.md
write_file("weather.md", """
# Weather Operational Model Specification

Defines the behavioral representation of the Weather operational actor.

---

## 1. Weather Operational Effects
*   `VisibilityRestriction`: Visibility drops below 50m (reduces responder travel speed metrics).
*   `EvacuationTrigger`: Lightning strikes within 5km of venue bounds.
""")

# 9. interaction-matrix.md
write_file("interaction-matrix.md", """
# Cross-Model Interaction Matrix

Maps dependencies and interactions between operational actors.

---

## 1. Interaction Rules
*   Volunteer `responds to` Incident.
*   Incident is `located in` Zone.
*   Zone is `affected by` Weather.
*   Volunteer `uses` Resource.
""")

# 10. operational-metrics.md
write_file("operational-metrics.md", """
# Operational Metrics Specification

Defines measurable attributes for auditing operational efficiency.

---

## 1. Metrics Definitions
*   **Workload**: Ratio of assigned active tasks to responder headcount.
*   **Fatigue Index**: Accumulated active duty hours without rest cycles.
*   **Response Time**: Seconds elapsed between Incident triaged state and responder checked-in at incident location.
""")

# 11. capability-model.md
write_file("capability-model.md", """
# Capability Model Specification

Defines the classification registry of operational capabilities.

---

## 1. Registry Definitions
*   `FirstAid`: Certified medical responder.
*   `CrowdControl`: Evacuation route control steward.
*   `Translation`: Multilingual visitor support steward.
""")

print("Successfully generated all 11 operational model specs.")
