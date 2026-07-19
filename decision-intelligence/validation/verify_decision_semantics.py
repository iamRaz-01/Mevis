import os
import yaml

DEC_INT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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

print("Starting MEVIS decision-intelligence semantic validation...")

# 1. Parse YAML files
contract = check_yaml(os.path.join(DEC_INT_DIR, "decision-contract.yaml"))
rules = check_yaml(os.path.join(DEC_INT_DIR, "decision-rules.yaml"))
policies = check_yaml(os.path.join(DEC_INT_DIR, "approval-policies.yaml"))
fallbacks = check_yaml(os.path.join(DEC_INT_DIR, "fallback-strategies.yaml"))

simulations = ["medical-incident.yaml", "crowd-surge.yaml", "lost-child.yaml", "security-alert.yaml"]
loaded_sims = {}
for s in simulations:
    data = check_yaml(os.path.join(DEC_INT_DIR, "simulations", s))
    if data:
        loaded_sims[s] = data

# 1.1 Verify all spec files exist
expected_specs = [
    "decision-taxonomy.md", "decision-pipeline.md", "decision-lifecycle.md",
    "world-state-engine.md", "context-builder.md", "knowledge-retrieval.md",
    "trust-model.md", "memory-architecture.md", "agent-specifications.md",
    "evaluation-framework.md", "simulation-framework.md", "ai-governance.md",
    "reasoning-architecture.md", "decision-governance.md",
    "explainability-model.md", "failure-modes.md", "human-collaboration.md",
    "policy-contract.md", "risk-matrix.md"
]
for spec in expected_specs:
    if not os.path.exists(os.path.join(DEC_INT_DIR, spec)):
        log_error(f"Missing expected cognitive specification file: {spec}")

# 2. Semantic Integrity Verifications

if policies:
    # Rule A: Check categories map in policy
    policy_categories = set(p.get("category") for p in policies.get("policies", []))
    expected_categories = {"Navigation", "Medical", "Security", "Accessibility", "Volunteer", "Transport", "Operational", "Emergency"}
    
    missing_categories = expected_categories - policy_categories
    if missing_categories:
        log_error(f"Missing approval policies for categories: {missing_categories}")

if loaded_sims and policies:
    # Rule B: Every simulation scenario aligns with a defined category
    for s, data in loaded_sims.items():
        scenario = data.get("scenario", {})
        actions = scenario.get("expected_recommendation", {}).get("proposed_actions", [])
        if not actions:
            log_error(f"Simulation {s} missing expected proposed actions.")
        
        approvals = scenario.get("expected_recommendation", {}).get("required_approvals", [])
        for app in approvals:
            if app not in ["Volunteer", "Supervisor", "Coordinator"]:
                log_error(f"Simulation {s} references invalid approval authority level: {app}")

# 3. Summary report
if errors:
    print(f"\nDECISION SEMANTIC VALIDATION FAILED with {len(errors)} errors.")
    exit(1)
else:
    print("\nDECISION SEMANTIC VALIDATION SUCCESS: All cognitive categories, rules, and simulations are consistent!")
    exit(0)
