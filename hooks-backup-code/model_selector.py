#!/usr/bin/env python3
"""
Model Selector - Phase 2 Cost Optimization
Orchestrates dynamic model selection based on task complexity

Model Selection Strategy:
- Complexity 0-30: Haiku 4.5 only (70% of tasks)
- Complexity 31-60: Haiku with Sonnet review (20% of tasks)
- Complexity 61-100: Sonnet 4.5 only (10% of tasks)

Cost Comparison (per 1M tokens):
- Haiku: $0.80 input / $4.00 output
- Sonnet: $3.00 input / $15.00 output
- Sonnet is 3.75x more expensive for input, 3.75x for output

Expected Savings:
- Current: 50% Sonnet, 50% Haiku = $500/month baseline
- Optimized: 20% Sonnet, 80% Haiku = $250-300/month (40-50% reduction)
"""

import json
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple
from complexity_scorer import calculate_task_complexity, get_complexity_from_git


class ModelSelector:
    """Intelligent model selection based on task complexity."""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize model selector.

        Args:
            config_path: Path to configuration file (optional)
        """
        self.config = self._load_config(config_path)

    def _load_config(self, config_path: Optional[Path]) -> Dict:
        """Load configuration with defaults."""
        default_config = {
            'enabled': True,
            'auto_model_selection': True,
            'thresholds': {
                'haiku_max': 30,      # 0-30: Haiku only
                'sonnet_min': 60      # 61-100: Sonnet only
            },
            'cost_limits': {
                'monthly_budget_usd': 500,
                'daily_budget_usd': 20,
                'alert_threshold_pct': 80
            },
            'overrides': {
                'always_sonnet': [
                    'payment', 'security', 'auth', 'migration',
                    'encryption', 'transaction'
                ],
                'always_haiku': [
                    'documentation', 'tests', 'refactor-simple'
                ]
            }
        }

        if config_path and config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    user_config = json.load(f).get('optimization', {}).get('cost', {})
                    # Merge with defaults
                    default_config.update(user_config)
            except Exception:
                pass

        return default_config

    def check_overrides(self, task_name: str, task_description: str) -> Optional[str]:
        """
        Check if task matches override rules.

        Returns:
            Model name if override applies, None otherwise
        """
        full_text = f"{task_name} {task_description}".lower()

        # Check always_sonnet keywords
        for keyword in self.config['overrides']['always_sonnet']:
            if keyword.lower() in full_text:
                return 'sonnet-4.5'

        # Check always_haiku keywords
        for keyword in self.config['overrides']['always_haiku']:
            if keyword.lower() in full_text:
                return 'haiku-4.5'

        return None

    def select_model(self,
                    complexity_analysis: Dict,
                    task_name: str = "",
                    task_description: str = "",
                    user_override: Optional[str] = None) -> Dict:
        """
        Select optimal model based on complexity analysis.

        Args:
            complexity_analysis: Result from complexity_scorer
            task_name: Task name for override checking
            task_description: Task description for override checking
            user_override: User's manual override (if any)

        Returns:
            Dict with model selection and reasoning
        """

        # Check if model selection is disabled
        if not self.config['enabled'] or not self.config['auto_model_selection']:
            return {
                'model': 'sonnet-4.5',  # Conservative default
                'reason': 'Automatic model selection disabled',
                'selection_method': 'disabled'
            }

        # User override has highest priority
        if user_override:
            return {
                'model': user_override,
                'reason': 'User manually selected model',
                'selection_method': 'user_override',
                'complexity_score': complexity_analysis.get('complexity_score', 0)
            }

        # Check override rules
        override_model = self.check_overrides(task_name, task_description)
        if override_model:
            return {
                'model': override_model,
                'reason': f'Task matches override rule for {override_model}',
                'selection_method': 'rule_override',
                'complexity_score': complexity_analysis.get('complexity_score', 0)
            }

        # Complexity-based selection
        score = complexity_analysis.get('complexity_score', 50)
        haiku_max = self.config['thresholds']['haiku_max']
        sonnet_min = self.config['thresholds']['sonnet_min']

        if score <= haiku_max:
            return {
                'model': 'haiku-4.5',
                'reason': f'Low complexity ({score}/100) - Haiku can handle efficiently',
                'selection_method': 'complexity_based',
                'complexity_score': score,
                'cost_estimate': 'Low ($0.005-0.02)',
                'quality_notes': 'Haiku achieves 73% on SWE-bench for simple tasks'
            }

        elif score < sonnet_min:
            return {
                'model': 'haiku-with-sonnet-review',
                'reason': f'Medium complexity ({score}/100) - Use Haiku with Sonnet review',
                'selection_method': 'complexity_based',
                'complexity_score': score,
                'cost_estimate': 'Medium ($0.02-0.08)',
                'quality_notes': 'Haiku implementation reviewed by Sonnet for quality',
                'workflow': [
                    '1. Haiku implements solution',
                    '2. Sonnet reviews for correctness',
                    '3. Integrate if approved, iterate if not'
                ]
            }

        else:
            return {
                'model': 'sonnet-4.5',
                'reason': f'High complexity ({score}/100) - Sonnet recommended for quality',
                'selection_method': 'complexity_based',
                'complexity_score': score,
                'cost_estimate': 'High ($0.08-0.40)',
                'quality_notes': 'Sonnet achieves 77% on SWE-bench, best for complex tasks'
            }

    def estimate_cost_savings(self, current_usage: Dict) -> Dict:
        """
        Estimate potential cost savings from optimal model selection.

        Args:
            current_usage: Dict with current Sonnet/Haiku distribution

        Returns:
            Dict with savings estimate
        """
        # Current costs (based on typical usage)
        sonnet_pct = current_usage.get('sonnet_pct', 50)
        haiku_pct = current_usage.get('haiku_pct', 50)
        monthly_cost = current_usage.get('monthly_cost_usd', 500)

        # Estimate optimal distribution (from complexity analysis)
        # Typical: 70% low complexity, 20% medium, 10% high
        optimal_haiku_pct = 70 + (20 * 0.5)  # 70% pure Haiku + 50% of medium complexity
        optimal_sonnet_pct = 10 + (20 * 0.5)  # 10% pure Sonnet + 50% of medium complexity

        # Cost calculation (Sonnet is ~4x more expensive)
        current_cost_factor = (sonnet_pct * 4) + (haiku_pct * 1)
        optimal_cost_factor = (optimal_sonnet_pct * 4) + (optimal_haiku_pct * 1)

        reduction_pct = ((current_cost_factor - optimal_cost_factor) / current_cost_factor) * 100
        estimated_new_cost = monthly_cost * (optimal_cost_factor / current_cost_factor)
        estimated_savings = monthly_cost - estimated_new_cost

        return {
            'current': {
                'sonnet_pct': sonnet_pct,
                'haiku_pct': haiku_pct,
                'monthly_cost_usd': monthly_cost
            },
            'optimized': {
                'sonnet_pct': optimal_sonnet_pct,
                'haiku_pct': optimal_haiku_pct,
                'monthly_cost_usd': estimated_new_cost
            },
            'savings': {
                'monthly_usd': estimated_savings,
                'annual_usd': estimated_savings * 12,
                'reduction_pct': reduction_pct
            },
            'recommendation': f'Shift {sonnet_pct - optimal_sonnet_pct:.0f}% of workload from Sonnet to Haiku'
        }

    def get_model_recommendation_for_task(self,
                                         task_name: str = "",
                                         task_description: str = "",
                                         files_changed: Optional[list] = None,
                                         git_diff: Optional[str] = None) -> Dict:
        """
        Convenience method to get model recommendation for a task.

        Args:
            task_name: Task name
            task_description: Task description
            files_changed: List of changed files
            git_diff: Git diff output

        Returns:
            Dict with model recommendation and full analysis
        """
        # Calculate complexity
        if files_changed or git_diff:
            complexity_analysis = calculate_task_complexity(
                files_changed=files_changed,
                git_diff=git_diff,
                task_description=task_description,
                task_name=task_name
            )
        else:
            # Use git to analyze current changes
            complexity_analysis = get_complexity_from_git()

        # Select model
        selection = self.select_model(
            complexity_analysis,
            task_name=task_name,
            task_description=task_description
        )

        # Combine results
        return {
            'model': selection['model'],
            'reason': selection['reason'],
            'complexity_analysis': complexity_analysis,
            'selection_details': selection
        }


def display_recommendation(recommendation: Dict):
    """Display model recommendation in a user-friendly format."""
    print("\n" + "="*70)
    print("MODEL SELECTION RECOMMENDATION")
    print("="*70)

    print(f"\n[RECOMMENDED MODEL]: {recommendation['model'].upper()}")
    print(f"\n[REASON]: {recommendation['reason']}")

    if 'complexity_analysis' in recommendation:
        complexity = recommendation['complexity_analysis']
        print(f"\n[COMPLEXITY SCORE]: {complexity.get('complexity_score', 0)}/100")

        if 'breakdown' in complexity:
            breakdown = complexity['breakdown']
            print("\n[BREAKDOWN]:")
            print(f"  - File Complexity:   {breakdown.get('file_complexity', 0)}/40")
            print(f"  - Code Complexity:   {breakdown.get('code_complexity', 0)}/30")
            print(f"  - Domain Complexity: {breakdown.get('domain_complexity', 0)}/25")
            print(f"  - Risk Factors:      {breakdown.get('risk_factors', 0)}/35")

    if 'selection_details' in recommendation:
        details = recommendation['selection_details']

        if 'cost_estimate' in details:
            print(f"\n[ESTIMATED COST]: {details['cost_estimate']}")

        if 'quality_notes' in details:
            print(f"\n[QUALITY NOTES]: {details['quality_notes']}")

        if 'workflow' in details:
            print("\n[WORKFLOW]:")
            for step in details['workflow']:
                print(f"  {step}")

    print("\n" + "="*70 + "\n")


# CLI interface
def main():
    """CLI for model selection testing."""
    import argparse

    parser = argparse.ArgumentParser(description='Model Selection Tool')
    parser.add_argument('--task-name', default='', help='Task name')
    parser.add_argument('--task-description', default='', help='Task description')
    parser.add_argument('--from-git', action='store_true', help='Analyze current git changes')
    parser.add_argument('--test', action='store_true', help='Run test scenarios')
    parser.add_argument('--savings', action='store_true', help='Show cost savings estimate')

    args = parser.parse_args()

    selector = ModelSelector()

    if args.test:
        # Run test scenarios
        print("\n" + "="*70)
        print("MODEL SELECTOR TEST SCENARIOS")
        print("="*70)

        # Test 1: Documentation update
        print("\n[TEST 1] Documentation update:")
        rec = selector.get_model_recommendation_for_task(
            task_name="Update API documentation",
            task_description="Add examples to REST API docs",
            files_changed=['docs/api/rest.md', 'docs/api/examples.md']
        )
        print(f"  Model: {rec['model']}")
        print(f"  Score: {rec['complexity_analysis'].get('complexity_score', 0)}/100")

        # Test 2: Medium complexity feature
        print("\n[TEST 2] Medium complexity feature:")
        rec = selector.get_model_recommendation_for_task(
            task_name="Add invoice filtering API",
            task_description="Add GraphQL query for filtering invoices by date range",
            files_changed=[
                'services/finance/src/graphql/resolvers/invoice.resolver.ts',
                'services/finance/src/graphql/schema/invoice.graphql'
            ]
        )
        print(f"  Model: {rec['model']}")
        print(f"  Score: {rec['complexity_analysis'].get('complexity_score', 0)}/100")

        # Test 3: High complexity (payment security)
        print("\n[TEST 3] Payment security implementation:")
        rec = selector.get_model_recommendation_for_task(
            task_name="Implement payment encryption",
            task_description="Add end-to-end encryption for payment processing with JWT tokens",
            files_changed=[
                'services/finance/src/security/payment-encryption.ts',
                'services/finance/src/domain/aggregates/payment.ts',
                'services/auth/src/middleware/payment-auth.ts'
            ]
        )
        print(f"  Model: {rec['model']}")
        print(f"  Score: {rec['complexity_analysis'].get('complexity_score', 0)}/100")

        print("\n" + "="*70 + "\n")

    elif args.savings:
        # Show cost savings estimate
        print("\n" + "="*70)
        print("COST SAVINGS ESTIMATE")
        print("="*70)

        estimate = selector.estimate_cost_savings({
            'sonnet_pct': 50,
            'haiku_pct': 50,
            'monthly_cost_usd': 500
        })

        print(f"\n[CURRENT USAGE]:")
        print(f"  Sonnet: {estimate['current']['sonnet_pct']:.0f}%")
        print(f"  Haiku:  {estimate['current']['haiku_pct']:.0f}%")
        print(f"  Cost:   ${estimate['current']['monthly_cost_usd']:.2f}/month")

        print(f"\n[OPTIMIZED USAGE]:")
        print(f"  Sonnet: {estimate['optimized']['sonnet_pct']:.0f}%")
        print(f"  Haiku:  {estimate['optimized']['haiku_pct']:.0f}%")
        print(f"  Cost:   ${estimate['optimized']['monthly_cost_usd']:.2f}/month")

        print(f"\n[ESTIMATED SAVINGS]:")
        print(f"  Monthly:  ${estimate['savings']['monthly_usd']:.2f}")
        print(f"  Annual:   ${estimate['savings']['annual_usd']:.2f}")
        print(f"  Reduction: {estimate['savings']['reduction_pct']:.1f}%")

        print(f"\n[RECOMMENDATION]: {estimate['recommendation']}")
        print("\n" + "="*70 + "\n")

    elif args.from_git:
        # Analyze current git changes
        print("\nAnalyzing current git changes...")
        rec = selector.get_model_recommendation_for_task(
            task_name=args.task_name,
            task_description=args.task_description
        )
        display_recommendation(rec)

    else:
        # Manual task analysis
        if not args.task_name and not args.task_description:
            print("Error: Provide --task-name or --task-description, or use --from-git")
            print("Or use --test to run test scenarios")
            sys.exit(1)

        rec = selector.get_model_recommendation_for_task(
            task_name=args.task_name,
            task_description=args.task_description
        )
        display_recommendation(rec)


if __name__ == '__main__':
    main()
