import os
import yaml

KNOWLEDGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS knowledge architecture semantic validation...")

# 1. Verify expected specifications exist
expected_specs = [
    "architecture.md", "taxonomy.md", "hierarchy.md", "ownership.md",
    "governance.md", "lifecycle.md", "trust-model.md", "versioning.md",
    "relationships.md", "metadata.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(KNOWLEDGE_DIR, spec)):
        log_error(f"Missing expected knowledge specification file: {spec}")

# 2. Parse example YAML files
examples = ["medical-sop.yaml", "emergency-playbook.yaml", "volunteer-handbook.yaml", "security-policy.yaml", "venue-guideline.yaml"]
loaded_examples = {}
for ex in examples:
    data = check_yaml(os.path.join(KNOWLEDGE_DIR, "examples", ex))
    if data:
        loaded_examples[ex] = data

# 3. Semantic checks
if loaded_examples:
    for name, data in loaded_examples.items():
        meta = data.get("metadata", {})
        lc = data.get("lifecycle", {})
        
        # Check asset ID prefixes
        asset_id = meta.get("asset_id")
        if not asset_id or not asset_id.startswith("kn_"):
            log_error(f"Example {name} asset_id does not start with kn_ prefix: {asset_id}")
            
        # Check version patterns
        version = meta.get("version")
        if not version or len(version.split(".")) != 3:
            log_error(f"Example {name} version is not a valid SemVer string: {version}")
            
        # Check matching asset IDs
        if lc.get("asset_id") != asset_id:
            log_error(f"Example {name} metadata asset_id and lifecycle asset_id mismatch.")

# 4. Summary report
if errors:
    print(f"\nKNOWLEDGE ARCHITECTURE VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nKNOWLEDGE ARCHITECTURE VALIDATION SUCCESS: All metadata profiles, hierarchies, and lifecycles are consistent!")
    exit(0)
