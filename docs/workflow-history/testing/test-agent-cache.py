#!/usr/bin/env python3
"""
Test script for agent-cache.py

Tests all core functionality including:
- Cache key generation
- Cache storage
- Cache lookup
- Cache invalidation
- Statistics tracking
"""

import sys
import os
import importlib.util

# Load agent-cache module dynamically (handles hyphenated filename)
spec = importlib.util.spec_from_file_location(
    "agent_cache",
    os.path.join(os.path.dirname(__file__), "agent-cache.py")
)
agent_cache = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent_cache)

# Import functions
generate_cache_key = agent_cache.generate_cache_key
store_cache = agent_cache.store_cache
lookup_cache = agent_cache.lookup_cache
invalidate_cache = agent_cache.invalidate_cache
prune_cache = agent_cache.prune_cache
optimize_cache_size = agent_cache.optimize_cache_size
generate_cache_report = agent_cache.generate_cache_report
get_ttl_for_agent = agent_cache.get_ttl_for_agent


def test_cache_key_generation():
    """Test cache key generation is deterministic."""
    print("\n" + "="*60)
    print("TEST: Cache Key Generation")
    print("="*60)

    inputs1 = {
        'prompt': 'Validate Bangladesh VAT compliance',
        'files': ['services/finance/src/tax/vat.ts'],
        'parameters': {'strict': True}
    }

    # Same inputs should produce same key
    key1 = generate_cache_key('business-logic-validator', inputs1)
    key2 = generate_cache_key('business-logic-validator', inputs1)

    assert key1 == key2, "Keys should be deterministic"
    assert len(key1) == 32, "Key should be 32 characters (MD5)"

    # Different inputs should produce different key
    inputs2 = {
        'prompt': 'Different prompt',
        'files': ['services/finance/src/tax/vat.ts'],
        'parameters': {'strict': True}
    }
    key3 = generate_cache_key('business-logic-validator', inputs2)

    assert key1 != key3, "Different inputs should produce different keys"

    print(f"[OK] Key generation: {key1}")
    print(f"[OK] Deterministic: {key1 == key2}")
    print(f"[OK] Unique: {key1 != key3}")


def test_cache_storage_and_lookup():
    """Test cache storage and lookup."""
    print("\n" + "="*60)
    print("TEST: Cache Storage and Lookup")
    print("="*60)

    agent_name = 'business-logic-validator'
    inputs = {
        'prompt': 'Test prompt for caching',
        'files': [],
        'parameters': {}
    }

    # Generate cache key
    cache_key = generate_cache_key(agent_name, inputs)

    # Store in cache
    output = {
        'summary': 'Test validation completed successfully',
        'fullResult': 'Detailed validation results...',
        'artifacts': [],
        'metrics': {
            'toolCalls': 5,
            'filesRead': 3,
            'linesGenerated': 150,
            'errors': 0
        }
    }

    store_cache(
        cache_key=cache_key,
        agent_name=agent_name,
        inputs=inputs,
        output=output,
        duration_ms=180000,  # 3 minutes
        context_tokens=5000,
        ttl_hours=168  # 1 week
    )

    print(f"[OK] Stored cache entry: {cache_key[:8]}...")

    # Lookup from cache
    cached = lookup_cache(cache_key, agent_name)

    assert cached is not None, "Cache lookup should return entry"
    assert cached['agentName'] == agent_name, "Agent name should match"
    assert cached['output']['summary'] == output['summary'], "Output should match"

    print(f"[OK] Cache lookup successful")
    print(f"[OK] Cache hit saved: {cached['metadata']['durationMs']/1000:.1f}s")


def test_ttl_configuration():
    """Test agent-specific TTL configuration."""
    print("\n" + "="*60)
    print("TEST: TTL Configuration")
    print("="*60)

    ttls = {
        'business-logic-validator': 168,  # 1 week
        'api-integration-tester': 48,     # 2 days
        'performance-profiler': 72,       # 3 days
        'data-migration-specialist': 24,  # 1 day
        'unknown-agent': 24               # default
    }

    for agent, expected_ttl in ttls.items():
        actual_ttl = get_ttl_for_agent(agent)
        assert actual_ttl == expected_ttl, f"TTL for {agent} should be {expected_ttl}"
        print(f"[OK] {agent}: {actual_ttl} hours")


def test_cache_invalidation():
    """Test cache invalidation."""
    print("\n" + "="*60)
    print("TEST: Cache Invalidation")
    print("="*60)

    # Create test cache entries
    agent_name = 'test-agent'
    for i in range(3):
        inputs = {'prompt': f'Test prompt {i}', 'files': [], 'parameters': {}}
        cache_key = generate_cache_key(agent_name, inputs)
        output = {'summary': f'Test result {i}', 'fullResult': 'Details...'}

        store_cache(cache_key, agent_name, inputs, output, 1000, 100, 24)

    print(f"[OK] Created 3 test cache entries")

    # Invalidate all entries for agent
    count = invalidate_cache(None, agent_name)
    assert count == 3, "Should invalidate 3 entries"

    print(f"[OK] Invalidated {count} entries")


def test_cache_statistics():
    """Test cache statistics tracking."""
    print("\n" + "="*60)
    print("TEST: Cache Statistics")
    print("="*60)

    report = generate_cache_report()
    assert report is not None, "Report should be generated"

    print(f"[OK] Statistics report generated")
    print(report[:200] + "...")


def test_bangladesh_scenarios():
    """Test Bangladesh ERP specific scenarios."""
    print("\n" + "="*60)
    print("TEST: Bangladesh ERP Scenarios")
    print("="*60)

    scenarios = [
        {
            'agent': 'business-logic-validator',
            'prompt': 'Validate TIN format: 1234567890',
            'expected_ttl': 168
        },
        {
            'agent': 'api-integration-tester',
            'prompt': 'Test bKash payment gateway integration',
            'expected_ttl': 48
        },
        {
            'agent': 'performance-profiler',
            'prompt': 'Establish baseline for finance service',
            'expected_ttl': 72
        },
        {
            'agent': 'data-migration-specialist',
            'prompt': 'Analyze fiscal year partitioning migration',
            'expected_ttl': 24
        }
    ]

    for scenario in scenarios:
        inputs = {'prompt': scenario['prompt'], 'files': [], 'parameters': {}}
        cache_key = generate_cache_key(scenario['agent'], inputs)
        ttl = get_ttl_for_agent(scenario['agent'])

        assert ttl == scenario['expected_ttl'], f"TTL should be {scenario['expected_ttl']}"

        print(f"[OK] {scenario['agent']}: TTL={ttl}h")


def run_all_tests():
    """Run all tests."""
    print("\n" + "="*60)
    print("AGENT CACHE SYSTEM - COMPREHENSIVE TEST SUITE")
    print("="*60)

    try:
        test_cache_key_generation()
        test_ttl_configuration()
        test_cache_storage_and_lookup()
        test_cache_invalidation()
        test_cache_statistics()
        test_bangladesh_scenarios()

        print("\n" + "="*60)
        print("[OK] ALL TESTS PASSED")
        print("="*60)
        print("\nCache system is ready for production use!")
        return 0

    except AssertionError as e:
        print(f"\n[FAIL] TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n[FAIL] ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(run_all_tests())
