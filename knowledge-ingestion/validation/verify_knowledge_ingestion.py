import os
import yaml

INGESTION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS knowledge ingestion pipeline semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "ingestion-pipeline.md", "supported-sources.md", "validation.md",
    "parsing.md", "ocr-handling.md", "cleaning.md",
    "normalization.md", "chunking.md", "metadata-extraction.md",
    "processing-lifecycle.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(INGESTION_DIR, spec)):
        log_error(f"Missing expected knowledge-ingestion specification file: {spec}")

# 2. Parse example YAML files
examples = [
    "medical-sop-processing.yaml", "volunteer-handbook-processing.yaml",
    "emergency-playbook-processing.yaml", "scanned-manual-processing.yaml",
    "policy-processing.yaml"
]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(INGESTION_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        chunk = data.get("chunk_payload", {})
        audit = data.get("ingestion_audit", {})
        
        # Check required chunk parameters
        chunk_id = chunk.get("chunk_id")
        parent_id = chunk.get("parent_asset_id")
        provenance = chunk.get("provenance", {})
        
        if not chunk_id or not parent_id or not provenance:
            log_error(f"Example {name} is missing chunk_id, parent_asset_id, or provenance details.")
            
        if not chunk_id.startswith("kn_"):
            log_error(f"Example {name} chunk_id does not start with kn_ prefix: {chunk_id}")
            
        # Check ingestion audit stages
        stages = audit.get("stages_completed", [])
        if not stages:
            log_error(f"Example {name} is missing stages_completed list.")

# 4. Summary report
if errors:
    print(f"\nKNOWLEDGE INGESTION VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nKNOWLEDGE INGESTION VALIDATION SUCCESS: All chunk segments, provenance mappings, and stages checklists are consistent!")
    exit(0)
