#!/usr/bin/env python3
"""
Claude Code StatusLine Script
Provides comprehensive session information in a clean format
Windows-compatible Python version
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
    except:
        pass

# ANSI color codes
COLORS = {
    'green': '\033[38;5;114m',      # AAD94C
    'orange': '\033[38;5;215m',     # FFB454
    'red': '\033[38;5;203m',        # F26D78
    'gray': '\033[38;5;242m',       # Dim
    'text': '\033[38;5;250m',       # BFBDB6
    'cyan': '\033[38;5;111m',       # 59C2FF
    'purple': '\033[38;5;183m',     # D2A6FF
    'yellow': '\033[38;5;215m',     # FFB454
    'blue': '\033[38;5;111m',       # 73B8FF
    'reset': '\033[0m'
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
            # Count lines that start with A, M or have them in second position
            modified_count = sum(1 for line in lines if line and (
                line[0] in 'AM' or (len(line) > 1 and line[1] in 'AM')
            ))
            return modified_count
    except:
        pass
    return 0


def get_context_usage(input_data):
    """Calculate context usage from transcript"""
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
    """Create a visual progress bar with context usage"""
    progress_pct = min(100.0, (total_tokens * 100.0 / context_limit))
    progress_pct_int = int(progress_pct)
    
    # Format token counts
    formatted_tokens = f"{total_tokens // 1000}k"
    formatted_limit = f"{context_limit // 1000}k"
    
    # Create progress bar
    filled_blocks = min(10, progress_pct_int // 10)
    empty_blocks = 10 - filled_blocks
    
    # Choose color based on usage
    if progress_pct_int < 50:
        bar_color = COLORS['green']
    elif progress_pct_int < 80:
        bar_color = COLORS['orange']
    else:
        bar_color = COLORS['red']
    
    # Build bar
    bar = bar_color + ('█' * filled_blocks)
    bar += COLORS['gray'] + ('░' * empty_blocks)
    bar += f"{COLORS['reset']} {COLORS['text']}{progress_pct:.1f}% ({formatted_tokens}/{formatted_limit}){COLORS['reset']}"
    
    return bar


def get_current_task(cwd):
    """Get the current task from state file"""
    task_file = Path(cwd) / '.claude' / 'state' / 'current_task.json'
    if task_file.exists():
        try:
            with open(task_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                task_name = data.get('task', 'None')
                return f"{COLORS['cyan']}Task: {task_name}{COLORS['reset']}"
        except:
            pass
    return f"{COLORS['cyan']}Task: None{COLORS['reset']}"


def get_daic_mode(cwd):
    """Get the current DAIC mode"""
    daic_file = Path(cwd) / '.claude' / 'state' / 'daic-mode.json'
    mode = 'discussion'  # default
    
    if daic_file.exists():
        try:
            with open(daic_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mode = data.get('mode', 'discussion')
        except:
            pass
    
    if mode == 'discussion':
        return f"{COLORS['purple']}DAIC: Discussion{COLORS['reset']}"
    else:
        return f"{COLORS['green']}DAIC: Implementation{COLORS['reset']}"


def count_edited_files(cwd):
    """Count edited files in git"""
    modified_count = get_git_status(cwd)
    return f"{COLORS['yellow']}✎ {modified_count} files{COLORS['reset']}"


def count_open_tasks(cwd):
    """Count open tasks in the tasks directory"""
    tasks_dir = Path(cwd) / 'sessions' / 'tasks'
    open_count = 0
    
    if tasks_dir.exists() and tasks_dir.is_dir():
        for task_file in tasks_dir.glob('*.md'):
            try:
                content = task_file.read_text(encoding='utf-8')
                # Check if task is not done/completed
                if not any(status in content for status in ['Status: done', 'Status: completed']):
                    open_count += 1
            except:
                pass
    
    return f"{COLORS['blue']}[{open_count} open]{COLORS['reset']}"


def main():
    """Main function to generate statusline"""
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
    task_info = get_current_task(cwd)
    daic_info = get_daic_mode(cwd)
    files_info = count_edited_files(cwd)
    tasks_info = count_open_tasks(cwd)
    
    # Output statusline (two lines)
    print(f"{progress_bar} | {task_info}")
    print(f"{daic_info} | {files_info} | {tasks_info}")


if __name__ == '__main__':
    main()