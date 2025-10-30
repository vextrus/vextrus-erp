# Phase 1 Implementation: Core Workflow Enhancements

## Implementation Timeline: Week 1

### Day 1-2: Progressive Mode System

#### 1.1 New State File Structure
Create `.claude/state/progressive-mode.json`:
```json
{
  "current_mode": "explore",
  "mode_history": [],
  "auto_elevation_enabled": true,
  "context_retention": "full",
  "last_transition": null
}
```

#### 1.2 Mode Configuration
Create `.claude/config/progressive-modes.json`:
```json
{
  "modes": {
    "explore": {
      "description": "Investigation and research mode",
      "permissions": {
        "read": ["*"],
        "write": [],
        "execute": ["read_only_bash", "mcp_tools", "serena_tools"]
      },
      "blocked_tools": ["Edit", "Write", "MultiEdit", "NotebookEdit"],
      "auto_elevate_triggers": [
        "let's test this",
        "write a test",
        "create a prototype"
      ],
      "next_modes": ["prototype"],
      "context_retention": "full"
    },
    "prototype": {
      "description": "Testing and experimentation mode",
      "permissions": {
        "read": ["*"],
        "write": ["test/**", "**/*.test.*", "**/*.spec.*", "experiments/**"],
        "execute": ["*"]
      },
      "blocked_tools": [],
      "auto_elevate_triggers": [
        "looks good",
        "implement this",
        "make it production ready"
      ],
      "next_modes": ["implement"],
      "context_retention": "relevant"
    },
    "implement": {
      "description": "Full implementation mode",
      "permissions": {
        "read": ["*"],
        "write": ["*"],
        "execute": ["*"]
      },
      "blocked_tools": [],
      "auto_elevate_triggers": [
        "validate this",
        "run tests",
        "check quality"
      ],
      "next_modes": ["validate"],
      "context_retention": "changes_only"
    },
    "validate": {
      "description": "Testing and validation mode",
      "permissions": {
        "read": ["*"],
        "write": [],
        "execute": ["test", "lint", "typecheck", "build"]
      },
      "blocked_tools": ["Edit", "Write", "MultiEdit"],
      "auto_elevate_triggers": [
        "deploy it",
        "ship it",
        "push to production"
      ],
      "next_modes": ["deploy"],
      "context_retention": "results"
    },
    "deploy": {
      "description": "Production deployment mode",
      "permissions": {
        "read": ["*"],
        "write": ["*.yml", "*.yaml", "*.json", "*.env"],
        "execute": ["deploy", "rollback", "monitor"]
      },
      "blocked_tools": ["Edit", "Write", "MultiEdit"],
      "requires_confirmation": true,
      "next_modes": ["explore"],
      "context_retention": "audit_trail"
    }
  },
  "transitions": {
    "explore->prototype": {
      "requires_approval": false,
      "auto_trigger_phrases": ["test this", "try it out"]
    },
    "prototype->implement": {
      "requires_approval": false,
      "auto_trigger_phrases": ["implement", "build this"]
    },
    "implement->validate": {
      "requires_approval": false,
      "auto_trigger_phrases": ["validate", "test"]
    },
    "validate->deploy": {
      "requires_approval": true,
      "auto_trigger_phrases": ["deploy", "ship"]
    }
  }
}
```

#### 1.3 Hook Updates Required

**user-messages.py enhancements:**
- Add progressive mode detection
- Implement auto-elevation logic
- Add mode transition suggestions

**sessions-enforce.py enhancements:**
- Check progressive mode permissions
- Implement granular tool blocking
- Add elevation suggestions

**post-tool-use.py enhancements:**
- Show current mode status
- Suggest next mode transitions
- Track mode effectiveness

### Day 3-4: Context Optimization System

#### 2.1 Context Scoring Algorithm
Create `.claude/lib/context_optimizer.py`:
```python
import json
import tiktoken
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any

class ContextOptimizer:
    def __init__(self):
        self.enc = tiktoken.get_encoding('cl100k_base')
        self.relevance_threshold = 0.7
        self.max_context_tokens = 160000
        self.archive_threshold = 50000
        self.summarization_threshold = 30000
        
    def optimize_context(self, transcript_path: str) -> Dict[str, Any]:
        """Main optimization pipeline"""
        transcript = self.load_transcript(transcript_path)
        
        # Step 1: Score relevance
        scored = self.score_messages(transcript)
        
        # Step 2: Archive completed work
        archived = self.archive_completed(scored)
        
        # Step 3: Summarize old discussions
        summarized = self.summarize_old(archived)
        
        # Step 4: Filter by relevance
        optimized = self.filter_relevant(summarized)
        
        # Step 5: Calculate savings
        stats = self.calculate_stats(transcript, optimized)
        
        return {
            "optimized_transcript": optimized,
            "stats": stats,
            "archived_items": len(archived),
            "summarized_items": len(summarized)
        }
    
    def score_messages(self, transcript: List[Dict]) -> List[Dict]:
        """Score each message for relevance"""
        scored = []
        current_task = self.get_current_task()
        
        for i, msg in enumerate(transcript):
            score = 0.0
            
            # Recency score (exponential decay)
            age_hours = (datetime.now() - msg.get('timestamp', datetime.now())).total_seconds() / 3600
            recency_score = max(0, 1 - (age_hours / 24))  # Decay over 24 hours
            
            # Task relevance score
            task_score = self.calculate_task_relevance(msg, current_task)
            
            # Tool usage importance
            tool_score = self.calculate_tool_importance(msg)
            
            # User emphasis detection
            emphasis_score = self.detect_user_emphasis(msg)
            
            # Error or warning content
            error_score = 1.0 if self.contains_error(msg) else 0.0
            
            # Weighted average
            weights = {
                'recency': 0.3,
                'task': 0.25,
                'tool': 0.2,
                'emphasis': 0.15,
                'error': 0.1
            }
            
            score = sum(weights[k] * v for k, v in {
                'recency': recency_score,
                'task': task_score,
                'tool': tool_score,
                'emphasis': emphasis_score,
                'error': error_score
            }.items())
            
            msg['relevance_score'] = score
            scored.append(msg)
            
        return scored
    
    def archive_completed(self, messages: List[Dict]) -> List[Dict]:
        """Archive messages related to completed subtasks"""
        archive_dir = Path('.claude/archive/context')
        archive_dir.mkdir(parents=True, exist_ok=True)
        
        completed_patterns = [
            "task completed",
            "subtask done",
            "finished implementing",
            "tests passing"
        ]
        
        to_archive = []
        remaining = []
        
        for msg in messages:
            content = str(msg.get('content', '')).lower()
            if any(pattern in content for pattern in completed_patterns):
                # Archive this and surrounding context
                to_archive.append(msg)
            else:
                remaining.append(msg)
        
        if to_archive:
            # Save archived content
            archive_file = archive_dir / f"archive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(archive_file, 'w') as f:
                json.dump(to_archive, f, indent=2, default=str)
        
        return remaining
    
    def summarize_old(self, messages: List[Dict]) -> List[Dict]:
        """Summarize old discussions to save tokens"""
        summarized = []
        current_tokens = 0
        
        for msg in messages:
            msg_tokens = self.count_tokens(msg)
            
            if current_tokens + msg_tokens > self.summarization_threshold:
                # Old message, consider summarization
                if msg['relevance_score'] < 0.5:
                    # Low relevance old message - summarize
                    summary = self.create_summary(msg)
                    summarized.append(summary)
                else:
                    # Keep as-is if still relevant
                    summarized.append(msg)
            else:
                # Recent message, keep as-is
                summarized.append(msg)
            
            current_tokens += msg_tokens
        
        return summarized
    
    def filter_relevant(self, messages: List[Dict]) -> List[Dict]:
        """Keep only messages above relevance threshold"""
        return [
            msg for msg in messages 
            if msg.get('relevance_score', 0) >= self.relevance_threshold
            or msg.get('is_summary', False)  # Always keep summaries
        ]
    
    def create_summary(self, message: Dict) -> Dict:
        """Create a concise summary of a message"""
        content = message.get('content', '')
        
        # Extract key points
        key_points = []
        if 'Edit' in str(content) or 'Write' in str(content):
            key_points.append("File modified")
        if 'error' in str(content).lower():
            key_points.append("Error encountered")
        if 'fixed' in str(content).lower():
            key_points.append("Issue resolved")
        
        return {
            'type': 'summary',
            'original_timestamp': message.get('timestamp'),
            'content': f"[Summary] {', '.join(key_points) or 'Discussion'}",
            'relevance_score': 0.5,
            'is_summary': True
        }
    
    def count_tokens(self, message: Dict) -> int:
        """Count tokens in a message"""
        content = json.dumps(message, default=str)
        return len(self.enc.encode(content))
```

#### 2.2 Integration Points
Create `.claude/hooks/context-monitor.py`:
```python
#!/usr/bin/env python3
"""Monitor and optimize context usage in real-time"""
import json
import sys
from pathlib import Path
from context_optimizer import ContextOptimizer

def main():
    input_data = json.load(sys.stdin)
    transcript_path = input_data.get('transcript_path')
    
    if not transcript_path or not Path(transcript_path).exists():
        sys.exit(0)
    
    optimizer = ContextOptimizer()
    
    # Check if optimization needed
    with open(transcript_path, 'r') as f:
        transcript_size = sum(1 for _ in f)
    
    if transcript_size > 100:  # Arbitrary threshold
        result = optimizer.optimize_context(transcript_path)
        
        if result['stats']['savings_percent'] > 20:
            print(f"[Context Optimization Available] Could save {result['stats']['savings_percent']:.1f}% tokens", file=sys.stderr)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
```

### Day 5: Complexity Detection System

#### 3.1 Complexity Analyzer
Create `.claude/lib/complexity_analyzer.py`:
```python
import re
from typing import Dict, List, Any
from pathlib import Path

class ComplexityAnalyzer:
    def __init__(self):
        self.complexity_weights = {
            'files': 0.2,
            'services': 0.25,
            'integrations': 0.3,
            'business_rules': 0.15,
            'migrations': 0.1
        }
    
    def analyze_task(self, task_description: str, task_file: str = None) -> Dict[str, Any]:
        """Analyze task complexity and suggest splitting if needed"""
        
        metrics = self.calculate_metrics(task_description, task_file)
        complexity_score = self.calculate_complexity(metrics)
        
        result = {
            'score': complexity_score,
            'metrics': metrics,
            'should_split': complexity_score > 7,
            'classification': self.classify_complexity(complexity_score)
        }
        
        if result['should_split']:
            result['suggested_subtasks'] = self.generate_subtasks(task_description, metrics)
            result['reasoning'] = self.explain_complexity(metrics)
        
        return result
    
    def calculate_metrics(self, description: str, task_file: str = None) -> Dict[str, int]:
        """Calculate complexity metrics from task description"""
        
        metrics = {
            'estimated_files': 0,
            'estimated_services': 0,
            'integration_points': 0,
            'business_rules': 0,
            'migration_needed': 0
        }
        
        # File impact estimation
        file_patterns = [
            r'modify (\d+) files?',
            r'update .* components?',
            r'refactor .* modules?'
        ]
        for pattern in file_patterns:
            match = re.search(pattern, description.lower())
            if match:
                metrics['estimated_files'] += int(match.group(1)) if match.groups() else 5
        
        # Service impact
        service_keywords = ['service', 'microservice', 'api', 'endpoint']
        for keyword in service_keywords:
            metrics['estimated_services'] += description.lower().count(keyword)
        
        # Integration complexity
        integration_keywords = ['integrate', 'connect', 'synchronize', 'webhook', 'event']
        for keyword in integration_keywords:
            metrics['integration_points'] += description.lower().count(keyword)
        
        # Business rules
        rule_keywords = ['validation', 'rule', 'policy', 'compliance', 'regulation']
        for keyword in rule_keywords:
            metrics['business_rules'] += description.lower().count(keyword)
        
        # Migration detection
        if any(word in description.lower() for word in ['migrate', 'upgrade', 'transform']):
            metrics['migration_needed'] = 1
        
        return metrics
    
    def calculate_complexity(self, metrics: Dict[str, int]) -> float:
        """Calculate weighted complexity score"""
        
        # Normalize metrics
        normalized = {
            'files': min(metrics['estimated_files'] / 10, 1),
            'services': min(metrics['estimated_services'] / 5, 1),
            'integrations': min(metrics['integration_points'] / 3, 1),
            'business_rules': min(metrics['business_rules'] / 5, 1),
            'migrations': metrics['migration_needed']
        }
        
        # Calculate weighted score (0-10 scale)
        score = sum(
            self.complexity_weights[key] * normalized[key] * 10
            for key in normalized
        )
        
        return round(score, 1)
    
    def classify_complexity(self, score: float) -> str:
        """Classify complexity level"""
        if score < 3:
            return "trivial"
        elif score < 5:
            return "simple"
        elif score < 7:
            return "moderate"
        elif score < 9:
            return "complex"
        else:
            return "very_complex"
    
    def generate_subtasks(self, description: str, metrics: Dict) -> List[Dict]:
        """Generate suggested subtasks for complex tasks"""
        
        subtasks = []
        
        # If multiple services affected
        if metrics['estimated_services'] > 2:
            subtasks.append({
                'name': 'implement-service-interfaces',
                'description': 'Define and implement service interfaces',
                'estimated_hours': 4
            })
        
        # If migrations needed
        if metrics['migration_needed']:
            subtasks.append({
                'name': 'plan-data-migration',
                'description': 'Plan and validate data migration strategy',
                'estimated_hours': 6
            })
        
        # If many business rules
        if metrics['business_rules'] > 3:
            subtasks.append({
                'name': 'implement-business-rules',
                'description': 'Implement and test business rule validations',
                'estimated_hours': 8
            })
        
        # If many integrations
        if metrics['integration_points'] > 2:
            subtasks.append({
                'name': 'implement-integrations',
                'description': 'Implement external system integrations',
                'estimated_hours': 12
            })
        
        return subtasks
    
    def explain_complexity(self, metrics: Dict) -> str:
        """Explain why task is complex"""
        
        reasons = []
        
        if metrics['estimated_files'] > 10:
            reasons.append(f"Affects {metrics['estimated_files']} files")
        
        if metrics['estimated_services'] > 2:
            reasons.append(f"Spans {metrics['estimated_services']} services")
        
        if metrics['integration_points'] > 2:
            reasons.append(f"Requires {metrics['integration_points']} integrations")
        
        if metrics['business_rules'] > 3:
            reasons.append(f"Implements {metrics['business_rules']} business rules")
        
        if metrics['migration_needed']:
            reasons.append("Requires data migration")
        
        return "Task is complex because: " + ", ".join(reasons)
```

#### 3.2 Task Splitting Protocol
Create `.claude/hooks/task-complexity-check.py`:
```python
#!/usr/bin/env python3
"""Check task complexity and suggest splitting if needed"""
import json
import sys
from pathlib import Path
from complexity_analyzer import ComplexityAnalyzer

def main():
    input_data = json.load(sys.stdin)
    
    # Only check on task creation or update
    if input_data.get('event') not in ['task_created', 'task_updated']:
        sys.exit(0)
    
    task_file = input_data.get('task_file')
    if not task_file:
        sys.exit(0)
    
    # Read task description
    with open(task_file, 'r') as f:
        content = f.read()
    
    analyzer = ComplexityAnalyzer()
    result = analyzer.analyze_task(content, task_file)
    
    if result['should_split']:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "TaskComplexityWarning",
                "additionalContext": f"""
[Task Complexity Warning]
Complexity Score: {result['score']}/10 ({result['classification']})

{result['reasoning']}

Suggested subtasks:
{chr(10).join(f"- {st['name']}: {st['description']}" for st in result['suggested_subtasks'])}

Consider breaking this task into smaller, more manageable pieces.
"""
            }
        }
        print(json.dumps(output))
    
    sys.exit(0)

if __name__ == '__main__':
    main()
```

## Implementation Checklist

### Files to Create
- [x] `.claude/config/progressive-modes.json` - Mode configuration
- [x] `.claude/state/progressive-mode.json` - Mode state tracking
- [x] `.claude/lib/context_optimizer.py` - Context optimization logic
- [x] `.claude/lib/complexity_analyzer.py` - Complexity analysis
- [x] `.claude/hooks/context-monitor.py` - Real-time context monitoring
- [x] `.claude/hooks/task-complexity-check.py` - Task complexity checking

### Files to Update
- [ ] `.claude/hooks/user-messages.py` - Add progressive mode detection
- [ ] `.claude/hooks/sessions-enforce.py` - Implement granular permissions
- [ ] `.claude/hooks/post-tool-use.py` - Add mode status display
- [ ] `.claude/settings.json` - Add new configuration options

### Testing Plan
1. Test progressive mode transitions
2. Verify context optimization savings
3. Validate complexity detection accuracy
4. Ensure backwards compatibility
5. Performance benchmarking

## Rollback Plan
If issues arise:
1. Remove new hook files
2. Revert hook modifications
3. Clear new state files
4. Return to binary DAIC mode

## Success Metrics
- [ ] 40% reduction in context usage
- [ ] Smooth mode transitions
- [ ] Accurate complexity detection
- [ ] No disruption to existing workflow