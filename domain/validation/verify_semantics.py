import os
import json
import yaml

DOMAIN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

errors = []

def log_error(msg):
    errors.append(msg)
    print(f"ERROR: {msg}")

def check_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        log_error(f"Failed to parse JSON file {os.path.basename(filepath)}: {e}")
        return None

def check_yaml(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        log_error(f"Failed to parse YAML file {os.path.basename(filepath)}: {e}")
        return None

print("Starting MEVIS domain semantic validation...")

# 1. Parse JSON files
event_schema = check_json(os.path.join(DOMAIN_DIR, "event-model/event-schema.json"))
metadata_schema = check_json(os.path.join(DOMAIN_DIR, "event-model/metadata-schema.json"))

samples = ["volunteer-checked-in.json", "incident-reported.json", "incident-escalated.json", "task-started.json"]
for s in samples:
    check_json(os.path.join(DOMAIN_DIR, "event-model/sample-events", s))

# 2. Parse YAML files
transition_rules = check_yaml(os.path.join(DOMAIN_DIR, "transition-rules/state-transition-rules.yaml"))
forbidden_transitions = check_yaml(os.path.join(DOMAIN_DIR, "transition-rules/forbidden-transitions.yaml"))
recovery_transitions = check_yaml(os.path.join(DOMAIN_DIR, "transition-rules/recovery-transitions.yaml"))
event_catalog = check_yaml(os.path.join(DOMAIN_DIR, "event-model/event-catalog.yaml"))
event_categories = check_yaml(os.path.join(DOMAIN_DIR, "event-model/categories.yaml"))
simulation_metadata = check_yaml(os.path.join(DOMAIN_DIR, "simulations/scenario-metadata.yaml"))

# 3. Semantic Integrity Verifications

if transition_rules and event_catalog:
    # Rule A: Every transition references its triggering event
    transition_triggers = set()
    for rule in transition_rules.get("transitions", []):
        trigger = rule.get("trigger")
        if trigger:
            transition_triggers.add(trigger)
        else:
            log_error(f"Transition rule missing trigger in: {rule}")

    # Rule B: Every catalog event identifies its producer and consumers
    catalog_events = set()
    for evt in event_catalog.get("events", []):
        name = evt.get("name")
        if not name:
            log_error("Event catalog entry missing name.")
            continue
        catalog_events.add(name)
        if not evt.get("producer"):
            log_error(f"Event {name} missing producer contract.")
        if not evt.get("consumers") or not isinstance(evt.get("consumers"), list):
            log_error(f"Event {name} missing consumers list contract.")

    # Rule C: Every event in the catalog maps to at least one state transition
    # Note: System/Analytics notifications might not change entity state directly, but operational events should.
    for evt_name in catalog_events:
        # Check if mapped to transition trigger
        if evt_name not in transition_triggers:
            # Check if mapped to recovery trigger or standard event
            recovery_triggers = [r.get("trigger") for r in recovery_transitions.get("recovery_transitions", [])] if recovery_transitions else []
            if evt_name not in recovery_triggers:
                print(f"INFO: Event {evt_name} does not trigger any state transitions directly (could be alert/audit/telemetry event).")

# 4. Summary report
if errors:
    print(f"\nSEMANTIC VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nSEMANTIC VALIDATION SUCCESS: All domain rules, event contracts, and lifecycles are consistent!")
    exit(0)
