#!/usr/bin/env python3
"""
Claude Code StatusLine Script - Optimized Edition
Provides comprehensive session information for the optimized workflow
Windows-compatible with UTF-8 encoding support
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import locale

# Try to set UTF-8 encoding for Windows
if sys.platform == 'win32':
    try:
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
        # Set console code page to UTF-8
        os.system('chcp 65001 > nul 2>&1')
    except:
        pass

# ANSI color codes (optimized palette)
COLORS = {
    'green': '\033[38;5;114m',      # AAD94C - Good/Safe
    'orange': '\033[38;5;215m',     # FFB454 - Warning
    'red': '\033[38;5;203m',        # F26D78 - Critical
    'gray': '\033[38;5;242m',       # Dim
    'text': '\033[38;5;250m',       # BFBDB6 - Normal text
    'cyan': '\033[38;5;111m',       # 59C2FF - Info
    'purple': '\033[38;5;183m',     # D2A6FF - Mode
    'yellow': '\033[38;5;215m',     # FFB454 - Modified
    'blue': '\033[38;5;111m',       # 73B8FF - Tasks
    'magenta': '\033[38;5;205m',    # FF6B9D - Complexity
    'white': '\033[38;5;255m',      # White - Emphasis
    'reset': '\033[0m'
}

# Progressive mode colors
MODE_COLORS = {
    'explore': COLORS['cyan'],      # Safe exploration
    'prototype': COLORS['purple'],  # Experimental
    'implement': COLORS['green'],   # Active development
    'validate': COLORS['yellow'],   # Testing
    'deploy': COLORS['red'],       # Production (caution)
}

# Mode emojis for Windows compatibility
MODE_ICONS = {
    'explore': '🔍',
    'prototype': '🧪',
    'implement': '🔨',
    'validate': '✓',
    'deploy': '🚀',
}

# Fallback ASCII icons if emojis don't work
MODE_ASCII = {
    'explore': '[E]',
    'prototype': '[P]',
    'implement': '[I]',
    'validate': '[V]',
    'deploy': '[D]',
}


def get_git_status(cwd):
    """Count modified and staged files"""
    try:
        os.chdir(cwd)
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            shell=False
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
            # Count different types of changes
            modified = sum(1 for line in lines if line and line[0] == 'M')
            added = sum(1 for line in lines if line and line[0] == 'A')
            deleted = sum(1 for line in lines if line and line[0] == 'D')
            untracked = sum(1 for line in lines if line and line.startswith('??'))
            
            return {
                'modified': modified,
                'added': added,
                'deleted': deleted,
                'untracked': untracked,
                'total': len([l for l in lines if l])
            }
    except:
        pass
    return {'modified': 0, 'added': 0, 'deleted': 0, 'untracked': 0, 'total': 0}


def get_context_usage(input_data):
    """Calculate context usage from transcript with optimization awareness"""
    # Determine context limit based on model
    model_name = input_data.get('model', {}).get('display_name', 'Claude')
    if 'Sonnet' in model_name:
        context_limit = 800000  # 800k usable for 1M Sonnet models
    else:
        context_limit = 160000  # 160k usable for 200k models
    
    transcript_path = input_data.get('transcript_path', '')
    total_tokens = 0
    
    if transcript_path and os.path.exists(transcript_path):
        try:
            with open(transcript_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            most_recent_usage = None
            most_recent_timestamp = None
            
            for line in lines:
                try:
                    data = json.loads(line.strip())
                    # Skip sidechain entries
                    if data.get('isSidechain', False):
                        continue
                    
                    # Check for usage data in main-chain messages
                    if data.get('message', {}).get('usage'):
                        timestamp = data.get('timestamp')
                        if timestamp and (not most_recent_timestamp or timestamp > most_recent_timestamp):
                            most_recent_timestamp = timestamp
                            most_recent_usage = data['message']['usage']
                except:
                    continue
            
            # Calculate context length (input + cache tokens only)
            if most_recent_usage:
                total_tokens = (
                    most_recent_usage.get('input_tokens', 0) +
                    most_recent_usage.get('cache_read_input_tokens', 0) +
                    most_recent_usage.get('cache_creation_input_tokens', 0)
                )
        except:
            pass
    
    # Default to 17.9k if no data available (typical initial context)
    if total_tokens == 0:
        total_tokens = 17900
    
    return total_tokens, context_limit


def create_progress_bar(total_tokens, context_limit):
    """Create an enhanced visual progress bar with context optimization indicators"""
    progress_pct = min(100.0, (total_tokens * 100.0 / context_limit))
    progress_pct_int = int(progress_pct)
    
    # Format token counts
    formatted_tokens = f"{total_tokens // 1000}k"
    formatted_limit = f"{context_limit // 1000}k"
    
    # Create progress bar (15 blocks for more granularity)
    bar_width = 15
    filled_blocks = min(bar_width, progress_pct_int * bar_width // 100)
    empty_blocks = bar_width - filled_blocks
    
    # Choose color and indicator based on usage
    if progress_pct_int < 50:
        bar_color = COLORS['green']
        indicator = ''
    elif progress_pct_int < 75:
        bar_color = COLORS['yellow']
        indicator = ''
    elif progress_pct_int < 80:
        bar_color = COLORS['orange']
        indicator = ' ⚠'  # Warning
    elif progress_pct_int < 90:
        bar_color = COLORS['orange']
        indicator = ' ⚠ OPT'  # Optimization recommended
    else:
        bar_color = COLORS['red']
        indicator = ' 🔴 CRITICAL'  # Critical - compact needed
    
    # Build bar
    bar = bar_color + ('█' * filled_blocks)
    bar += COLORS['gray'] + ('░' * empty_blocks)
    bar += f"{COLORS['reset']} {COLORS['text']}{progress_pct:.1f}% ({formatted_tokens}/{formatted_limit}){indicator}{COLORS['reset']}"
    
    return bar


def get_current_task_info(cwd):
    """Get enhanced task information including complexity"""
    task_file = Path(cwd) / '.claude' / 'state' / 'current_task.json'
    if task_file.exists():
        try:
            with open(task_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                task_name = data.get('task', 'None')
                complexity = data.get('complexity', None)
                
                # Format task with complexity if available
                task_display = f"{COLORS['cyan']}📋 {task_name}{COLORS['reset']}"
                
                if complexity is not None:
                    # Color code complexity
                    if complexity < 25:
                        comp_color = COLORS['green']
                        comp_label = 'Simple'
                    elif complexity < 50:
                        comp_color = COLORS['yellow']
                        comp_label = 'Medium'
                    elif complexity < 75:
                        comp_color = COLORS['orange']
                        comp_label = 'Large'
                    else:
                        comp_color = COLORS['red']
                        comp_label = 'Epic'
                    
                    task_display += f" {comp_color}[{comp_label}:{complexity:.0f}]{COLORS['reset']}"
                
                return task_display
        except:
            pass
    return f"{COLORS['gray']}📋 No task{COLORS['reset']}"


def get_progressive_mode(cwd):
    """Get the current progressive mode (replaces DAIC)"""
    # First check for progressive mode
    progressive_file = Path(cwd) / '.claude' / 'state' / 'progressive-mode.json'
    if progressive_file.exists():
        try:
            with open(progressive_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mode = data.get('current_mode', 'explore')
                
                # Use emoji or ASCII based on platform
                try:
                    icon = MODE_ICONS.get(mode, '?')
                except:
                    icon = MODE_ASCII.get(mode, '[?]')
                
                color = MODE_COLORS.get(mode, COLORS['gray'])
                return f"{color}{icon} {mode.title()}{COLORS['reset']}"
        except:
            pass
    
    # Fallback to DAIC if progressive mode not found
    daic_file = Path(cwd) / '.claude' / 'state' / 'daic-mode.json'
    if daic_file.exists():
        try:
            with open(daic_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mode = data.get('mode', 'discussion')
                
            if mode == 'discussion':
                return f"{COLORS['purple']}💭 Discussion{COLORS['reset']}"
            else:
                return f"{COLORS['green']}🔨 Implementation{COLORS['reset']}"
        except:
            pass
    
    return f"{COLORS['gray']}🔍 Explore{COLORS['reset']}"


def get_intelligence_status(cwd):
    """Check intelligence tool statuses for alerts"""
    alerts = []
    
    # Check for compliance issues
    compliance_file = Path(cwd) / '.claude' / 'state' / 'business-rules.json'
    if compliance_file.exists():
        try:
            with open(compliance_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Check metadata for issues
                if data.get('metadata', {}).get('compliance_issues', 0) > 0:
                    alerts.append(f"{COLORS['red']}⚠NBR{COLORS['reset']}")
        except:
            pass
    
    # Check for performance alerts
    perf_file = Path(cwd) / '.claude' / 'state' / 'performance-metrics.json'
    if perf_file.exists():
        try:
            # Simple check - if file was modified recently, there might be alerts
            if (datetime.now() - datetime.fromtimestamp(perf_file.stat().st_mtime)).seconds < 3600:
                alerts.append(f"{COLORS['orange']}⚡Perf{COLORS['reset']}")
        except:
            pass
    
    # Check for integration issues
    integration_file = Path(cwd) / '.claude' / 'state' / 'integration-catalog.json'
    if integration_file.exists():
        try:
            with open(integration_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Check for undocumented endpoints
                if data.get('metadata', {}).get('undocumented_count', 0) > 0:
                    alerts.append(f"{COLORS['yellow']}📡API{COLORS['reset']}")
        except:
            pass
    
    if alerts:
        return ' '.join(alerts)
    else:
        return f"{COLORS['green']}✓ All Clear{COLORS['reset']}"


def count_edited_files_detailed(cwd):
    """Count edited files with more detail"""
    git_status = get_git_status(cwd)
    
    parts = []
    if git_status['modified'] > 0:
        parts.append(f"{COLORS['yellow']}M:{git_status['modified']}{COLORS['reset']}")
    if git_status['added'] > 0:
        parts.append(f"{COLORS['green']}A:{git_status['added']}{COLORS['reset']}")
    if git_status['deleted'] > 0:
        parts.append(f"{COLORS['red']}D:{git_status['deleted']}{COLORS['reset']}")
    if git_status['untracked'] > 0:
        parts.append(f"{COLORS['gray']}?:{git_status['untracked']}{COLORS['reset']}")
    
    if parts:
        return ' '.join(parts)
    else:
        return f"{COLORS['green']}✓ Clean{COLORS['reset']}"


def count_open_tasks_with_priority(cwd):
    """Count open tasks with priority breakdown"""
    tasks_dir = Path(cwd) / 'sessions' / 'tasks'
    priority_counts = {'h': 0, 'm': 0, 'l': 0, '?': 0}
    
    if tasks_dir.exists() and tasks_dir.is_dir():
        for task_file in tasks_dir.glob('*.md'):
            try:
                # Skip done tasks
                if 'done' in str(task_file):
                    continue
                    
                content = task_file.read_text(encoding='utf-8')
                # Check if task is not done/completed
                if not any(status in content for status in ['status: done', 'status: completed']):
                    # Get priority from filename
                    name = task_file.stem
                    if name.startswith('h-'):
                        priority_counts['h'] += 1
                    elif name.startswith('m-'):
                        priority_counts['m'] += 1
                    elif name.startswith('l-'):
                        priority_counts['l'] += 1
                    else:
                        priority_counts['?'] += 1
            except:
                pass
    
    total = sum(priority_counts.values())
    if total == 0:
        return f"{COLORS['green']}📁 No tasks{COLORS['reset']}"
    
    # Build priority display
    parts = []
    if priority_counts['h'] > 0:
        parts.append(f"{COLORS['red']}H:{priority_counts['h']}{COLORS['reset']}")
    if priority_counts['m'] > 0:
        parts.append(f"{COLORS['yellow']}M:{priority_counts['m']}{COLORS['reset']}")
    if priority_counts['l'] > 0:
        parts.append(f"{COLORS['green']}L:{priority_counts['l']}{COLORS['reset']}")
    if priority_counts['?'] > 0:
        parts.append(f"{COLORS['gray']}?:{priority_counts['?']}{COLORS['reset']}")
    
    return f"{COLORS['blue']}📁 Tasks[{total}]:{COLORS['reset']} " + '/'.join(parts)


def get_erp_status(cwd):
    """Get Bangladesh ERP-specific status indicators"""
    indicators = []
    
    # Check if we're in a finance/tax related service
    current_dir = str(cwd).lower()
    if any(term in current_dir for term in ['finance', 'tax', 'invoice', 'payment']):
        indicators.append(f"{COLORS['cyan']}💰VAT{COLORS['reset']}")
    
    if any(term in current_dir for term in ['auth', 'user', 'customer', 'supplier']):
        indicators.append(f"{COLORS['magenta']}🆔TIN{COLORS['reset']}")
    
    if any(term in current_dir for term in ['payment', 'gateway', 'transaction']):
        indicators.append(f"{COLORS['green']}📱bKash{COLORS['reset']}")
    
    if indicators:
        return ' '.join(indicators)
    else:
        return ''


def get_session_time():
    """Get current session time for tracking"""
    now = datetime.now()
    return f"{COLORS['gray']}{now.strftime('%H:%M')}{COLORS['reset']}"


def main():
    """Main function to generate enhanced statusline"""
    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
    except:
        input_data = {}
    
    # Get working directory
    cwd = (input_data.get('workspace', {}).get('current_dir') or 
           input_data.get('cwd', '') or 
           os.getcwd())
    
    # Normalize path for Windows
    cwd = str(Path(cwd).resolve())
    
    # Get all information
    total_tokens, context_limit = get_context_usage(input_data)
    progress_bar = create_progress_bar(total_tokens, context_limit)
    task_info = get_current_task_info(cwd)
    mode_info = get_progressive_mode(cwd)
    files_info = count_edited_files_detailed(cwd)
    tasks_info = count_open_tasks_with_priority(cwd)
    intelligence_info = get_intelligence_status(cwd)
    erp_info = get_erp_status(cwd)
    time_info = get_session_time()
    
    # Build statusline (3 lines for comprehensive info)
    line1 = f"{progress_bar} │ {task_info}"
    line2 = f"{mode_info} │ {files_info} │ {tasks_info}"
    
    # Line 3: Intelligence and ERP status (only if relevant)
    line3_parts = []
    if intelligence_info and 'All Clear' not in intelligence_info:
        line3_parts.append(intelligence_info)
    if erp_info:
        line3_parts.append(erp_info)
    line3_parts.append(time_info)
    
    # Output statusline
    print(line1)
    print(line2)
    if len(line3_parts) > 1 or 'All Clear' not in intelligence_info:  # Only show line 3 if there's something interesting
        print(' │ '.join(line3_parts))


if __name__ == '__main__':
    main()