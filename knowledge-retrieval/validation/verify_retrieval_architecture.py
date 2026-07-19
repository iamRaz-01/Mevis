import os
import yaml

RETRIEVAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS knowledge retrieval architecture semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "retrieval-architecture.md", "embeddings.md", "indexing.md",
    "query-understanding.md", "hybrid-retrieval.md", "semantic-retrieval.md",
    "lexical-retrieval.md", "ranking.md", "evidence-selection.md",
    "retrieval-quality.md", "retrieval-lifecycle.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(RETRIEVAL_DIR, spec)):
        log_error(f"Missing expected knowledge-retrieval specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "medical-emergency-query.yaml", "volunteer-assignment-query.yaml",
    "crowd-management-query.yaml", "weather-impact-query.yaml",
    "incident-investigation-query.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(RETRIEVAL_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        req = data.get("retrieval_request", {})
        pkg = data.get("evidence_package", {})
        
        # Check query intent attributes
        q_text = req.get("query_text")
        scope = req.get("context_scope")
        filters = req.get("filters", {})
        
        if not q_text or not scope or not filters:
            log_error(f"Example {name} is missing query_text, context_scope, or filters mapping.")
            
        # Check evidence package references
        citations = pkg.get("citations", [])
        if not citations:
            log_error(f"Example {name} is missing citations list.")
        for cit in citations:
            chunk_id = cit.get("chunk_id")
            parent_id = cit.get("parent_asset_id")
            rank = cit.get("relevance_rank")
            
            if not chunk_id or not parent_id or rank is None:
                log_error(f"Example {name} citation is missing chunk_id, parent_asset_id, or relevance_rank.")
            if not chunk_id.startswith("kn_"):
                log_error(f"Example {name} citation chunk_id does not start with kn_ prefix: {chunk_id}")
            if rank <= 0:
                log_error(f"Example {name} relevance_rank is invalid: {rank}")

# 4. Summary report
if errors:
    print(f"\nKNOWLEDGE RETRIEVAL VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nKNOWLEDGE RETRIEVAL VALIDATION SUCCESS: All query intents, filters, and evidence packages citations are consistent!")
    exit(0)
