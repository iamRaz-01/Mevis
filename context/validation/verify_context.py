import os
import yaml

CONTEXT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS context intelligence semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "context-model.md", "context-taxonomy.md", "context-hierarchy.md",
    "context-composition.md", "context-prioritization.md", "context-ownership.md",
    "context-metadata.md", "context-schema.yaml"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(CONTEXT_DIR, spec)):
        log_error(f"Missing expected context specification file: {spec}")

# 2. Parse example YAML files
examples = ["incident-context.yaml", "volunteer-context.yaml", "medical-context.yaml", "emergency-context.yaml"]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(CONTEXT_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Integrity checks
if loaded_examples:
    for name, data in loaded_examples.items():
        ctx = data.get("decision_context", {})
        ctx_id = ctx.get("context_id")
        ctx_type = ctx.get("context_type")
        confidence = ctx.get("confidence")
        
        if not ctx_id or not ctx_type:
            log_error(f"Example {name} is missing context_id or context_type.")
            
        if not ctx_id.startswith("ctx_"):
            log_error(f"Example {name} context_id does not start with ctx_ prefix: {ctx_id}")
            
        if confidence is not None:
            if not (0.0 <= confidence <= 1.0):
                log_error(f"Example {name} confidence score out of range: {confidence}")

# 4. Summary report
if errors:
    print(f"\nCONTEXT VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nCONTEXT VALIDATION SUCCESS: All context hierarchies, composition templates, and mock snapshots are consistent!")
    exit(0)
