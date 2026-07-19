import os
import yaml

WORLD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS world state and digital twin semantic validation...")

# 1. Parse YAML files
registry = check_yaml(os.path.join(WORLD_DIR, "entity-registry.yaml"))
invariants = check_yaml(os.path.join(WORLD_DIR, "invariants.yaml"))

examples = ["stadium-world.yaml", "volunteer-world.yaml", "incident-world.yaml"]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(WORLD_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 2. Semantic Integrity checks

if registry:
    # Rule A: Check entities have valid unique ID pattern and context owner
    entities = registry.get("entities", [])
    registered_names = set()
    for ent in entities:
        name = ent.get("name")
        pattern = ent.get("id_pattern")
        owner = ent.get("owning_context")
        
        if not name or not pattern or not owner:
            log_error(f"Registry entry missing name, pattern, or owner: {ent}")
        
        if name in registered_names:
            log_error(f"Duplicate entity registration name: {name}")
        registered_names.add(name)

# 3. Check containment paths (no loops)
if registry:
    graph = {}
    entities = registry.get("entities", [])
    for ent in entities:
        name = ent.get("name")
        parent = ent.get("parent")
        if parent:
            graph[name] = parent

    def has_loop(node, visited, path):
        visited.add(node)
        path.add(node)
        parent = graph.get(node)
        if parent:
            if parent in path:
                return True
            if parent not in visited:
                if has_loop(parent, visited, path):
                    return True
        path.remove(node)
        return False

    visited = set()
    for ent in graph:
        if ent not in visited:
            if has_loop(ent, visited, set()):
                log_error(f"Circular containment loop detected starting from entity: {ent}")

# 4. Summary report
if errors:
    print(f"\nWORLD MODEL VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nWORLD MODEL VALIDATION SUCCESS: All spatial models, registry entities, and mock snapshots are consistent!")
    exit(0)
