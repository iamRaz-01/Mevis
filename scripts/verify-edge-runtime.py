#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
verify-edge-runtime.py
Verifies the MEVIS Platform Edge Runtime and Gateway policies.

Usage:
    python scripts/verify-edge-runtime.py
"""

import subprocess
import time
import json
import http.client
import os
import signal
from pathlib import Path

ROOT = Path(__file__).parent.parent
test_dir = ROOT / "scratch"
test_dir.mkdir(exist_ok=True)

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


# 1. Build Verification
section("Step 1: Build Verification")
res = subprocess.run(
    ["npm.cmd" if sys.platform == "win32" else "npm", "run", "build"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if res.returncode == 0:
    ok("Monorepo build succeeded")
else:
    fail("Monorepo build", res.stderr or res.stdout)
    sys.exit(1)


# 2. Starting Edge Gateway & Target Mock Service
section("Step 2: Starting Gateway & Verification Server")

gateway_port = 8000
mock_port = 9000

# Start Gateway
gateway_entry = ROOT / "services" / "gateway" / "dist" / "src" / "index.js"
proc_gw = subprocess.Popen(
    ["node", str(gateway_entry)],
    env={**os.environ, "PORT": str(gateway_port)},
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
processes.append(proc_gw)

# Write and run mock target service
mock_code = """
const http = require('http');
const { createEnvelope } = require('@mevis/platform-communication');
const { registry } = require('@mevis/platform-service-registry');

const server = http.createServer((req, res) => {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
        const bodyStr = Buffer.concat(bodyChunks).toString();
        const payload = bodyStr ? JSON.parse(bodyStr) : {};
        
        const resBody = JSON.stringify(createEnvelope(true, {
            message: "Telemetry processed successfully!",
            received: payload
        }, undefined, "mock-telemetry-service"));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(resBody);
    });
});

server.listen(9000, async () => {
    await registry.register({
        name: 'mock-telemetry-service',
        version: '1.0.0',
        endpoint: 'http://localhost:9000',
        status: 'UP'
    });
});
"""

(test_dir / "mock_telemetry_service.cjs").write_text(mock_code, encoding="utf-8")
proc_mock = subprocess.Popen(
    ["node", "scratch/mock_telemetry_service.cjs"],
    env={**os.environ, "REGISTRY_URL": f"http://localhost:{gateway_port}"},
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
processes.append(proc_mock)

# Wait for boot
time.sleep(2.5)


# 3. Running Edge Tests
section("Step 3: Executing Edge Pipeline Integration Tests")

try:
    # Test 1: Security Headers & CORS Preflight OPTIONS
    conn = http.client.HTTPConnection("localhost", gateway_port)
    conn.request("OPTIONS", "/api/v1/services/mock-telemetry-service/telemetry", headers={
        "Origin": "https://mevis.io",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    })
    resp1 = conn.getresponse()
    body1 = resp1.read().decode("utf-8")
    headers1 = {k.lower(): v for k, v in resp1.getheaders()}
    conn.close()

    if (
        resp1.status == 204 and
        headers1.get("access-control-allow-origin") == "https://mevis.io" and
        "x-frame-options" in headers1
    ):
        ok("Security headers & CORS pre-flight OPTIONS matching passed")
    else:
        fail("CORS and Security Headers pre-flight", f"Status: {resp1.status}. Headers: {headers1}")

    # Test 2: Valid Request forwarding and schema validation passing
    conn = http.client.HTTPConnection("localhost", gateway_port)
    valid_payload = json.dumps({"deviceId": "dev-456", "reading": 42.5})
    conn.request("POST", "/api/v1/services/mock-telemetry-service/telemetry", body=valid_payload, headers={
        "Content-Type": "application/json",
        "Origin": "https://mevis.io"
    })
    resp2 = conn.getresponse()
    body2 = resp2.read().decode("utf-8")
    conn.close()

    if resp2.status == 200:
        parsed2 = json.loads(body2)
        if parsed2.get("success") and parsed2.get("data", {}).get("message") == "Telemetry processed successfully!":
            ok("Valid request schema payload forwarding passed")
        else:
            fail("Valid request forwarding response", body2)
    else:
        fail("Valid request HTTP status", f"{resp2.status} -- {body2}")

    # Test 3: Invalid request schema validation rejection
    conn = http.client.HTTPConnection("localhost", gateway_port)
    invalid_payload = json.dumps({"deviceId": "d", "reading": -10}) # deviceId too short, reading out of bounds
    conn.request("POST", "/api/v1/services/mock-telemetry-service/telemetry", body=invalid_payload, headers={
        "Content-Type": "application/json",
        "Origin": "https://mevis.io"
    })
    resp3 = conn.getresponse()
    body3 = resp3.read().decode("utf-8")
    conn.close()

    if resp3.status == 400:
        parsed3 = json.loads(body3)
        errors_list = parsed3.get("errors", [])
        codes = [e.get("code") for e in errors_list]
        if "FIELD_TOO_SHORT" in codes and "FIELD_TOO_SMALL" in codes:
            ok("Invalid request schema validation rejection at the Edge passed")
        else:
            fail("Invalid request validation errors", body3)
    else:
        fail("Invalid request HTTP status", f"{resp3.status} -- {body3}")

    # Test 4: Rate Limiting
    # Send 105 requests rapidly to trip the rate limiter (max limit: 100 requests)
    tripped = False
    for i in range(110):
        try:
            conn = http.client.HTTPConnection("localhost", gateway_port)
            conn.request("GET", "/api/health")
            resp = conn.getresponse()
            body = resp.read().decode("utf-8")
            conn.close()
            if resp.status == 429:
                parsed = json.loads(body)
                if parsed.get("errors", [{}])[0].get("code") == "RATE_LIMIT_EXCEEDED":
                    tripped = True
                    break
        except Exception:
            pass

    if tripped:
        ok("Edge rate limiter burst protection passed")
    else:
        fail("Rate limiting check", "Did not trip 429 limit after 110 requests.")

finally:
    for proc in processes:
        if sys.platform == "win32":
            proc.terminate()
        else:
            os.kill(proc.pid, signal.SIGTERM)
        proc.wait(timeout=5)

# Cleanup
try:
    (test_dir / "mock_telemetry_service.cjs").unlink(missing_ok=True)
except Exception:
    pass

# 4. Summary
section("Summary")
if not errors:
    print(f"\n{GREEN}{BOLD}All edge runtime checks passed [OK]{RESET}\n")
    sys.exit(0)
else:
    print(f"\n{RED}{BOLD}{len(errors)} check(s) failed:{RESET}")
    for e in errors:
        print(f"  {RED}*{RESET} {e}")
    print()
    sys.exit(1)
