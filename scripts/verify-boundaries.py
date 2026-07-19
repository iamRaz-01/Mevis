import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

errors = []

def log_error(msg):
    errors.append(msg)
    print(f"BOUNDARY ERROR: {msg}")

# Regular expression to match imports
# Examples:
# import { ... } from '@mevis/shared-types';
# import * as x from '../../packages/shared-types';
# import('@mevis/core')
IMPORT_RE = re.compile(r"(?:import|from)\s+['\"]([^'\"]+)['\"]")

# Allowed dependencies list for each internal package
ALLOWED_INTERNAL_IMPORTS = {
    "packages/shared-types": [],
    "packages/config": ["@mevis/shared-types"],
    "packages/logger": ["@mevis/shared-types"],
    "packages/core": ["@mevis/shared-types"]
}

def check_file_imports(filepath, relative_path):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    imports = IMPORT_RE.findall(content)
    
    # Determine which category this file belongs to
    category = None
    for prefix in ALLOWED_INTERNAL_IMPORTS.keys():
        if relative_path.startswith(prefix + "/"):
            category = prefix
            break
            
    is_service = relative_path.startswith("services/")
    is_app = relative_path.startswith("apps/")
    
    for imp in imports:
        # 1. Any internal package cannot import apps/services or non-allowed packages
        if category:
            if "service" in imp or "app" in imp or imp.startswith("services/") or imp.startswith("apps/"):
                log_error(f"File {relative_path} imports from service or app module: {imp}")
            elif imp.startswith("@mevis/"):
                allowed = ALLOWED_INTERNAL_IMPORTS[category]
                if imp not in allowed:
                    log_error(f"File {relative_path} contains forbidden package import: {imp} (allowed: {allowed})")
            elif imp.startswith(".") or imp.startswith(".."):
                # Check resolved path
                resolved = os.path.normpath(os.path.join(os.path.dirname(relative_path), imp))
                # Resolve package name of the target
                target_package = None
                for prefix in ALLOWED_INTERNAL_IMPORTS.keys():
                    if resolved.replace("\\", "/").startswith(prefix):
                        target_package = prefix
                        break
                if target_package and target_package != category:
                    # Resolve to package name
                    resolved_pkg_name = f"@mevis/{os.path.basename(target_package)}"
                    if resolved_pkg_name not in ALLOWED_INTERNAL_IMPORTS[category]:
                        log_error(f"File {relative_path} contains forbidden relative import resolved to: {resolved_pkg_name}")
                        
        # 2. Services cannot import apps
        if is_service:
            if "app" in imp or imp.startswith("apps/"):
                log_error(f"Service {relative_path} imports from app module: {imp}")

print("Starting MEVIS workspace boundary imports validation...")

# Scan all packages, services, and apps
for folder in ["packages", "services", "apps"]:
    dir_path = os.path.join(ROOT_DIR, folder)
    for root, dirs, files in os.walk(dir_path):
        # Exclude build output dist and node_modules
        if "dist" in root or "node_modules" in root:
            continue
        for file in files:
            if file.endswith(".ts"):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ROOT_DIR).replace("\\", "/")
                check_file_imports(full_path, rel_path)

if errors:
    print(f"\nWORKSPACE BOUNDARY CHECK FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nWORKSPACE BOUNDARY CHECK SUCCESS: All import gates and dependency layers comply with architecture standards!")
    exit(0)
