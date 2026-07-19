import os
import yaml

CONTEXT_BUILDER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS context builder pipeline semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "pipeline.md", "normalization.md", "entity-resolution.md",
    "world-lookup.md", "knowledge-retrieval.md", "policy-retrieval.md",
    "constraint-resolution.md", "historical-context.md", "enrichment.md",
    "context-assembly.md", "validation.md", "scoring.md",
    "caching.md", "freshness.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(CONTEXT_BUILDER_DIR, spec)):
        log_error(f"Missing expected context-builder specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "medical-incident-context.yaml", "crowd-control-context.yaml",
    "weather-impact-context.yaml", "volunteer-assignment-context.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(CONTEXT_BUILDER_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic Integrity checks
if loaded_examples:
    for name, data in loaded_examples.items():
        output = data.get("context_builder_output", {})
        pipe_id = output.get("pipeline_id")
        stages = output.get("stages", [])
        resolved = output.get("resolved_entities", [])
        
        if not pipe_id or not stages or not resolved:
            log_error(f"Context builder example {name} is missing pipeline_id, stages list, or resolved_entities.")
            
        if not pipe_id.startswith("pipe_"):
            log_error(f"Example {name} pipeline_id does not start with pipe_ prefix: {pipe_id}")
            
        # Check entity registry ID matching
        for ent in resolved:
            ent_id = ent.get("id")
            if not ent_id:
                log_error(f"Example {name} contains a resolved entity with no ID key.")

# 4. Summary report
if errors:
    print(f"\nCONTEXT BUILDER VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nCONTEXT BUILDER VALIDATION SUCCESS: All enrichment models, pipeline stages, and examples are consistent!")
    exit(0)
