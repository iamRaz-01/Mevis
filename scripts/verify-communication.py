#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
verify-communication.py
Verifies that all MEVIS Platform Communication components (context propagation,
service-client retries, circuit-breaker triggers, API Gateway routing)
behave exactly according to their architecture guidelines.

Usage:
    python scripts/verify-communication.py
"""

import subprocess
import time
import json
import http.client
import os
import signal
from pathlib import Path

ROOT = Path(__file__).parent.parent

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


# 2. Dynamic Integration Testing
section("Step 2: Starting Gateway & Verification Server")

gateway_port = 8000
test_server_port = 9000

# Start Gateway
gateway_entry = ROOT / "services" / "gateway" / "dist" / "src" / "index.js"
proc_gw = subprocess.Popen(
    ["node", str(gateway_entry)],
    env={**os.environ, "PORT": str(gateway_port)},
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
processes.append(proc_gw)

# Write a quick script to spin up a mock target service that verifies context propagation and circuit triggers.
# The mock service verifies headers: x-correlation-id, x-request-id, x-actor-id, etc.
test_app_code = """
const http = require('http');
const { createEnvelope, extractContext, contextStorage } = require('@mevis/platform-communication');
const { registry } = require('@mevis/platform-service-registry');

const port = 9000;
let failCount = 0;

const server = http.createServer(async (req, res) => {
    const ctx = extractContext(req);
    await contextStorage.run(ctx, async () => {
        const url = new URL(req.url || '/', 'http://localhost');

        if (url.pathname === '/api/test/fail-transient') {
            failCount++;
            if (failCount <= 2) {
                // Return 503 Service Unavailable (should trigger client retry)
                res.writeHead(503, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Transient failure' }));
            }
            // Recover on 3d attempt
            const body = JSON.stringify(createEnvelope(true, { message: 'Recovered after retry!' }, undefined, 'test-server'));
            res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
            return res.end(body);
        }

        if (url.pathname === '/api/test/fail-permanent') {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: 'Permanent failure' }));
        }

        if (url.pathname === '/api/test/headers') {
            const body = JSON.stringify(createEnvelope(true, {
                requestId: ctx.requestId,
                correlationId: ctx.correlationId,
                actorId: ctx.actorId,
                actorRole: ctx.actorRole
            }, undefined, 'test-server'));
            res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
            return res.end(body);
        }

        res.writeHead(404);
        res.end();
    });
});

server.listen(port, async () => {
    // Register itself to registry
    await registry.register({
        name: 'test-server',
        version: '1.0.0',
        endpoint: `http://localhost:${port}`,
        status: 'UP'
    });
});
"""

test_app_dir = ROOT / "scratch"
test_app_dir.mkdir(exist_ok=True)
test_app_file = test_app_dir / "mock_test_server.cjs"
test_app_file.write_text(test_app_code, encoding="utf-8")

# Start Mock Target Service
proc_mock = subprocess.Popen(
    ["node", str(test_app_file)],
    env={**os.environ, "REGISTRY_URL": f"http://localhost:{gateway_port}"},
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
processes.append(proc_mock)

# Wait for startup
time.sleep(2.5)

# Verify Registry registration
try:
    conn = http.client.HTTPConnection("localhost", gateway_port)
    conn.request("GET", "/api/registry/resolve/test-server")
    resp = conn.getresponse()
    body = resp.read().decode("utf-8")
    conn.close()
    if resp.status == 200:
        parsed = json.loads(body)
        if parsed.get("success") and "endpoint" in parsed.get("data", {}):
            ok("Mock service registered with Gateway service registry")
        else:
            fail("Registry resolution response", body)
    else:
        fail("Registry resolution HTTP status", f"{resp.status} -- {body}")
except Exception as exc:
    fail("Registry verify exception", str(exc))


# Trigger context propagation, retry backoff, and circuit breaker tests via a runner script
runner_code = """
const { serviceClient } = require('@mevis/platform-service-client');
const { contextStorage } = require('@mevis/platform-communication');

async function run() {
    // Test 1: Headers & Context Propagation
    const ctx = {
        requestId: 'req-123-abc',
        correlationId: 'corr-999-xyz',
        actorId: 'user-77',
        actorRole: 'ROLE_ADMIN'
    };

    const propagated = await contextStorage.run(ctx, async () => {
        return await serviceClient.request('test-server', '/api/test/headers');
    });

    if (propagated.requestId === ctx.requestId && propagated.correlationId === ctx.correlationId && propagated.actorId === ctx.actorId) {
        console.log(JSON.stringify({ test: 'context_propagation', success: true }));
    } else {
        console.log(JSON.stringify({ test: 'context_propagation', success: false, data: propagated }));
    }

    // Test 2: Transient Retry Recovery
    const retryResult = await serviceClient.request('test-server', '/api/test/fail-transient');
    if (retryResult.message.includes('Recovered')) {
        console.log(JSON.stringify({ test: 'transient_retry', success: true }));
    } else {
        console.log(JSON.stringify({ test: 'transient_retry', success: false, data: retryResult }));
    }

    // Test 3: Circuit Breaker Activation
    let circuitTriggered = false;
    for (let i = 0; i < 7; i++) {
        try {
            await serviceClient.request('test-server', '/api/test/fail-permanent', { retries: 1 });
        } catch (err) {
            if (err.code === 'CIRCUIT_OPEN') {
                circuitTriggered = true;
            }
        }
    }
    console.log(JSON.stringify({ test: 'circuit_breaker', success: circuitTriggered }));
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
"""

runner_file = test_app_dir / "runner.cjs"
runner_file.write_text(runner_code, encoding="utf-8")

# Run client tests
section("Step 3: Executing Communication Runtime Integration Tests")
try:
    client_res = subprocess.run(
        ["node", str(runner_file)],
        env={**os.environ, "REGISTRY_URL": f"http://localhost:{gateway_port}"},
        capture_output=True,
        text=True,
    )
    if client_res.returncode == 0:
        lines = client_res.stdout.strip().split("\n")
        for line in lines:
            if not line: continue
            try:
                outcome = json.loads(line)
                test_name = outcome.get("test")
                if outcome.get("success"):
                    ok(f"Runtime test: {test_name} passed")
                else:
                    fail(f"Runtime test: {test_name}", str(outcome))
            except json.JSONDecodeError:
                print("Raw output line:", line)
    else:
        fail("Runner run", client_res.stderr or client_res.stdout)
finally:
    for proc in processes:
        if sys.platform == "win32":
            proc.terminate()
        else:
            os.kill(proc.pid, signal.SIGTERM)
        proc.wait(timeout=5)

# Cleanup
try:
    test_app_file.unlink(missing_ok=True)
    runner_file.unlink(missing_ok=True)
except Exception:
    pass

# 4. Summary
section("Summary")
if not errors:
    print(f"\n{GREEN}{BOLD}All communication checks passed [OK]{RESET}\n")
    sys.exit(0)
else:
    print(f"\n{RED}{BOLD}{len(errors)} check(s) failed:{RESET}")
    for e in errors:
        print(f"  {RED}*{RESET} {e}")
    print()
    sys.exit(1)
