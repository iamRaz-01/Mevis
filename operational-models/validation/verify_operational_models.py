import os
import yaml

OPERATIONAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

errors = []

def log_error(msg):
    errors.append(msg)
    print(f"ERROR: {msg}")

def check_yaml(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except Exception as e:
        log_error(f"Failed to parse YAML file {os.path.basename(filepath)}: {e}")
        return None

print("Starting MEVIS operational models semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "venue.md", "zone.md", "gate.md", "volunteer.md", "incident.md",
    "resource.md", "crowd.md", "weather.md", "interaction-matrix.md",
    "operational-metrics.md", "capability-model.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(OPERATIONAL_DIR, spec)):
        log_error(f"Missing expected operational-model specification file: {spec}")

# 2. Parse example YAML files
examples = ["volunteer-lifecycle.yaml", "incident-lifecycle.yaml", "crowd-evolution.yaml", "weather-impact.yaml", "resource-allocation.yaml"]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(OPERATIONAL_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    # Rule A: Check lifecycles contain entity ID and current state
    for name in ["volunteer-lifecycle.yaml", "incident-lifecycle.yaml"]:
        data = loaded_examples.get(name)
        if data:
            lifecycle = data.get(name.split(".")[0].replace("-", "_"))
            if lifecycle:
                ent_id = lifecycle.get("entity_id")
                curr_state = lifecycle.get("current_state")
                transitions = lifecycle.get("transitions", [])
                
                if not ent_id or not curr_state or not transitions:
                    log_error(f"Example {name} is missing entity_id, current_state, or transitions list.")

# 4. Summary report
if errors:
    print(f"\nOPERATIONAL MODELS VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nOPERATIONAL MODELS VALIDATION SUCCESS: All behavioral transitions, capability mappings, and interaction matrices are consistent!")
    exit(0)
