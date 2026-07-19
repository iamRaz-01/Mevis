import os
import yaml

VALIDATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS context validation framework semantic check...")

# 1. Verify expected specifications exist
expected_specs = [
    "validation-rules.md", "completeness.md", "freshness.md",
    "consistency.md", "contradiction.md", "missing-context.md",
    "confidence.md", "quality-framework.md", "validation-outcomes.md",
    "validation-schema.yaml"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(VALIDATION_DIR, spec)):
        log_error(f"Missing expected context-validation specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "valid-context.yaml", "incomplete-context.yaml",
    "contradictory-context.yaml", "stale-context.yaml", "low-confidence-context.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(VALIDATION_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        report = data.get("validation_report", {})
        ctx_id = report.get("context_id")
        outcome = report.get("outcome")
        metrics = report.get("metrics", {})
        
        if not ctx_id or not outcome or not metrics:
            log_error(f"Validation report example {name} is missing context_id, outcome, or metrics.")
            
        if not ctx_id.startswith("ctx_"):
            log_error(f"Example {name} context_id does not start with ctx_ prefix: {ctx_id}")
            
        # Check metrics range checks
        for metric, val in metrics.items():
            if not (0.0 <= val <= 1.0):
                log_error(f"Example {name} metric {metric} value out of range: {val}")

# 4. Summary report
if errors:
    print(f"\nCONTEXT VALIDATION CHECK FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nCONTEXT VALIDATION CHECK SUCCESS: All quality configurations and validation examples are consistent!")
    exit(0)
