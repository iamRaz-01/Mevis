#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
verify-data-platform.py
Verifies the MEVIS Persistent Data Platform & Event Infrastructure.

Usage:
    python scripts/verify-data-platform.py
"""

import subprocess
import time
import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
test_dir = ROOT / "scratch"
test_dir.mkdir(exist_ok=True)

errors: list[str] = []

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


# 2. Write migration SQL files for testing
migrations_dir = test_dir / "migrations"
migrations_dir.mkdir(exist_ok=True)

(migrations_dir / "V1__create_tables.sql").write_text("""
CREATE TABLE test_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE test_logs (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL
);
""", encoding="utf-8")


# 3. Create the integration runner script
runner_code = """
const fs = require('fs');
const path = require('path');
const {
  SqliteDatabaseAdapter,
  SqlMigrationRunner,
  RelationalUnitOfWork,
  InMemoryCacheAdapter,
  LocalEventBusAdapter,
  ConcurrencyError
} = require('@mevis/platform-data');

async function run() {
  const dbFile = path.join(__dirname, 'test_database.db');
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
  }

  // 1. Initialize SQLite Database
  const db = new SqliteDatabaseAdapter(dbFile);

  try {
    // 2. Test Migrations
    const migrationRunner = new SqlMigrationRunner(db);
    await migrationRunner.runMigrations(path.join(__dirname, 'migrations'));
    
    // Check if tables created successfully
    const tables = await db.query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('test_users', 'test_logs');");
    if (tables.length === 2) {
      console.log(JSON.stringify({ test: 'database_migrations', success: true }));
    } else {
      console.log(JSON.stringify({ test: 'database_migrations', success: false, data: tables }));
    }

    // 3. Test Repository & Optimistic Locking
    const mappings = new Map([
      ['User', { tableName: 'test_users', columns: ['id', 'name', 'version'] }],
      ['Log', { tableName: 'test_logs', columns: ['id', 'message'] }]
    ]);

    const uow = new RelationalUnitOfWork(db, mappings);
    await uow.start();
    const userRepo = uow.getRepository('User');

    // Insert new user
    let user = { id: 'u-1', name: 'Alice', version: 1 };
    user = await userRepo.save(user);

    // Commit initial write
    await uow.commit();

    // Verify insert & initial version
    if (user.version === 1) {
      console.log(JSON.stringify({ test: 'repository_crud_insert', success: true }));
    } else {
      console.log(JSON.stringify({ test: 'repository_crud_insert', success: false, data: user }));
    }

    // Attempt concurrent edits to verify Optimistic Locking
    const clientA = await userRepo.findById('u-1');
    const clientB = await userRepo.findById('u-1');

    clientA.name = 'Alice - Edit A';
    await userRepo.save(clientA); // should succeed and bump version to 2

    let lockErrorThrown = false;
    try {
      clientB.name = 'Alice - Edit B';
      await userRepo.save(clientB); // should fail due to version mismatch (1 vs 2)
    } catch (err) {
      if (err instanceof ConcurrencyError) {
        lockErrorThrown = true;
      }
    }

    console.log(JSON.stringify({ test: 'optimistic_locking', success: lockErrorThrown }));

    // 4. Test Unit of Work transaction atomic rollback
    const uow2 = new RelationalUnitOfWork(db, mappings);
    await uow2.start();

    const userRepo2 = uow2.getRepository('User');
    const logRepo2 = uow2.getRepository('Log');

    await userRepo2.save({ id: 'u-2', name: 'Bob', version: 1 });
    await logRepo2.save({ id: 'l-1', message: 'Log test' });

    // Intentionally trigger failure by inserting conflicting primary key or force manual error
    let rollbackSuccess = false;
    try {
      // Bob insert should be active. Now crash transaction:
      await db.execute("INSERT INTO test_logs (id, message) VALUES ('l-1', 'Conflict message');"); // duplicate key
      await uow2.commit();
    } catch (err) {
      await uow2.rollback();
      rollbackSuccess = true;
    }

    // Verify Bob is not in the database (rolled back)
    const bob = await db.query("SELECT * FROM test_users WHERE id = 'u-2';");
    if (rollbackSuccess && bob.length === 0) {
      console.log(JSON.stringify({ test: 'uow_transaction_rollback', success: true }));
    } else {
      console.log(JSON.stringify({ test: 'uow_transaction_rollback', success: false }));
    }

    // 5. Test Cache Client TTL & Invalidation
    const cache = new InMemoryCacheAdapter();
    await cache.set('my-key', 'cached-value', 1); // 1s TTL
    
    const valBefore = await cache.get('my-key');
    await new Promise(resolve => setTimeout(resolve, 1100)); // wait for expiration
    const valAfter = await cache.get('my-key');

    if (valBefore === 'cached-value' && valAfter === null) {
      console.log(JSON.stringify({ test: 'cache_ttl_expiration', success: true }));
    } else {
      console.log(JSON.stringify({ test: 'cache_ttl_expiration', success: false, before: valBefore, after: valAfter }));
    }

    // 6. Test Event Bus Subscriber Retries & Dead Letter Queue (DLQ)
    const eventBus = new LocalEventBusAdapter();
    let retryCount = 0;
    let dlqEnvelope = null;

    eventBus.subscribe('user.created', async (envelope) => {
      retryCount++;
      throw new Error('Subscriber transient crash');
    });

    eventBus.registerDlqHandler((envelope, error) => {
      dlqEnvelope = envelope;
    });

    await eventBus.publish('user.created', { userId: 'u-1' });

    // Wait for async event loop processing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Event bus maxRetries = 3. Should retry 3 times and then route to DLQ
    if (retryCount === 3 && dlqEnvelope !== null && dlqEnvelope.topic === 'user.created') {
      console.log(JSON.stringify({ test: 'eventbus_retries_and_dlq', success: true }));
    } else {
      console.log(JSON.stringify({ test: 'eventbus_retries_and_dlq', success: false, retryCount, dlqEnvelope }));
    }

  } finally {
    await db.close();
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
"""

(test_dir / "data_runner.cjs").write_text(runner_code, encoding="utf-8")

# 4. Run tests
section("Step 3: Executing Persistent Data Platform Integration Tests")
test_res = subprocess.run(
    ["node", "scratch/data_runner.cjs"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)

# Cleanup migrations & database runner files
try:
    (migrations_dir / "V1__create_tables.sql").unlink(missing_ok=True)
    migrations_dir.rmdir()
    (test_dir / "data_runner.cjs").unlink(missing_ok=True)
except Exception:
    pass

if test_res.returncode == 0:
    lines = test_res.stdout.strip().split("\n")
    for line in lines:
      if not line: continue
      try:
        outcome = json.loads(line)
        test_name = outcome.get("test")
        if outcome.get("success"):
            ok(f"Data Platform test: {test_name} passed")
        else:
            fail(f"Data Platform test: {test_name}", str(outcome))
      except json.JSONDecodeError:
          print("Raw output:", line)
else:
    fail("Data Runner run", test_res.stderr or test_res.stdout)

# 5. Summary
section("Summary")
if not errors:
    print(f"\n{GREEN}{BOLD}All persistent data platform checks passed [OK]{RESET}\n")
    sys.exit(0)
else:
    print(f"\n{RED}{BOLD}{len(errors)} check(s) failed:{RESET}")
    for e in errors:
        print(f"  {RED}*{RESET} {e}")
    print()
    sys.exit(1)
