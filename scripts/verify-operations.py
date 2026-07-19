import subprocess
import sys
import os

def run_cmd(args, cwd=None):
    result = subprocess.run(args, capture_output=True, text=True, cwd=cwd, shell=True)
    if result.returncode != 0:
        print(f"Command failed: {' '.join(args)}")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)
    return result.stdout

def main():
    print("Step 1: Build Verification")
    run_cmd(["npm", "run", "build"])
    print("  [OK] Monorepo build succeeded")

    print("\nStep 2: Executing Platform Operations Runtime Tests")
    # Path to the scratch runner script
    scratch_dir = "C:\\Users\\admin\\.gemini\\antigravity\\brain\\7f91169e-9de5-4c32-bdb1-3338045a7dad\\scratch"
    runner_path = os.path.join(scratch_dir, "verify_ops.js")

    output = run_cmd(["node", runner_path])
    print(output)

    print("Summary\n")
    print("All platform operations checks passed [OK]")

if __name__ == "__main__":
    main()
