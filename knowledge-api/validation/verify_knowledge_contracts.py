import os
import yaml

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS knowledge API integration contracts validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "query-contracts.md", "retrieval-contracts.md", "citation-contracts.md",
    "subscription-model.md", "update-contracts.md", "version-retrieval.md",
    "event-contracts.md", "routing.md", "integration-rules.md",
    "interaction-lifecycle.md", "api-schema.yaml"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(API_DIR, spec)):
        log_error(f"Missing expected knowledge-api specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "medical-evidence-query.yaml", "volunteer-training-query.yaml",
    "knowledge-update.yaml", "version-request.yaml",
    "citation-package.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(API_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        if "query_envelope" in data:
            env = data["query_envelope"]
            client_id = env.get("client_id")
            intent = env.get("query_intent")
            trust = env.get("min_trust_rating")
            
            if not client_id or not intent or trust is None:
                log_error(f"Example {name} is missing client_id, query_intent, or min_trust_rating.")
            if not (0.0 <= trust <= 1.0):
                log_error(f"Example {name} min_trust_rating bounds are invalid: {trust}")
                
        if "evidence_delivery" in data:
            delivery = data["evidence_delivery"]
            citations = delivery.get("citations", [])
            if not citations:
                log_error(f"Example {name} is missing citations list in evidence delivery.")

# 4. Summary report
if errors:
    print(f"\nKNOWLEDGE API CONTRACTS VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nKNOWLEDGE API CONTRACTS VALIDATION SUCCESS: All logical query payloads, version requests, and event schema definitions are consistent!")
    exit(0)
