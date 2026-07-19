import os
import json

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

errors = []

def log_error(msg):
    errors.append(msg)
    print(f"MONOREPO ERROR: {msg}")

# 1. Parse root tsconfig.json references
root_tsconfig_path = os.path.join(ROOT_DIR, "tsconfig.json")
references = []
try:
    with open(root_tsconfig_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        references = [ref["path"] for ref in data.get("references", [])]
except Exception as e:
    log_error(f"Failed to parse root tsconfig.json: {e}")

# 2. Check for missing references in workspaces
expected_workspaces = [
    "packages/shared-types",
    "packages/config",
    "packages/logger",
    "packages/core",
    "services/context-service",
    "apps/dashboard"
]

for ws in expected_workspaces:
    ws_path = os.path.join(ROOT_DIR, ws)
    if not os.path.exists(ws_path):
        log_error(f"Missing expected workspace directory: {ws}")
        continue
        
    # Check that it's referenced in root tsconfig
    if ws not in references:
        log_error(f"Workspace {ws} is not referenced in root tsconfig.json")
        
    # Check package.json
    pkg_json_path = os.path.join(ws_path, "package.json")
    if not os.path.exists(pkg_json_path):
        log_error(f"Workspace {ws} is missing package.json")
    else:
        try:
            with open(pkg_json_path, "r", encoding="utf-8") as f:
                pkg_data = json.load(f)
                if not pkg_data.get("name"):
                    log_error(f"Workspace {ws} package.json is missing name attribute")
        except Exception as e:
            log_error(f"Failed to parse {ws}/package.json: {e}")

    # Check tsconfig.json
    tsconfig_path = os.path.join(ws_path, "tsconfig.json")
    if not os.path.exists(tsconfig_path):
        log_error(f"Workspace {ws} is missing tsconfig.json")

# 3. Summary report
if errors:
    print(f"\nMONOREPO VERIFICATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nMONOREPO VERIFICATION SUCCESS: All workspace workspaces config parameters are integrated and linked!")
    exit(0)
