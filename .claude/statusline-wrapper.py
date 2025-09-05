#!/usr/bin/env python3
"""
Claude Code StatusLine Script - Windows Compatible Python Version
Provides comprehensive session information in a clean format
"""

import sys
import json
import os
from pathlib import Path
import subprocess
import re
import io

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def get_git_status(cwd):
    """Count modified and staged files"""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=2
        )
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n') if result.stdout.strip() else []
            # Count lines that start with M, A, or have M/A in second position
            modified_count = sum(1 for line in lines if re.match(r'^[AM]|^.[AM]', line))
            return modified_count
        return 0
    except:
        return 0

def calculate_context(input_data):
    """Calculate context usage and create progress bar"""
    model_name = input_data.get('model', {}).get('display_name', 'Claude')
    transcript_path = input_data.get('transcript_path', '')
    
    # Determine usable context limit (80% of theoretical before auto-compact)
    if 'Sonnet' in model_name:
        context_limit = 800000  # 800k usable for 1M Sonnet models
    else:
        context_limit = 160000  # 160k usable for 200k models (Opus, etc.)
    
    total_tokens = 0
    
    if transcript_path and os.path.isfile(transcript_path):
        try:
            with open(transcript_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            most_recent_usage = None
            most_recent_timestamp = None
            
            for line in lines:
                try:
                    data = json.loads(line.strip())
                    # Skip sidechain entries (subagent calls)
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
            
            # Calculate context length (input + cache tokens only, NOT output)
            if most_recent_usage:
                total_tokens = (
                    most_recent_usage.get('input_tokens', 0) +
                    most_recent_usage.get('cache_read_input_tokens', 0) +
                    most_recent_usage.get('cache_creation_input_tokens', 0)
                )
        except:
            pass
    
    # Default if no transcript available
    if total_tokens == 0:
        total_tokens = 17900
    
    # Calculate percentage
    progress_pct = min(100.0, (total_tokens * 100 / context_limit))
    progress_pct_int = min(100, int(progress_pct))
    
    # Format token counts
    formatted_tokens = f"{total_tokens // 1000}k"
    formatted_limit = f"{context_limit // 1000}k"
    
    # Create progress bar using ASCII characters for Windows compatibility
    filled_blocks = min(10, progress_pct_int // 10)
    empty_blocks = 10 - filled_blocks
    
    # Create progress bar with Unicode box characters
    progress_bar = "[" + "█" * filled_blocks + "░" * empty_blocks + "]"
    progress_bar += f" {progress_pct:.1f}% ({formatted_tokens}/{formatted_limit})"
    
    return progress_bar

def get_current_task(cwd):
    """Get current task from state file"""
    task_file = Path(cwd) / ".claude" / "state" / "current_task.json"
    if task_file.exists():
        try:
            with open(task_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                task_name = data.get('task', 'None')
        except:
            task_name = 'None'
    else:
        task_name = 'None'
    
    return f"Task: {task_name}"

def get_daic_mode(cwd):
    """Get current DAIC mode from state file"""
    mode_file = Path(cwd) / ".claude" / "state" / "daic-mode.json"
    
    mode = 'discussion'
    if mode_file.exists():
        try:
            with open(mode_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mode = data.get('mode', 'discussion')
        except:
            pass
    
    if mode == 'discussion':
        purple = "\033[38;5;183m"
        reset = "\033[0m"
        return f"{purple}DAIC: Discussion{reset}"
    else:
        green = "\033[38;5;114m"
        reset = "\033[0m"
        return f"{green}DAIC: Implementation{reset}"

def count_edited_files(cwd):
    """Count edited files using git"""
    yellow = "\033[38;5;215m"
    reset = "\033[0m"
    
    if (Path(cwd) / ".git").exists():
        modified_count = get_git_status(cwd)
        return f"{yellow}✎ {modified_count} files{reset}"
    else:
        return f"{yellow}✎ 0 files{reset}"

def count_open_tasks(cwd):
    """Count open tasks in sessions/tasks directory"""
    blue = "\033[38;5;111m"
    reset = "\033[0m"
    
    tasks_dir = Path(cwd) / "sessions" / "tasks"
    open_count = 0
    
    if tasks_dir.exists():
        for task_file in tasks_dir.glob("*.md"):
            try:
                content = task_file.read_text(encoding='utf-8')
                if not re.search(r'Status:\s*(done|completed)', content, re.IGNORECASE):
                    open_count += 1
            except:
                pass
    
    return f"{blue}[{open_count} open]{reset}"

def main():
    """Main entry point"""
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Extract basic info
        cwd = input_data.get('workspace', {}).get('current_dir') or input_data.get('cwd', '')
        
        # Build statusline components
        progress_info = calculate_context(input_data)
        task_info = get_current_task(cwd)
        daic_info = get_daic_mode(cwd)
        files_info = count_edited_files(cwd)
        tasks_info = count_open_tasks(cwd)
        
        # Output the complete statusline in two lines
        # Line 1: Progress bar | Current task
        # Line 2: DAIC mode | Files edited | Open tasks
        print(f"{progress_info} | {task_info}")
        print(f"{daic_info} | {files_info} | {tasks_info}")
        
    except Exception as e:
        # Fallback output if something goes wrong
        print(f"StatusLine Error: {str(e)}")
        print("DAIC: Unknown | ✎ 0 files | [0 open]")

if __name__ == "__main__":
    main()