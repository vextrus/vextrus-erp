"""
Agent Metrics Module for Multi-Agent System
Tracks performance metrics for all agents
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict

# Constants
STATE_DIR = Path(__file__).parent.parent / "state" / "monitoring"
AGENT_METRICS_FILE = STATE_DIR / "agent_metrics.json"

# Success thresholds
SUCCESS_RATE_EXCELLENT = 0.95
SUCCESS_RATE_GOOD = 0.90
SUCCESS_RATE_NEEDS_IMPROVEMENT = 0.85


def load_agent_metrics() -> Dict:
    """Load agent metrics data from JSON file"""
    if not AGENT_METRICS_FILE.exists():
        return _initialize_agent_metrics()

    try:
        with open(AGENT_METRICS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading agent metrics: {e}")
        return _initialize_agent_metrics()


def save_agent_metrics(data: Dict) -> bool:
    """Save agent metrics data to JSON file"""
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        with open(AGENT_METRICS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving agent metrics: {e}")
        return False


def _initialize_agent_metrics() -> Dict:
    """Initialize agent metrics structure"""
    now = datetime.now().isoformat()

    return {
        "metadata": {
            "version": "1.0",
            "created": now,
            "last_updated": now
        },
        "agents": {},
        "categories": {
            "backend-development": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            },
            "quality-testing": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            },
            "compounding-engineering": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            },
            "infrastructure": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            },
            "debugging": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            },
            "documentation": {
                "total_invocations": 0,
                "success_rate": 0.0,
                "avg_duration_seconds": 0.0,
                "avg_cost_usd": 0.0
            }
        },
        "summary": {
            "total_agents": 0,
            "total_invocations": 0,
            "avg_success_rate": 0.0,
            "top_agents_by_usage": [],
            "agents_needing_improvement": []
        }
    }


def get_agent_category(agent_name: str) -> str:
    """
    Determine the category for an agent

    Args:
        agent_name: Agent name (e.g., "backend-development:backend-architect")

    Returns:
        Category name (e.g., "backend-development")
    """
    if ":" in agent_name:
        category = agent_name.split(":")[0]
        if category in ["backend-development", "quality-testing", "compounding-engineering",
                        "infrastructure", "debugging", "documentation"]:
            return category

    return "other"


def track_agent_performance(
    agent_name: str,
    success: bool,
    duration_seconds: float,
    cost_usd: float,
    tokens_input: int,
    tokens_output: int,
    model: str,
    user_corrections: Optional[int] = None,
    error_message: Optional[str] = None
) -> Dict:
    """
    Track performance metrics for an agent invocation

    Args:
        agent_name: Full agent name
        success: Whether the invocation was successful
        duration_seconds: Duration in seconds
        cost_usd: Cost in USD
        tokens_input: Input tokens
        tokens_output: Output tokens
        model: Model used
        user_corrections: Optional count of user corrections
        error_message: Optional error message if failed

    Returns:
        Updated metrics data
    """
    data = load_agent_metrics()
    now = datetime.now()

    # Initialize agent if not exists
    if agent_name not in data["agents"]:
        data["agents"][agent_name] = {
            "total_invocations": 0,
            "successful_invocations": 0,
            "failed_invocations": 0,
            "success_rate": 0.0,
            "user_correction_rate": 0.0,
            "total_user_corrections": 0,
            "avg_duration_seconds": 0.0,
            "total_duration_seconds": 0.0,
            "avg_tokens_input": 0,
            "avg_tokens_output": 0,
            "avg_cost_usd": 0.0,
            "total_cost_usd": 0.0,
            "last_30_days": {
                "invocations": 0,
                "success_rate": 0.0,
                "trend": "stable"
            },
            "models_used": {},
            "common_failure_modes": [],
            "best_use_cases": [],
            "first_seen": now.isoformat(),
            "last_used": now.isoformat(),
            "invocation_history": []
        }

    agent = data["agents"][agent_name]

    # Update basic metrics
    agent["total_invocations"] += 1
    if success:
        agent["successful_invocations"] += 1
    else:
        agent["failed_invocations"] += 1

    agent["success_rate"] = agent["successful_invocations"] / agent["total_invocations"]

    # Update duration
    agent["total_duration_seconds"] += duration_seconds
    agent["avg_duration_seconds"] = agent["total_duration_seconds"] / agent["total_invocations"]

    # Update tokens
    total_invocations = agent["total_invocations"]
    agent["avg_tokens_input"] = int(
        (agent["avg_tokens_input"] * (total_invocations - 1) + tokens_input) / total_invocations
    )
    agent["avg_tokens_output"] = int(
        (agent["avg_tokens_output"] * (total_invocations - 1) + tokens_output) / total_invocations
    )

    # Update cost
    agent["total_cost_usd"] += cost_usd
    agent["avg_cost_usd"] = agent["total_cost_usd"] / agent["total_invocations"]

    # Update user corrections
    if user_corrections is not None:
        agent["total_user_corrections"] += user_corrections
        agent["user_correction_rate"] = agent["total_user_corrections"] / agent["total_invocations"]

    # Track models used
    if model not in agent["models_used"]:
        agent["models_used"][model] = 0
    agent["models_used"][model] += 1

    # Update last used timestamp
    agent["last_used"] = now.isoformat()

    # Add to invocation history (keep last 100)
    invocation_record = {
        "timestamp": now.isoformat(),
        "success": success,
        "duration_seconds": duration_seconds,
        "cost_usd": cost_usd,
        "model": model,
        "user_corrections": user_corrections,
        "error_message": error_message if not success else None
    }
    agent["invocation_history"].append(invocation_record)
    if len(agent["invocation_history"]) > 100:
        agent["invocation_history"] = agent["invocation_history"][-100:]

    # Update last 30 days metrics
    thirty_days_ago = now - timedelta(days=30)
    recent_invocations = [
        inv for inv in agent["invocation_history"]
        if datetime.fromisoformat(inv["timestamp"]) > thirty_days_ago
    ]

    if recent_invocations:
        agent["last_30_days"]["invocations"] = len(recent_invocations)
        recent_successes = sum(1 for inv in recent_invocations if inv["success"])
        agent["last_30_days"]["success_rate"] = recent_successes / len(recent_invocations)

        # Calculate trend
        if len(recent_invocations) >= 10:
            first_half = recent_invocations[:len(recent_invocations)//2]
            second_half = recent_invocations[len(recent_invocations)//2:]

            first_half_success = sum(1 for inv in first_half if inv["success"]) / len(first_half)
            second_half_success = sum(1 for inv in second_half if inv["success"]) / len(second_half)

            if second_half_success > first_half_success + 0.05:
                agent["last_30_days"]["trend"] = "improving"
            elif second_half_success < first_half_success - 0.05:
                agent["last_30_days"]["trend"] = "declining"
            else:
                agent["last_30_days"]["trend"] = "stable"

    # Track failure modes
    if not success and error_message:
        # Simplify error message for grouping
        simplified_error = error_message[:100]
        existing_failure = next(
            (f for f in agent["common_failure_modes"] if f["error"] == simplified_error),
            None
        )
        if existing_failure:
            existing_failure["count"] += 1
        else:
            agent["common_failure_modes"].append({
                "error": simplified_error,
                "count": 1,
                "last_occurrence": now.isoformat()
            })

        # Keep top 10 failure modes
        agent["common_failure_modes"] = sorted(
            agent["common_failure_modes"],
            key=lambda x: x["count"],
            reverse=True
        )[:10]

    # Update category metrics
    category = get_agent_category(agent_name)
    if category in data["categories"]:
        cat = data["categories"][category]
        cat_total = cat["total_invocations"]

        # Update category totals
        cat["total_invocations"] += 1

        # Recalculate category averages
        all_agents_in_category = [
            a for name, a in data["agents"].items()
            if get_agent_category(name) == category
        ]

        if all_agents_in_category:
            cat["success_rate"] = sum(a["success_rate"] for a in all_agents_in_category) / len(all_agents_in_category)
            cat["avg_duration_seconds"] = sum(a["avg_duration_seconds"] for a in all_agents_in_category) / len(all_agents_in_category)
            cat["avg_cost_usd"] = sum(a["avg_cost_usd"] for a in all_agents_in_category) / len(all_agents_in_category)

    # Update summary
    data["summary"]["total_agents"] = len(data["agents"])
    data["summary"]["total_invocations"] = sum(a["total_invocations"] for a in data["agents"].values())

    if data["agents"]:
        data["summary"]["avg_success_rate"] = sum(a["success_rate"] for a in data["agents"].values()) / len(data["agents"])

    # Update top agents by usage
    top_agents = sorted(
        [(name, agent["total_invocations"]) for name, agent in data["agents"].items()],
        key=lambda x: x[1],
        reverse=True
    )[:10]
    data["summary"]["top_agents_by_usage"] = [
        {"agent": name, "invocations": count}
        for name, count in top_agents
    ]

    # Update agents needing improvement
    agents_needing_improvement = [
        {"agent": name, "success_rate": agent["success_rate"]}
        for name, agent in data["agents"].items()
        if agent["success_rate"] < SUCCESS_RATE_NEEDS_IMPROVEMENT and agent["total_invocations"] >= 5
    ]
    agents_needing_improvement.sort(key=lambda x: x["success_rate"])
    data["summary"]["agents_needing_improvement"] = agents_needing_improvement[:10]

    # Update metadata
    data["metadata"]["last_updated"] = now.isoformat()

    # Save updated data
    save_agent_metrics(data)

    return data


def get_agent_performance_summary(agent_name: str) -> Optional[Dict]:
    """Get performance summary for a specific agent"""
    data = load_agent_metrics()

    if agent_name not in data["agents"]:
        return None

    agent = data["agents"][agent_name]

    # Determine performance status
    success_rate = agent["success_rate"]
    if success_rate >= SUCCESS_RATE_EXCELLENT:
        status = "excellent"
        status_emoji = "[EXCELLENT]"
    elif success_rate >= SUCCESS_RATE_GOOD:
        status = "good"
        status_emoji = "[GOOD]"
    elif success_rate >= SUCCESS_RATE_NEEDS_IMPROVEMENT:
        status = "needs_improvement"
        status_emoji = "[NEEDS IMPROVEMENT]"
    else:
        status = "review_needed"
        status_emoji = "[REVIEW NEEDED]"

    return {
        "agent": agent_name,
        "status": status,
        "status_emoji": status_emoji,
        "metrics": {
            "total_invocations": agent["total_invocations"],
            "success_rate": agent["success_rate"],
            "user_correction_rate": agent["user_correction_rate"],
            "avg_duration_seconds": agent["avg_duration_seconds"],
            "avg_cost_usd": agent["avg_cost_usd"],
            "avg_tokens_input": agent["avg_tokens_input"],
            "avg_tokens_output": agent["avg_tokens_output"]
        },
        "last_30_days": agent["last_30_days"],
        "models_used": agent["models_used"],
        "common_failures": agent["common_failure_modes"][:3],
        "last_used": agent["last_used"]
    }


def get_category_summary(category: str) -> Optional[Dict]:
    """Get performance summary for a category"""
    data = load_agent_metrics()

    if category not in data["categories"]:
        return None

    cat = data["categories"][category]

    # Get agents in this category
    agents_in_category = [
        name for name in data["agents"].keys()
        if get_agent_category(name) == category
    ]

    return {
        "category": category,
        "total_agents": len(agents_in_category),
        "total_invocations": cat["total_invocations"],
        "avg_success_rate": cat["success_rate"],
        "avg_duration_seconds": cat["avg_duration_seconds"],
        "avg_cost_usd": cat["avg_cost_usd"],
        "agents": agents_in_category
    }


def get_performance_recommendations() -> List[Dict]:
    """Generate recommendations based on agent performance"""
    data = load_agent_metrics()
    recommendations = []

    # Check agents with low success rates
    for agent_name, agent in data["agents"].items():
        if agent["total_invocations"] >= 5:
            if agent["success_rate"] < SUCCESS_RATE_NEEDS_IMPROVEMENT:
                recommendations.append({
                    "type": "quality",
                    "priority": "high",
                    "agent": agent_name,
                    "message": f"Low success rate: {agent['success_rate']:.1%}",
                    "action": "Review and improve agent prompt",
                    "current_value": agent["success_rate"],
                    "target_value": SUCCESS_RATE_GOOD
                })

            # Check for high user correction rate
            if agent["user_correction_rate"] > 0.3:
                recommendations.append({
                    "type": "quality",
                    "priority": "medium",
                    "agent": agent_name,
                    "message": f"High user correction rate: {agent['user_correction_rate']:.1%}",
                    "action": "Improve output accuracy",
                    "current_value": agent["user_correction_rate"]
                })

            # Check for declining trend
            if agent["last_30_days"].get("trend") == "declining":
                recommendations.append({
                    "type": "performance",
                    "priority": "medium",
                    "agent": agent_name,
                    "message": "Performance declining in last 30 days",
                    "action": "Investigate recent changes or context issues",
                    "trend": "declining"
                })

            # Check for slow performance
            if agent["avg_duration_seconds"] > 60:
                recommendations.append({
                    "type": "latency",
                    "priority": "low",
                    "agent": agent_name,
                    "message": f"Slow average duration: {agent['avg_duration_seconds']:.1f}s",
                    "action": "Consider caching or optimization",
                    "current_value": agent["avg_duration_seconds"]
                })

    return recommendations


if __name__ == "__main__":
    # Test the agent metrics tracker
    print("Testing agent metrics tracker...")

    # Simulate agent invocations
    track_agent_performance(
        agent_name="backend-development:backend-architect",
        success=True,
        duration_seconds=45.2,
        cost_usd=0.085,
        tokens_input=8500,
        tokens_output=4000,
        model="sonnet-4.5",
        user_corrections=0
    )

    track_agent_performance(
        agent_name="compounding-engineering:architecture-strategist",
        success=True,
        duration_seconds=52.3,
        cost_usd=0.092,
        tokens_input=9200,
        tokens_output=4300,
        model="sonnet-4.5",
        user_corrections=1
    )

    track_agent_performance(
        agent_name="debugging-toolkit:debugger",
        success=False,
        duration_seconds=28.5,
        cost_usd=0.045,
        tokens_input=4500,
        tokens_output=2000,
        model="haiku-4.5",
        user_corrections=0,
        error_message="Failed to identify root cause"
    )

    print("\nAgent performance summaries:")
    for agent_name in ["backend-development:backend-architect",
                        "compounding-engineering:architecture-strategist",
                        "debugging-toolkit:debugger"]:
        summary = get_agent_performance_summary(agent_name)
        if summary:
            print(f"\n{summary['status_emoji']} {summary['agent']}")
            print(f"   Status: {summary['status']}")
            print(f"   Success rate: {summary['metrics']['success_rate']:.1%}")
            print(f"   Avg duration: {summary['metrics']['avg_duration_seconds']:.1f}s")
            print(f"   Avg cost: ${summary['metrics']['avg_cost_usd']:.4f}")

    print("\nRecommendations:")
    recommendations = get_performance_recommendations()
    for rec in recommendations:
        print(f"   [{rec['priority']}] {rec['agent']}: {rec['message']}")
