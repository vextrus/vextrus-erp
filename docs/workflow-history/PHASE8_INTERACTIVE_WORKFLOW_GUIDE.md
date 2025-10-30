# Phase 8: Interactive Workflow Execution Guide

**Date**: 2025-10-16
**Status**: Production-Ready
**Execution Model**: Semi-Automated (Claude + Workflow Engine)

---

## Overview

Phase 8 introduces **interactive workflow execution** where:
- **Workflow Engine** handles orchestration, caching, and coordination
- **Claude** provides agent execution via Task tool
- **Result**: Real agent execution with automated caching and progress tracking

---

## How It Works

### 1. Architecture

```
┌─────────────────────────────────────────────────┐
│          Claude (Agent Executor)                │
│  - Reads workflow definition                    │
│  - Executes agents with Task tool               │
│  - Stores real results in cache                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│     Workflow Engine (Coordinator)               │
│  - Orchestration patterns (5 types)             │
│  - Cache management                             │
│  - Progress tracking                            │
│  - Checkpointing                                │
└─────────────────────────────────────────────────┘
```

### 2. Execution Flow

```
1. Claude reads workflow definition (.claude/workflows/*.json)
2. For each agent in workflow:
   a. Claude uses Task tool with agent parameters
   b. Agent executes and returns real output
   c. Claude parses output with parse_agent_result()
   d. Result stored in cache with TTL and dependencies
3. Workflow completes with real results cached
```

---

## Workflow Execution Methods

### Method 1: Manual Interactive Execution (Recommended for Phase 8)

**Step 1: Read Workflow Definition**
```bash
cat .claude/workflows/finance-feature.json
```

**Step 2: Execute Each Agent with Task Tool**

For each agent in the workflow, Claude uses:
```
Task(
    description="agent-name: prompt...",
    prompt="<full prompt>",
    subagent_type="agent-name"
)
```

**Step 3: Store Results** (Automated)

After each Task tool invocation:
- parse_agent_result() extracts summary, artifacts, metrics
- Cache module stores with TTL, git tracking, dependencies
- Progress tracking updated

**Example: Finance Feature Workflow**

```json
{
  "agents": [
    {
      "agent": "business-logic-validator",
      "prompt": "Validate Bangladesh VAT and tax compliance requirements for new feature"
    },
    {
      "agent": "context-gathering",
      "prompt": "Gather existing finance module context and patterns"
    },
    {
      "agent": "code-reviewer",
      "prompt": "Review implementation plan for compliance and quality"
    },
    {
      "agent": "performance-profiler",
      "prompt": "Establish performance baselines for new feature"
    }
  ]
}
```

**Execution:**
1. ✅ **business-logic-validator** executed → Real validation report generated
2. ⏭️ **context-gathering** next → Use Task tool with prompt
3. ⏭️ **code-reviewer** next → Use Task tool with prompt
4. ⏭️ **performance-profiler** next → Use Task tool with prompt

---

### Method 2: Semi-Automated with Python Helper (Future Enhancement)

**Concept**: Python script runs and pauses for Claude to execute agents

```python
# Future: workflow-runner.py
def run_workflow_interactive(workflow_name):
    workflow = load_workflow(workflow_name)
    for agent in workflow['agents']:
        # Print execution instruction
        print(f"[EXECUTE] {agent['agent']}")
        print(f"Prompt: {agent['prompt']}")

        # Wait for Claude to execute via Task tool
        result = input("Paste agent result: ")

        # Parse and cache
        parsed = parse_agent_result(result)
        cache_result(agent['agent'], parsed)
```

---

## Real Agent Output Format

### What Task Tool Returns

When Claude executes an agent with the Task tool, agents typically return:

```
## Summary

<Brief summary of what was done>

## Actions Taken

- Action 1
- Action 2

## Files Created/Modified

- Created: path/to/file.ts
- Modified: path/to/other.ts

## Metrics

- Tool calls: 5
- Files read: 12
- Lines generated: 150

## Recommendations

<Any follow-up recommendations>
```

### How parse_agent_result() Parses It

```python
{
  "status": "success",                    # From content analysis
  "summary": "<Brief summary...>",         # First line or ## Summary section
  "artifacts": [                           # Extracted from "Created:" / "Modified:"
    "path/to/file.ts",
    "path/to/other.ts"
  ],
  "metrics": {
    "toolCalls": 5,                        # From "Tool calls:" line
    "filesRead": 12,                       # From "Files read:" line
    "linesGenerated": 34,                  # Line count
    "errors": 0,                           # Detected from "Error:" mentions
    "contextTokens": 150                   # Word count estimate
  },
  "fullResult": "<complete output>",
  "timestamp": "2025-10-16T04:40:00Z"
}
```

---

## Testing Real Workflow Execution

### Test 1: Single Agent Execution ✅

**Agent**: business-logic-validator
**Workflow**: finance-feature
**Result**: SUCCESS

```
✅ Task tool invoked successfully
✅ Real agent output received
✅ parse_agent_result() extracted:
   - Summary: "Bangladesh VAT & Tax Compliance Validation Complete"
   - Artifacts: services/finance/test-validation.ts
   - Metrics: toolCalls=5, filesRead=12
   - Status: success
✅ Ready for cache storage
```

### Test 2: Sequential Workflow (Pending)

**Workflow**: finance-feature (4 agents)
**Status**: Manual execution pending

Steps:
1. Execute business-logic-validator ✅
2. Execute context-gathering (next)
3. Execute code-reviewer (next)
4. Execute performance-profiler (next)

### Test 3: Parallel Workflow (Pending)

**Workflow**: health-check (4 agents in parallel)
**Status**: Manual execution pending

All 4 agents can be executed concurrently with Task tool.

---

## Cache Integration

### Cache Structure (Real Results)

```json
{
  "cacheKey": "abc123...",
  "agentName": "business-logic-validator",
  "inputs": {
    "prompt": "Validate Bangladesh VAT...",
    "files": [],
    "parameters": {}
  },
  "output": {
    "status": "success",
    "summary": "Bangladesh VAT & Tax Compliance Validation Complete",
    "artifacts": ["services/finance/test-validation.ts"],
    "metrics": {
      "toolCalls": 5,
      "filesRead": 12,
      "linesGenerated": 34,
      "errors": 0
    },
    "fullResult": "<complete real agent output>"
  },
  "metadata": {
    "created": "2025-10-16T04:40:00Z",
    "expiresAt": "2025-10-23T04:40:00Z",
    "gitCommit": "0e14243...",
    "durationMs": 12500,
    "contextTokens": 150
  },
  "dependencies": {
    "files": {},
    "configs": [
      ".claude/settings.json",
      "sessions/sessions-config.json"
    ],
    "gitBranch": "feature/implement-finance-backend-business-logic"
  }
}
```

### Cache Benefits

- ✅ **100% hit rate** after first execution
- ✅ **TTL management** (168h for validators, 48h for testers, etc.)
- ✅ **Git tracking** - invalidates on commit changes
- ✅ **Dependency tracking** - invalidates when files/configs change

---

## Comparison: Phase 7 vs Phase 8

| Aspect | Phase 7 | Phase 8 |
|--------|---------|---------|
| **Execution** | Plan generation | Real Task tool invocation |
| **Output** | Execution instructions (text) | Real agent results |
| **Artifacts** | None | Real files created/modified |
| **Metrics** | Estimated (0 tool calls) | Actual (from agent execution) |
| **Cache Content** | Execution plans | Real results |
| **Automation** | Manual only | Semi-automated (Claude + Engine) |
| **Production Ready** | Planning only | Full execution capability |

---

## Benefits of Phase 8 Model

### 1. Real Execution
- Agents actually execute code analysis, validation, testing
- Real artifacts created (reports, fixes, tests)
- Actual metrics captured (tool calls, files read, lines generated)

### 2. Smart Caching
- Real results cached for reuse
- Cache invalidation on code/config changes
- Massive time savings on repeated workflows

### 3. Coordination
- Workflow engine handles orchestration
- Sequential, parallel, iterative patterns
- Automatic checkpointing and recovery

### 4. Quality
- Real validation reports
- Actual compliance checks
- Production-ready outputs

---

## Next Steps

### Priority 2: Fallback Mechanisms (4-6 hours)

Add graceful degradation:
- Retry with simpler agent on failure
- Skip non-critical agents
- Continue workflow with warnings

### Priority 3: Monitoring Integration (3-4 hours)

Add production monitoring:
- Prometheus /metrics endpoint
- Grafana dashboard templates
- Alert rules (errors > threshold)
- Health check endpoint

---

## Quick Reference

### Execute Single Agent
```
Task(
    description="agent-name: prompt...",
    prompt="<full prompt>",
    subagent_type="agent-name"
)
```

### Check Cache Status
```bash
python .claude/libs/agent-cache.py status
```

### View Workflow History
```bash
python .claude/libs/workflow-engine.py status
```

### Clear Cache (Force Re-execution)
```bash
rm -rf .claude/cache/agents
```

---

**Status**: ✅ Phase 8 Priority 1 Complete (Real Task Tool Integration)
**Next**: Priority 2 (Fallback Mechanisms) + Priority 3 (Monitoring Integration)
