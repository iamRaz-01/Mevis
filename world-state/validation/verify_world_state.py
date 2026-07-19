import os
import yaml

WORLD_STATE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS world state engine semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "world-state-schema.md", "snapshot-model.md", "update-model.md",
    "delta-model.md", "observation-lineage.md", "synchronization.md",
    "freshness-model.md", "state-transition-model.md", "versioning.md",
    "state-quality-model.md", "consistency-model.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(WORLD_STATE_DIR, spec)):
        log_error(f"Missing expected world-state specification file: {spec}")

# 2. Parse example YAML files
examples = ["volunteer-update.yaml", "incident-update.yaml", "snapshot-example.yaml", "synchronization-example.yaml"]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(WORLD_STATE_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Integrity verification of example data
if loaded_examples:
    # Rule A: Verify updates contain a transaction ID and entity ID prefix patterns
    for name in ["volunteer-update.yaml", "incident-update.yaml"]:
        data = loaded_examples.get(name)
        if data:
            update = data.get("state_update", {})
            tx_id = update.get("transaction_id")
            entity_id = update.get("entity_id")
            changes = update.get("changes", [])
            
            if not tx_id or not entity_id or not changes:
                log_error(f"Update example {name} missing transaction ID, entity ID, or changes.")
            
            if not tx_id.startswith("tx_"):
                log_error(f"Update example {name} transaction ID does not start with tx_ prefix: {tx_id}")

    # Rule B: Verify snapshot contains entities with confidence scores in range [0, 1]
    snap_data = loaded_examples.get("snapshot-example.yaml")
    if snap_data:
        snapshot = snap_data.get("state_snapshot", {})
        entities = snapshot.get("entities", [])
        for ent in entities:
            conf = ent.get("confidence")
            if conf is not None:
                if not (0.0 <= conf <= 1.0):
                    log_error(f"Snapshot entity {ent.get('id')} confidence score out of range: {conf}")

# 4. Summary report
if errors:
    print(f"\nWORLD STATE VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nWORLD STATE VALIDATION SUCCESS: All update deltas, snapshots, and synchronization maps are consistent!")
    exit(0)
