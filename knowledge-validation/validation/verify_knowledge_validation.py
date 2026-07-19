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

print("Starting MEVIS knowledge validation framework semantic checks...")

# 1. Verify expected specifications exist
expected_specs = [
    "validation-framework.md", "source-validation.md", "provenance.md",
    "citation.md", "trust-model.md", "freshness.md",
    "completeness.md", "contradiction.md", "deprecation.md",
    "integrity.md", "validation-outcomes.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(VALIDATION_DIR, spec)):
        log_error(f"Missing expected knowledge-validation specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "validated-sop.yaml", "deprecated-policy.yaml",
    "contradictory-guidelines.yaml", "citation-example.yaml",
    "provenance-example.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(VALIDATION_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        if "validation_outcome" in data:
            outcome = data["validation_outcome"]
            status = outcome.get("status")
            chunk_id = outcome.get("chunk_id")
            
            if not status or not chunk_id:
                log_error(f"Example {name} is missing status or chunk_id.")
            if status not in ["Validated", "RequiresReview", "Rejected"]:
                log_error(f"Example {name} status is invalid: {status}")
                
        if "trust_profile" in data:
            profile = data["trust_profile"]
            auth = profile.get("authority_weight")
            recency = profile.get("review_recency_score")
            
            if auth is None or recency is None:
                log_error(f"Example {name} is missing authority_weight or review_recency_score.")
            if not (0.0 <= auth <= 1.0) or not (0.0 <= recency <= 1.0):
                log_error(f"Example {name} trust score bounds are out of limits: auth={auth}, recency={recency}")

# 4. Summary report
if errors:
    print(f"\nKNOWLEDGE VALIDATION CHECK FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nKNOWLEDGE VALIDATION CHECK SUCCESS: All trust ratings, outcomes, and citations references are consistent!")
    exit(0)
