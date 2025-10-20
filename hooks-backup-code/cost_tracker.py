"""
Cost Tracker Module for Multi-Agent System
Tracks token usage and costs for all agent invocations
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple

# Constants
STATE_DIR = Path(__file__).parent.parent / "state" / "monitoring"
COST_TRACKING_FILE = STATE_DIR / "cost_tracking.json"

# Model costs (per 1M tokens)
MODEL_COSTS = {
    "sonnet-4.5": {
        "input": 3.0,
        "output": 15.0
    },
    "haiku-4.5": {
        "input": 0.8,
        "output": 4.0
    },
    "claude-sonnet-4": {  # Alias
        "input": 3.0,
        "output": 15.0
    },
    "claude-haiku-4": {  # Alias
        "input": 0.8,
        "output": 4.0
    }
}

# Agent category mapping
AGENT_CATEGORIES = {
    "backend-development": [
        "backend-architect", "graphql-architect", "tdd-orchestrator",
        "django-pro", "fastapi-pro", "python-pro"
    ],
    "quality-testing": [
        "code-reviewer", "test-automator", "tdd-orchestrator",
        "debugger", "performance-engineer"
    ],
    "compounding-engineering": [
        "architecture-strategist", "best-practices-researcher",
        "kieran-python-reviewer", "kieran-typescript-reviewer",
        "performance-oracle", "security-sentinel"
    ],
    "infrastructure": [
        "deployment-engineer", "terraform-specialist", "cloud-architect",
        "kubernetes-architect", "devops-troubleshooter"
    ],
    "debugging": [
        "debugger", "error-detective", "devops-troubleshooter",
        "dx-optimizer"
    ],
    "documentation": [
        "docs-architect", "api-documenter", "tutorial-engineer",
        "mermaid-expert"
    ]
}


def load_cost_tracking() -> Dict:
    """Load cost tracking data from JSON file"""
    if not COST_TRACKING_FILE.exists():
        return _initialize_cost_tracking()

    try:
        with open(COST_TRACKING_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading cost tracking: {e}")
        return _initialize_cost_tracking()


def save_cost_tracking(data: Dict) -> bool:
    """Save cost tracking data to JSON file"""
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        with open(COST_TRACKING_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving cost tracking: {e}")
        return False


def _initialize_cost_tracking() -> Dict:
    """Initialize cost tracking structure"""
    now = datetime.now().isoformat()
    current_month = datetime.now().strftime("%Y-%m")

    return {
        "metadata": {
            "version": "1.0",
            "created": now,
            "last_updated": now
        },
        "config": {
            "monthly_budget_usd": 500.0,
            "alert_threshold_pct": 80,
            "model_costs": MODEL_COSTS
        },
        "daily": {},
        "monthly": {
            current_month: {
                "total_cost_usd": 0.0,
                "sonnet_cost_usd": 0.0,
                "haiku_cost_usd": 0.0,
                "sonnet_tokens_input": 0,
                "sonnet_tokens_output": 0,
                "haiku_tokens_input": 0,
                "haiku_tokens_output": 0,
                "by_agent_category": {},
                "by_agent": {},
                "alerts": []
            }
        },
        "statistics": {
            "total_invocations": 0,
            "avg_cost_per_invocation": 0.0,
            "sonnet_usage_pct": 0.0,
            "haiku_usage_pct": 0.0
        }
    }


def calculate_cost(model: str, tokens_input: int, tokens_output: int) -> float:
    """
    Calculate cost for a model invocation

    Args:
        model: Model name (e.g., "sonnet-4.5", "haiku-4.5")
        tokens_input: Number of input tokens
        tokens_output: Number of output tokens

    Returns:
        Cost in USD
    """
    # Normalize model name
    model_lower = model.lower()
    if "sonnet" in model_lower:
        costs = MODEL_COSTS["sonnet-4.5"]
    elif "haiku" in model_lower:
        costs = MODEL_COSTS["haiku-4.5"]
    else:
        # Default to sonnet (conservative estimate)
        costs = MODEL_COSTS["sonnet-4.5"]

    # Calculate cost (per 1M tokens, so divide by 1M)
    input_cost = (tokens_input / 1_000_000) * costs["input"]
    output_cost = (tokens_output / 1_000_000) * costs["output"]

    return input_cost + output_cost


def get_agent_category(agent_name: str) -> str:
    """
    Determine the category for an agent

    Args:
        agent_name: Agent name (e.g., "backend-development:backend-architect")

    Returns:
        Category name (e.g., "backend-development")
    """
    # Extract category from full agent name
    if ":" in agent_name:
        category = agent_name.split(":")[0]
        if category in AGENT_CATEGORIES:
            return category

    # Try to match by agent short name
    agent_short = agent_name.split(":")[-1] if ":" in agent_name else agent_name

    for category, agents in AGENT_CATEGORIES.items():
        if agent_short in agents:
            return category

    return "other"


def track_agent_invocation(
    agent_name: str,
    model: str,
    tokens_input: int,
    tokens_output: int,
    duration_seconds: Optional[float] = None
) -> Tuple[float, Dict]:
    """
    Track a single agent invocation

    Args:
        agent_name: Full agent name (e.g., "backend-development:backend-architect")
        model: Model used (e.g., "sonnet-4.5")
        tokens_input: Input tokens consumed
        tokens_output: Output tokens generated
        duration_seconds: Optional duration in seconds

    Returns:
        Tuple of (cost_usd, updated_data)
    """
    # Load current tracking data
    data = load_cost_tracking()

    # Calculate cost
    cost = calculate_cost(model, tokens_input, tokens_output)

    # Get current date and month
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_month = now.strftime("%Y-%m")

    # Determine model category
    model_category = "sonnet" if "sonnet" in model.lower() else "haiku"

    # Initialize month if not exists
    if current_month not in data["monthly"]:
        data["monthly"][current_month] = {
            "total_cost_usd": 0.0,
            "sonnet_cost_usd": 0.0,
            "haiku_cost_usd": 0.0,
            "sonnet_tokens_input": 0,
            "sonnet_tokens_output": 0,
            "haiku_tokens_input": 0,
            "haiku_tokens_output": 0,
            "by_agent_category": {},
            "by_agent": {},
            "alerts": []
        }

    # Initialize day if not exists
    if current_date not in data["daily"]:
        data["daily"][current_date] = {
            "total_cost_usd": 0.0,
            "sonnet_cost_usd": 0.0,
            "haiku_cost_usd": 0.0,
            "sonnet_tokens_input": 0,
            "sonnet_tokens_output": 0,
            "haiku_tokens_input": 0,
            "haiku_tokens_output": 0,
            "by_agent_category": {},
            "by_agent": {},
            "invocations": []
        }

    # Get agent category
    agent_category = get_agent_category(agent_name)

    # Update monthly totals
    monthly = data["monthly"][current_month]
    monthly["total_cost_usd"] += cost
    monthly[f"{model_category}_cost_usd"] += cost
    monthly[f"{model_category}_tokens_input"] += tokens_input
    monthly[f"{model_category}_tokens_output"] += tokens_output

    # Update monthly by category
    if agent_category not in monthly["by_agent_category"]:
        monthly["by_agent_category"][agent_category] = 0.0
    monthly["by_agent_category"][agent_category] += cost

    # Update monthly by agent
    if agent_name not in monthly["by_agent"]:
        monthly["by_agent"][agent_name] = {
            "cost_usd": 0.0,
            "invocations": 0,
            "tokens_input": 0,
            "tokens_output": 0
        }
    monthly["by_agent"][agent_name]["cost_usd"] += cost
    monthly["by_agent"][agent_name]["invocations"] += 1
    monthly["by_agent"][agent_name]["tokens_input"] += tokens_input
    monthly["by_agent"][agent_name]["tokens_output"] += tokens_output

    # Update daily totals
    daily = data["daily"][current_date]
    daily["total_cost_usd"] += cost
    daily[f"{model_category}_cost_usd"] += cost
    daily[f"{model_category}_tokens_input"] += tokens_input
    daily[f"{model_category}_tokens_output"] += tokens_output

    # Update daily by category
    if agent_category not in daily["by_agent_category"]:
        daily["by_agent_category"][agent_category] = 0.0
    daily["by_agent_category"][agent_category] += cost

    # Update daily by agent
    if agent_name not in daily["by_agent"]:
        daily["by_agent"][agent_name] = 0.0
    daily["by_agent"][agent_name] += cost

    # Add invocation record
    daily["invocations"].append({
        "timestamp": now.isoformat(),
        "agent": agent_name,
        "model": model,
        "tokens_input": tokens_input,
        "tokens_output": tokens_output,
        "cost_usd": cost,
        "duration_seconds": duration_seconds
    })

    # Update statistics
    data["statistics"]["total_invocations"] += 1
    total_invocations = data["statistics"]["total_invocations"]
    total_cost = sum(m["total_cost_usd"] for m in data["monthly"].values())
    data["statistics"]["avg_cost_per_invocation"] = total_cost / total_invocations if total_invocations > 0 else 0.0

    # Calculate model usage percentages
    total_sonnet = sum(m["sonnet_cost_usd"] for m in data["monthly"].values())
    total_haiku = sum(m["haiku_cost_usd"] for m in data["monthly"].values())
    total_model_cost = total_sonnet + total_haiku

    if total_model_cost > 0:
        data["statistics"]["sonnet_usage_pct"] = (total_sonnet / total_model_cost) * 100
        data["statistics"]["haiku_usage_pct"] = (total_haiku / total_model_cost) * 100

    # Check for budget alerts
    budget = data["config"]["monthly_budget_usd"]
    alert_threshold = data["config"]["alert_threshold_pct"]
    current_spend = monthly["total_cost_usd"]
    spend_pct = (current_spend / budget) * 100

    if spend_pct >= alert_threshold:
        alert = {
            "timestamp": now.isoformat(),
            "type": "budget_warning" if spend_pct < 100 else "budget_exceeded",
            "message": f"Monthly spend at {spend_pct:.1f}% of budget (${current_spend:.2f} / ${budget:.2f})",
            "severity": "warning" if spend_pct < 100 else "critical"
        }

        # Only add if not already alerted
        existing_alerts = [a for a in monthly["alerts"] if a["type"] == alert["type"]]
        if not existing_alerts:
            monthly["alerts"].append(alert)

    # Update metadata
    data["metadata"]["last_updated"] = now.isoformat()

    # Save updated data
    save_cost_tracking(data)

    return cost, data


def get_current_month_summary() -> Dict:
    """Get summary of current month's costs"""
    data = load_cost_tracking()
    current_month = datetime.now().strftime("%Y-%m")

    if current_month not in data["monthly"]:
        return {
            "month": current_month,
            "total_cost_usd": 0.0,
            "budget_usd": data["config"]["monthly_budget_usd"],
            "budget_remaining_usd": data["config"]["monthly_budget_usd"],
            "spend_pct": 0.0,
            "alerts": []
        }

    monthly = data["monthly"][current_month]
    budget = data["config"]["monthly_budget_usd"]
    spend_pct = (monthly["total_cost_usd"] / budget) * 100

    return {
        "month": current_month,
        "total_cost_usd": monthly["total_cost_usd"],
        "budget_usd": budget,
        "budget_remaining_usd": budget - monthly["total_cost_usd"],
        "spend_pct": spend_pct,
        "sonnet_cost_usd": monthly["sonnet_cost_usd"],
        "haiku_cost_usd": monthly["haiku_cost_usd"],
        "sonnet_pct": (monthly["sonnet_cost_usd"] / monthly["total_cost_usd"] * 100) if monthly["total_cost_usd"] > 0 else 0,
        "haiku_pct": (monthly["haiku_cost_usd"] / monthly["total_cost_usd"] * 100) if monthly["total_cost_usd"] > 0 else 0,
        "by_category": monthly["by_agent_category"],
        "alerts": monthly["alerts"]
    }


def get_optimization_suggestions() -> list:
    """Generate cost optimization suggestions based on tracking data"""
    data = load_cost_tracking()
    suggestions = []

    # Check Sonnet usage percentage
    sonnet_pct = data["statistics"].get("sonnet_usage_pct", 0)
    if sonnet_pct > 40:
        savings_estimate = data["statistics"].get("avg_cost_per_invocation", 0) * 0.4 * data["statistics"].get("total_invocations", 0)
        suggestions.append({
            "type": "cost",
            "priority": "high",
            "message": f"Sonnet usage at {sonnet_pct:.1f}% - consider task complexity scoring",
            "action": "Enable automatic model selection based on task complexity",
            "estimated_savings_usd": savings_estimate
        })

    # Check high-cost categories
    current_month = datetime.now().strftime("%Y-%m")
    if current_month in data["monthly"]:
        by_category = data["monthly"][current_month].get("by_agent_category", {})
        total_month_cost = data["monthly"][current_month]["total_cost_usd"]

        for category, cost in by_category.items():
            if total_month_cost > 0:
                category_pct = (cost / total_month_cost) * 100
                if category_pct > 30:
                    suggestions.append({
                        "type": "usage",
                        "priority": "medium",
                        "message": f"{category} agents using {category_pct:.1f}% of budget (${cost:.2f})",
                        "action": f"Review {category} agent usage patterns",
                        "category": category
                    })

    return suggestions


if __name__ == "__main__":
    # Test the cost tracker
    print("Testing cost tracker...")

    # Simulate an agent invocation
    cost, data = track_agent_invocation(
        agent_name="backend-development:backend-architect",
        model="sonnet-4.5",
        tokens_input=8500,
        tokens_output=4000,
        duration_seconds=45.2
    )

    print(f"Cost calculated: ${cost:.4f}")
    print(f"\nCurrent month summary:")
    summary = get_current_month_summary()
    for key, value in summary.items():
        print(f"  {key}: {value}")

    print(f"\nOptimization suggestions:")
    suggestions = get_optimization_suggestions()
    for suggestion in suggestions:
        print(f"  [{suggestion['priority']}] {suggestion['message']}")
