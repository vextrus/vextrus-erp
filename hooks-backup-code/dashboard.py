#!/usr/bin/env python3
"""
Multi-Agent Performance Dashboard
Display cost, performance, and optimization insights
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Import monitoring modules
try:
    from cost_tracker import (
        load_cost_tracking,
        get_current_month_summary,
        get_optimization_suggestions as get_cost_suggestions
    )
    from agent_metrics import (
        load_agent_metrics,
        get_agent_performance_summary,
        get_category_summary,
        get_performance_recommendations
    )
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    print("Error: Monitoring modules not available")
    sys.exit(1)

# Import Phase 2 model selection (optional)
try:
    from model_selector import ModelSelector
    MODEL_SELECTION_AVAILABLE = True
except ImportError:
    MODEL_SELECTION_AVAILABLE = False


def format_currency(amount: float) -> str:
    """Format currency with appropriate precision"""
    return f"${amount:.2f}"


def format_percentage(value: float) -> str:
    """Format percentage with 1 decimal"""
    return f"{value:.1f}%"


def draw_bar(value: float, max_value: float, width: int = 30) -> str:
    """Draw a simple ASCII progress bar"""
    if max_value == 0:
        filled = 0
    else:
        filled = int((value / max_value) * width)

    bar = "#" * filled + "-" * (width - filled)
    return bar


def get_status_indicator(success_rate: float) -> str:
    """Get status indicator based on success rate"""
    if success_rate >= 0.95:
        return "[EXCELLENT]"
    elif success_rate >= 0.90:
        return "[GOOD    ]"
    elif success_rate >= 0.85:
        return "[NEEDS-IMPROVE]"
    else:
        return "[REVIEW-NEEDED]"


def print_header(title: str):
    """Print a section header"""
    print(f"\n+{'=' * 66}+")
    print(f"| {title:^64} |")
    print(f"+{'=' * 66}+")


def print_separator():
    """Print a separator line"""
    print(f"  {'-' * 62}")


def display_cost_summary():
    """Display cost summary section"""
    print_header("Cost Summary")

    summary = get_current_month_summary()

    # Budget status
    budget_pct = summary["spend_pct"]
    budget_bar = draw_bar(summary["total_cost_usd"], summary["budget_usd"], 40)

    print(f"\n  Budget ({summary['month']}):")
    print(f"    Spent:     {format_currency(summary['total_cost_usd']):>10}  ({format_percentage(budget_pct)})")
    print(f"    Remaining: {format_currency(summary['budget_remaining_usd']):>10}")
    print(f"    Total:     {format_currency(summary['budget_usd']):>10}")
    print(f"    [{budget_bar}]")

    # Budget status indicator
    if budget_pct >= 100:
        print(f"    Status: [WARNING] BUDGET EXCEEDED")
    elif budget_pct >= 80:
        print(f"    Status: [WARNING] Approaching limit ({format_percentage(budget_pct)})")
    else:
        print(f"    Status: [OK] On track")

    # Model distribution
    if summary["total_cost_usd"] > 0:
        print(f"\n  Model Usage:")
        print(f"    Sonnet 4.5: {format_currency(summary['sonnet_cost_usd']):>10}  ({format_percentage(summary['sonnet_pct'])})")
        print(f"    Haiku 4.5:  {format_currency(summary['haiku_cost_usd']):>10}  ({format_percentage(summary['haiku_pct'])})")

        # Show optimization opportunity
        if summary["sonnet_pct"] > 40:
            potential_savings = summary["sonnet_cost_usd"] * 0.3  # Estimate 30% could shift to Haiku
            print(f"\n  [OPTIMIZATION TIP]:")
            print(f"     Shift 15-20% workload to Haiku -> Save ~{format_currency(potential_savings)}/month")

    # Top cost categories
    if summary.get("by_category"):
        print(f"\n  Top Cost Categories:")
        categories_sorted = sorted(
            summary["by_category"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        for category, cost in categories_sorted:
            category_pct = (cost / summary["total_cost_usd"]) * 100 if summary["total_cost_usd"] > 0 else 0
            bar = draw_bar(cost, summary["total_cost_usd"], 25)
            print(f"    {category:25s} {format_currency(cost):>8}  [{bar}] {format_percentage(category_pct)}")


def display_agent_performance():
    """Display agent performance section"""
    print_header("Agent Performance")

    metrics = load_agent_metrics()
    summary = metrics["summary"]

    print(f"\n  Overview:")
    print(f"    Total Agents:      {summary['total_agents']}")
    print(f"    Total Invocations: {summary['total_invocations']}")
    print(f"    Avg Success Rate:  {format_percentage(summary['avg_success_rate'] * 100)}")

    # Top agents by usage
    if summary.get("top_agents_by_usage"):
        print(f"\n  Top Agents (by invocations):")
        for agent_info in summary["top_agents_by_usage"][:5]:
            agent_name = agent_info["agent"]
            invocations = agent_info["invocations"]

            # Get performance summary
            perf = get_agent_performance_summary(agent_name)
            if perf:
                status = get_status_indicator(perf["metrics"]["success_rate"])
                success_pct = format_percentage(perf["metrics"]["success_rate"] * 100)
                cost = format_currency(perf["metrics"]["avg_cost_usd"])

                print(f"    {status} {agent_name[:35]:35s}")
                print(f"       Uses: {invocations:3d}  Success: {success_pct}  Avg Cost: {cost}")

    # Agents needing improvement
    if summary.get("agents_needing_improvement"):
        print(f"\n  [NEEDS IMPROVEMENT] Agents:")
        for agent_info in summary["agents_needing_improvement"][:3]:
            agent_name = agent_info["agent"]
            success_rate = agent_info["success_rate"]
            print(f"    - {agent_name}")
            print(f"      Success Rate: {format_percentage(success_rate * 100)} (target: >85%)")

    # Category performance
    print(f"\n  Performance by Category:")
    for category in ["backend-development", "quality-testing", "compounding-engineering"]:
        cat_summary = get_category_summary(category)
        if cat_summary and cat_summary["total_invocations"] > 0:
            success_bar = draw_bar(cat_summary["avg_success_rate"], 1.0, 20)
            print(f"    {category:25s} Success: [{success_bar}] {format_percentage(cat_summary['avg_success_rate'] * 100)}")


def display_recommendations():
    """Display optimization recommendations"""
    print_header("Optimization Recommendations")

    # Cost recommendations
    cost_suggestions = get_cost_suggestions()
    perf_recommendations = get_performance_recommendations()

    all_recommendations = []

    # Add cost recommendations
    for suggestion in cost_suggestions:
        all_recommendations.append({
            "priority": suggestion.get("priority", "medium"),
            "type": "cost",
            "message": suggestion["message"],
            "action": suggestion["action"]
        })

    # Add performance recommendations
    for recommendation in perf_recommendations:
        all_recommendations.append({
            "priority": recommendation.get("priority", "medium"),
            "type": recommendation.get("type", "performance"),
            "message": recommendation["message"],
            "action": recommendation["action"]
        })

    # Add Phase 2 model selection recommendations
    if MODEL_SELECTION_AVAILABLE:
        try:
            selector = ModelSelector()
            summary = get_current_month_summary()

            # Get cost savings estimate
            savings_estimate = selector.estimate_cost_savings({
                'sonnet_pct': summary.get('sonnet_pct', 50),
                'haiku_pct': summary.get('haiku_pct', 50),
                'monthly_cost_usd': summary.get('total_cost_usd', 0)
            })

            # Add recommendation if significant savings possible
            if savings_estimate['savings']['reduction_pct'] > 10:
                all_recommendations.append({
                    "priority": "high",
                    "type": "cost-optimization",
                    "message": f"Phase 2 active: AI model selection can save ${savings_estimate['savings']['monthly_usd']:.2f}/month",
                    "action": savings_estimate['recommendation']
                })
        except Exception:
            pass

    if not all_recommendations:
        print(f"\n  [OK] No recommendations - system running optimally!")
        return

    # Group by priority
    high_priority = [r for r in all_recommendations if r["priority"] == "high"]
    medium_priority = [r for r in all_recommendations if r["priority"] == "medium"]
    low_priority = [r for r in all_recommendations if r["priority"] == "low"]

    if high_priority:
        print(f"\n  [HIGH PRIORITY]:")
        for rec in high_priority:
            print(f"    [{rec['type'].upper()}] {rec['message']}")
            print(f"      -> Action: {rec['action']}")

    if medium_priority:
        print(f"\n  [MEDIUM PRIORITY]:")
        for rec in medium_priority[:3]:  # Limit to top 3
            print(f"    [{rec['type'].upper()}] {rec['message']}")
            print(f"      -> Action: {rec['action']}")

    if low_priority:
        print(f"\n  [LOW PRIORITY]: {len(low_priority)} optimization opportunities")


def display_quick_stats():
    """Display quick stats summary (for session-start hook)"""
    summary = get_current_month_summary()
    metrics = load_agent_metrics()

    print(f"\n+{'-' * 66}+")
    print(f"| Multi-Agent System - Quick Stats                                |")
    print(f"+{'-' * 66}+")
    print(f"| Budget: {format_currency(summary['total_cost_usd']):>10} / {format_currency(summary['budget_usd']):>10} ({format_percentage(summary['spend_pct']):>6}) |")
    print(f"| Agents: {metrics['summary']['total_agents']:>3} active  |  Invocations: {metrics['summary']['total_invocations']:>5}       |")
    print(f"| Success Rate: {format_percentage(metrics['summary']['avg_success_rate'] * 100):>6}                                   |")
    print(f"+{'-' * 66}+")

    # Show critical alerts
    if summary["spend_pct"] >= 80:
        print(f"  [WARNING] Budget Alert: Approaching monthly limit ({format_percentage(summary['spend_pct'])})")

    if summary.get("alerts"):
        for alert in summary["alerts"]:
            if alert["severity"] == "critical":
                print(f"  [CRITICAL] {alert['message']}")
            elif alert["severity"] == "warning":
                print(f"  [WARNING] {alert['message']}")


def main():
    """Main dashboard entry point"""
    if not MONITORING_AVAILABLE:
        print("Error: Monitoring modules not available")
        sys.exit(1)

    # Check for command line args
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "--quick":
            display_quick_stats()
            return
        elif command == "--cost":
            display_cost_summary()
            return
        elif command == "--performance":
            display_agent_performance()
            return
        elif command == "--recommendations":
            display_recommendations()
            return

    # Full dashboard
    print("\n" + "=" * 68)
    print(" " * 15 + "MULTI-AGENT PERFORMANCE DASHBOARD")
    print(" " * 20 + f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 68)

    display_cost_summary()
    display_agent_performance()
    display_recommendations()

    print("\n" + "=" * 68)
    print(f"  Run 'python dashboard.py --help' for more options")
    print("=" * 68 + "\n")


if __name__ == "__main__":
    main()
