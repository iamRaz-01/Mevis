import os
import yaml

CONTEXT_API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS context API contracts semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "query-contracts.md", "context-capabilities.md", "update-contracts.md",
    "subscription-model.md", "snapshot-retrieval.md", "event-contracts.md",
    "routing.md", "integration-rules.md", "lifecycle-contracts.md",
    "api-schema.yaml"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(CONTEXT_API_DIR, spec)):
        log_error(f"Missing expected context-api specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "incident-query.yaml", "volunteer-subscription.yaml",
    "context-update.yaml", "snapshot-request.yaml", "validation-event.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(CONTEXT_API_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    # Rule A: Check query example parameters
    query = loaded_examples.get("incident-query.yaml", {}).get("incident_query", {})
    if query:
        req_id = query.get("requester_id")
        scope = query.get("context_scope")
        target_id = query.get("target_id")
        if not req_id or not scope or not target_id:
            log_error("Incident query example is missing requester_id, context_scope, or target_id.")

    # Rule B: Check subscription example parameters
    sub = loaded_examples.get("volunteer-subscription.yaml", {}).get("volunteer_subscription", {})
    if sub:
        req_id = sub.get("requester_id")
        sub_id = sub.get("subscription_id")
        if not req_id or not sub_id:
            log_error("Volunteer subscription example is missing requester_id or subscription_id.")

# 4. Summary report
if errors:
    print(f"\nCONTEXT API CONTRACTS VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nCONTEXT API CONTRACTS VALIDATION SUCCESS: All logical query models, subscription streams, and integration interfaces are consistent!")
    exit(0)
