#!/usr/bin/env python3
"""
Hook Testing Script
Tests all redesigned hooks independently

Usage: python test-hooks.py
"""
import json
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent

def test_hook(hook_name, hook_file, test_input):
    """Test a single hook with given input."""
    print(f"\n{'='*60}")
    print(f"Testing: {hook_name}")
    print(f"{'='*60}")

    hook_path = PROJECT_ROOT / ".claude" / "hooks" / hook_file

    if not hook_path.exists():
        print(f"[FAIL] Hook file not found: {hook_path}")
        return False

    try:
        # Run hook with test input
        result = subprocess.run(
            ["python", str(hook_path)],
            input=json.dumps(test_input),
            capture_output=True,
            text=True,
            timeout=2,
            cwd=str(PROJECT_ROOT)
        )

        print(f"Exit Code: {result.returncode}")

        if result.stdout:
            print(f"\nOutput:\n{result.stdout}")

        if result.stderr:
            print(f"\nStderr:\n{result.stderr}")

        # Check for errors
        if "Traceback" in result.stderr or "Error" in result.stderr:
            print(f"[FAIL] Hook produced errors")
            return False

        print(f"[PASS] Hook executed without errors")
        return True

    except subprocess.TimeoutExpired:
        print(f"[FAIL] Hook timeout (> 2s)")
        return False
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False

def main():
    """Run all hook tests."""
    print("="*60)
    print("HOOK TESTING SUITE - Phase 2")
    print("="*60)

    results = {}

    # Test 1: session-start.py
    results['session-start'] = test_hook(
        "SessionStart Hook",
        "session-start.py",
        {}
    )

    # Test 2: user-messages.py
    results['user-prompt-submit'] = test_hook(
        "UserPromptSubmit Hook",
        "user-messages.py",
        {
            "prompt": "Let's implement a new feature for finance module",
            "transcript_path": str(PROJECT_ROOT / ".claude" / "transcript.jsonl")
        }
    )

    # Test 3: sessions-enforce.py (PreToolUse)
    results['pre-tool-use'] = test_hook(
        "PreToolUse Hook",
        "sessions-enforce.py",
        {
            "tool_name": "Edit",
            "tool_input": {
                "file_path": str(PROJECT_ROOT / "services" / "finance" / "test.ts")
            }
        }
    )

    # Test 4: post-tool-use.py
    results['post-tool-use'] = test_hook(
        "PostToolUse Hook",
        "post-tool-use.py",
        {
            "tool_name": "Edit",
            "tool_input": {
                "file_path": str(PROJECT_ROOT / "services" / "finance" / "test.ts")
            },
            "cwd": str(PROJECT_ROOT)
        }
    )

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    for hook_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {hook_name}")

    print(f"\nTotal: {total} | Passed: {passed} | Failed: {failed}")

    if failed == 0:
        print("\nAll hooks passed!")
        return 0
    else:
        print(f"\n{failed} hook(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
