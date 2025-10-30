#!/usr/bin/env python3
"""
Task Complexity Scorer - Phase 2 Cost Optimization
Analyzes task characteristics to determine optimal model (Sonnet vs Haiku)

Complexity Scoring System:
- 0-30: Low complexity → Haiku 4.5
- 31-60: Medium complexity → Haiku with Sonnet review
- 61-100: High complexity → Sonnet 4.5

Factors considered:
- File changes (quantity, type, risk level)
- Code changes (lines, functions, patterns)
- Domain complexity (payment, security, auth, etc.)
- Risk factors (production impact, breaking changes)
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Risk keywords that increase complexity score
HIGH_RISK_KEYWORDS = [
    'payment', 'security', 'auth', 'authentication', 'authorization',
    'invoice', 'transaction', 'finance', 'migration', 'event sourcing',
    'graphql', 'federation', 'encryption', 'jwt', 'token'
]

HIGH_RISK_FILE_PATTERNS = [
    r'auth', r'security', r'payment', r'invoice', r'transaction',
    r'migration', r'\.graphql$', r'schema\.', r'database',
    r'config', r'env'
]

CRITICAL_SQL_PATTERNS = [
    r'DROP\s+TABLE', r'ALTER\s+TABLE', r'DELETE\s+FROM',
    r'TRUNCATE', r'DROP\s+DATABASE', r'executeRaw',
    r'rawQuery', r'unsafeRaw'
]


def analyze_file_changes(files_changed: List[str]) -> Tuple[int, Dict]:
    """
    Analyze file changes to determine complexity contribution.

    Returns:
        (score, details) - Score 0-40, details dict with breakdown
    """
    score = 0
    details = {
        'num_files': len(files_changed),
        'high_risk_files': [],
        'file_type_distribution': {}
    }

    # File quantity scoring
    if len(files_changed) > 20:
        score += 30
    elif len(files_changed) > 10:
        score += 20
    elif len(files_changed) > 5:
        score += 10

    # File type and risk analysis
    for file_path in files_changed:
        file_lower = file_path.lower()

        # Check for high-risk file patterns
        for pattern in HIGH_RISK_FILE_PATTERNS:
            if re.search(pattern, file_lower):
                score += 5
                details['high_risk_files'].append(file_path)
                break

        # File type distribution
        ext = Path(file_path).suffix
        if ext:
            details['file_type_distribution'][ext] = \
                details['file_type_distribution'].get(ext, 0) + 1

        # Specific file type complexity
        if file_path.endswith('.graphql'):
            score += 8
        elif 'migration' in file_lower:
            score += 10
        elif file_path.endswith(('.md', '.txt', '.json')):
            score -= 2  # Documentation/config reduces complexity

    return min(score, 40), details


def analyze_code_changes(git_diff: Optional[str] = None,
                        lines_changed: int = 0,
                        functions_added: int = 0) -> Tuple[int, Dict]:
    """
    Analyze code changes to determine complexity contribution.

    Returns:
        (score, details) - Score 0-30, details dict with breakdown
    """
    score = 0
    details = {
        'lines_changed': lines_changed,
        'functions_added': functions_added,
        'critical_patterns': []
    }

    # Lines changed scoring
    if lines_changed > 1000:
        score += 20
    elif lines_changed > 500:
        score += 15
    elif lines_changed > 200:
        score += 10
    elif lines_changed > 100:
        score += 5

    # Functions added scoring
    if functions_added > 20:
        score += 10
    elif functions_added > 10:
        score += 7
    elif functions_added > 5:
        score += 5

    # Critical pattern detection in git diff
    if git_diff:
        for pattern in CRITICAL_SQL_PATTERNS:
            if re.search(pattern, git_diff, re.IGNORECASE):
                score += 15
                details['critical_patterns'].append(pattern)

    return min(score, 30), details


def analyze_domain_complexity(task_description: str,
                              task_name: str = "") -> Tuple[int, Dict]:
    """
    Analyze domain complexity from task description.

    Returns:
        (score, details) - Score 0-25, details dict with breakdown
    """
    score = 0
    details = {
        'high_risk_keywords_found': [],
        'domain_category': 'general'
    }

    # Combine task name and description for analysis
    full_text = f"{task_name} {task_description}".lower()

    # Check for high-risk keywords
    for keyword in HIGH_RISK_KEYWORDS:
        if keyword in full_text:
            score += 3
            details['high_risk_keywords_found'].append(keyword)

    # Domain categorization
    if any(k in full_text for k in ['payment', 'invoice', 'transaction', 'finance']):
        details['domain_category'] = 'finance'
        score += 5
    elif any(k in full_text for k in ['auth', 'security', 'encryption']):
        details['domain_category'] = 'security'
        score += 8
    elif any(k in full_text for k in ['migration', 'database', 'schema']):
        details['domain_category'] = 'database'
        score += 7
    elif any(k in full_text for k in ['graphql', 'federation', 'api']):
        details['domain_category'] = 'api'
        score += 5

    return min(score, 25), details


def analyze_risk_factors(affects_production: bool = False,
                        breaking_change: bool = False,
                        has_tests: bool = True) -> Tuple[int, Dict]:
    """
    Analyze risk factors that increase complexity.

    Returns:
        (score, details) - Score 0-35, details dict with breakdown
    """
    score = 0
    details = {
        'affects_production': affects_production,
        'breaking_change': breaking_change,
        'has_tests': has_tests
    }

    if affects_production:
        score += 20

    if breaking_change:
        score += 15

    if not has_tests:
        score += 10

    return min(score, 35), details


def calculate_task_complexity(
    files_changed: Optional[List[str]] = None,
    git_diff: Optional[str] = None,
    lines_changed: int = 0,
    functions_added: int = 0,
    task_description: str = "",
    task_name: str = "",
    affects_production: bool = False,
    breaking_change: bool = False,
    has_tests: bool = True
) -> Dict:
    """
    Calculate overall task complexity score (0-100).

    Args:
        files_changed: List of file paths changed
        git_diff: Git diff output (optional)
        lines_changed: Number of lines changed
        functions_added: Number of new functions
        task_description: Task description text
        task_name: Task name
        affects_production: Whether change affects production
        breaking_change: Whether change is breaking
        has_tests: Whether tests are included

    Returns:
        Dict with overall score, recommendation, and breakdown
    """

    # Initialize scores
    file_score = 0
    code_score = 0
    domain_score = 0
    risk_score = 0

    details = {
        'file_analysis': {},
        'code_analysis': {},
        'domain_analysis': {},
        'risk_analysis': {}
    }

    # Analyze each component
    if files_changed:
        file_score, details['file_analysis'] = analyze_file_changes(files_changed)

    code_score, details['code_analysis'] = analyze_code_changes(
        git_diff, lines_changed, functions_added
    )

    domain_score, details['domain_analysis'] = analyze_domain_complexity(
        task_description, task_name
    )

    risk_score, details['risk_analysis'] = analyze_risk_factors(
        affects_production, breaking_change, has_tests
    )

    # Calculate total score (max 130 possible, capped at 100, min 0)
    total_score = file_score + code_score + domain_score + risk_score
    final_score = max(0, min(total_score, 100))

    # Determine model recommendation
    if final_score < 30:
        model_recommendation = "haiku-4.5"
        reasoning = "Low complexity task - Haiku can handle efficiently"
        estimated_cost = "Low ($0.005-0.02 per invocation)"
    elif final_score < 60:
        model_recommendation = "haiku-with-sonnet-review"
        reasoning = "Medium complexity - Use Haiku with Sonnet review"
        estimated_cost = "Medium ($0.02-0.08 per invocation)"
    else:
        model_recommendation = "sonnet-4.5"
        reasoning = "High complexity task - Sonnet recommended for quality"
        estimated_cost = "High ($0.08-0.40 per invocation)"

    return {
        'complexity_score': final_score,
        'model_recommendation': model_recommendation,
        'reasoning': reasoning,
        'estimated_cost': estimated_cost,
        'breakdown': {
            'file_complexity': file_score,
            'code_complexity': code_score,
            'domain_complexity': domain_score,
            'risk_factors': risk_score
        },
        'details': details
    }


def get_complexity_from_git() -> Dict:
    """
    Calculate complexity from current git state.
    Useful for analyzing uncommitted changes.

    Returns:
        Complexity analysis dict
    """
    import subprocess

    try:
        # Get list of changed files
        result = subprocess.run(
            ['git', 'diff', '--name-only', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        files_changed = result.stdout.strip().split('\n')
        files_changed = [f for f in files_changed if f]  # Remove empty

        # Get git diff
        result = subprocess.run(
            ['git', 'diff', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        git_diff = result.stdout

        # Count lines changed
        result = subprocess.run(
            ['git', 'diff', '--stat', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        stat_output = result.stdout

        # Parse lines changed from stat output
        lines_changed = 0
        match = re.search(r'(\d+) insertions?\(\+\), (\d+) deletions?', stat_output)
        if match:
            lines_changed = int(match.group(1)) + int(match.group(2))

        # Estimate functions added (rough heuristic)
        functions_added = git_diff.count('def ') + git_diff.count('function ')

        return calculate_task_complexity(
            files_changed=files_changed,
            git_diff=git_diff,
            lines_changed=lines_changed,
            functions_added=functions_added
        )

    except subprocess.CalledProcessError:
        return {
            'error': 'Unable to analyze git changes',
            'complexity_score': 50,  # Default to medium
            'model_recommendation': 'sonnet-4.5'  # Conservative default
        }


# Test function
def test_complexity_scorer():
    """Test the complexity scorer with sample scenarios."""

    print("\n" + "="*70)
    print("COMPLEXITY SCORER TEST SUITE")
    print("="*70)

    # Test 1: Simple documentation update
    print("\n[TEST 1] Simple documentation update:")
    result = calculate_task_complexity(
        files_changed=['docs/README.md', 'docs/api-guide.md'],
        lines_changed=50,
        functions_added=0,
        task_description="Update documentation with new examples"
    )
    print(f"  Score: {result['complexity_score']}/100")
    print(f"  Model: {result['model_recommendation']}")
    print(f"  Cost: {result['estimated_cost']}")
    print(f"  Reasoning: {result['reasoning']}")

    # Test 2: Medium complexity feature
    print("\n[TEST 2] Medium complexity feature (new API endpoint):")
    result = calculate_task_complexity(
        files_changed=[
            'services/finance/src/graphql/resolvers/invoice.resolver.ts',
            'services/finance/src/graphql/schema/invoice.graphql',
            'services/finance/src/domain/aggregates/invoice.ts'
        ],
        lines_changed=250,
        functions_added=5,
        task_description="Add new GraphQL query for invoice summary"
    )
    print(f"  Score: {result['complexity_score']}/100")
    print(f"  Model: {result['model_recommendation']}")
    print(f"  Cost: {result['estimated_cost']}")
    print(f"  Reasoning: {result['reasoning']}")

    # Test 3: High complexity (payment + security)
    print("\n[TEST 3] High complexity (payment security feature):")
    result = calculate_task_complexity(
        files_changed=[
            'services/finance/src/domain/aggregates/payment.ts',
            'services/finance/src/security/payment-validator.ts',
            'services/auth/src/middleware/payment-auth.ts'
        ],
        lines_changed=600,
        functions_added=12,
        task_description="Implement payment authentication and encryption",
        affects_production=True,
        has_tests=True
    )
    print(f"  Score: {result['complexity_score']}/100")
    print(f"  Model: {result['model_recommendation']}")
    print(f"  Cost: {result['estimated_cost']}")
    print(f"  Reasoning: {result['reasoning']}")

    # Test 4: Database migration
    print("\n[TEST 4] Database migration (very high risk):")
    result = calculate_task_complexity(
        files_changed=[
            'services/finance/migrations/001-add-payment-table.sql',
            'services/finance/src/domain/aggregates/payment.ts'
        ],
        git_diff="ALTER TABLE payments ADD COLUMN encrypted_data TEXT;",
        lines_changed=150,
        functions_added=3,
        task_description="Add encrypted payment data column to database",
        affects_production=True,
        breaking_change=False
    )
    print(f"  Score: {result['complexity_score']}/100")
    print(f"  Model: {result['model_recommendation']}")
    print(f"  Cost: {result['estimated_cost']}")
    print(f"  Reasoning: {result['reasoning']}")

    print("\n" + "="*70)
    print("TEST SUITE COMPLETE")
    print("="*70 + "\n")


if __name__ == '__main__':
    # Run test suite
    test_complexity_scorer()
