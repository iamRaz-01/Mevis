#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
"""
verify-infrastructure.py
Verifies that all MEVIS Core Infrastructure Services build, start, and respond
correctly to their canonical API endpoints.

Usage:
    python scripts/verify-infrastructure.py

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

import subprocess
import sys
import time
import json
import http.client
import os
import signal
from pathlib import Path

ROOT = Path(__file__).parent.parent
DIST_ROOT = ROOT

# ──────────────────────────────────────────────────────────────────────────────
# Service definitions
# ──────────────────────────────────────────────────────────────────────────────
SERVICES = [
    {
        "name": "configuration-service",
        "port": 3001,
        "env": {"PORT": "3001", "NODE_ENV": "test"},
        "health_path": "/api/health",
        "checks": [
            {"method": "GET", "path": "/api/health", "expected_status": 200, "label": "health"},
            {"method": "GET", "path": "/api/config", "expected_status": 200, "label": "config"},
        ],
    },
    {
        "name": "storage-service",
        "port": 3002,
        "env": {"PORT": "3002", "NODE_ENV": "test", "STORAGE_BASE_PATH": "./tmp/test-uploads"},
        "health_path": "/api/health",
        "checks": [
            {"method": "GET", "path": "/api/health", "expected_status": 200, "label": "health"},
        ],
    },
    {
        "name": "notification-service",
        "port": 3003,
        "env": {"PORT": "3003", "NODE_ENV": "test"},
        "health_path": "/api/health",
        "checks": [
            {"method": "GET", "path": "/api/health", "expected_status": 200, "label": "health"},
        ],
    },
    {
        "name": "audit-service",
        "port": 3004,
        "env": {"PORT": "3004", "NODE_ENV": "test"},
        "health_path": "/api/health",
        "checks": [
            {"method": "GET", "path": "/api/health", "expected_status": 200, "label": "health"},
            {"method": "GET", "path": "/api/audit-events", "expected_status": 200, "label": "list-events"},
        ],
    },
    {
        "name": "health-service",
        "port": 3000,
        "env": {
            "PORT": "3000",
            "NODE_ENV": "test",
            "CONFIGURATION_SERVICE_PORT": "3001",
            "STORAGE_SERVICE_PORT": "3002",
            "NOTIFICATION_SERVICE_PORT": "3003",
            "AUDIT_SERVICE_PORT": "3004",
        },
        "health_path": "/api/health",
        "checks": [
            {"method": "GET", "path": "/api/health/live", "expected_status": 200, "label": "liveness"},
            {"method": "GET", "path": "/api/health/ready", "expected_status": [200, 207], "label": "readiness"},
        ],
    },
]

errors: list[str] = []
processes: list[subprocess.Popen] = []

RESET = "\033[0m"
GREEN = "\033[32m"
RED = "\033[31m"
CYAN = "\033[36m"
BOLD = "\033[1m"


def ok(label: str) -> None:
    print(f"  {GREEN}[OK]{RESET} {label}")

def fail(label: str, detail: str) -> None:
    print(f"  {RED}[FAIL]{RESET} {label} -- {detail}")
    errors.append(f"{label}: {detail}")


def section(title: str) -> None:
    print(f"\n{BOLD}{CYAN}{title}{RESET}")


# ──────────────────────────────────────────────────────────────────────────────
# Step 1 — Build check
# ──────────────────────────────────────────────────────────────────────────────
section("Step 1: Build")
result = subprocess.run(
    ["npm.cmd" if sys.platform == "win32" else "npm", "run", "build"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if result.returncode == 0:
    ok("tsc -b build succeeded")
else:
    fail("tsc -b build", result.stderr[-800:] if result.stderr else "unknown error")
    print(f"\n{RED}Build failed. Fix compilation errors before running endpoint checks.{RESET}")
    sys.exit(1)

# ──────────────────────────────────────────────────────────────────────────────
# Step 2 — Boundary checks
# ──────────────────────────────────────────────────────────────────────────────
section("Step 2: Boundary Enforcement")
bnd = subprocess.run(
    [sys.executable, "scripts/verify-boundaries.py"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if bnd.returncode == 0:
    ok("Boundary check passed — no cross-layer imports detected")
else:
    fail("Boundary check", bnd.stdout[-400:] or bnd.stderr[-400:])

# ──────────────────────────────────────────────────────────────────────────────
# Step 3 — Start services & run endpoint checks
# ──────────────────────────────────────────────────────────────────────────────
section("Step 3: Service Endpoint Verification")

env_base = {**os.environ}

try:
    # Start all services except health-service first, then health-service last.
    ordered = [s for s in SERVICES if s["name"] != "health-service"] + [
        s for s in SERVICES if s["name"] == "health-service"
    ]

    for svc in ordered:
        entry = DIST_ROOT / "services" / svc["name"] / "dist" / "src" / "index.js"
        env = {**env_base, **svc["env"]}
        proc = subprocess.Popen(
            ["node", str(entry)],
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        processes.append(proc)

    # Wait for all services to start
    time.sleep(2.5)

    for svc in SERVICES:
        port = svc["port"]
        print(f"\n  [{svc['name']} :{port}]")
        for check in svc["checks"]:
            label = f"{svc['name']}:{check['label']}"
            try:
                conn = http.client.HTTPConnection("localhost", port, timeout=4)
                conn.request(check["method"], check["path"])
                resp = conn.getresponse()
                body = resp.read().decode("utf-8")
                conn.close()
                expected = check["expected_status"]
                allowed = expected if isinstance(expected, list) else [expected]
                if resp.status in allowed:
                    # Validate JSON structure
                    parsed = json.loads(body)
                    if "success" in parsed and "timestamp" in parsed:
                        ok(f"{check['method']} {check['path']} -> {resp.status}")
                    else:
                        fail(label, f"Response missing 'success' or 'timestamp' fields")
                else:
                    fail(label, f"Expected {allowed}, got {resp.status}. Body: {body[:200]}")
            except Exception as exc:
                fail(label, str(exc))

finally:
    for proc in processes:
        if sys.platform == "win32":
            proc.terminate()
        else:
            os.kill(proc.pid, signal.SIGTERM)
        proc.wait(timeout=5)

# ──────────────────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────────────────
section("Summary")
if not errors:
    print(f"\n{GREEN}{BOLD}All infrastructure checks passed [OK]{RESET}\n")
    sys.exit(0)
else:
    print(f"\n{RED}{BOLD}{len(errors)} check(s) failed:{RESET}")
    for e in errors:
        print(f"  {RED}*{RESET} {e}")
    print()
    sys.exit(1)
