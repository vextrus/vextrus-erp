#!/usr/bin/env python3
"""
Claude Code StatusLine Script - Clean & Focused
CC 2.0.22 - Optimized for 135k free space baseline
Focus: Context usage, Task, Git, Skills/Agents
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

# UTF-8 encoding for Windows
if sys.platform == 'win32':
    try:
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
        os.system('chcp 65001 > nul 2>&1')
    except:
        pass

# ANSI color codes
COLORS = {
    'green': '\033[38;5;114m',
    'orange': '\033[38;5;215m',
    'red': '\033[38;5;203m',
    'gray': '\033[38;5;242m',
    'text': '\033[38;5;250m',
    'cyan': '\033[38;5;111m',
    'purple': '\033[38;5;183m',
    'yellow': '\033[38;5;215m',
    'blue': '\033[38;5;111m',
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
            modified = sum(1 for line in lines if line and line[0] in 'M ')
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
    """Calculate context usage - baseline 65k used, 135k free"""
    context_limit = 200000  # 200k total

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
                    if data.get('isSidechain', False):
                        continue

                    if data.get('message', {}).get('usage'):
                        timestamp = data.get('timestamp')
                        if timestamp and (not most_recent_timestamp or timestamp > most_recent_timestamp):
                            most_recent_timestamp = timestamp
                            most_recent_usage = data['message']['usage']
                except:
                    continue

            if most_recent_usage:
                total_tokens = (
                    most_recent_usage.get('input_tokens', 0) +
                    most_recent_usage.get('cache_read_input_tokens', 0) +
                    most_recent_usage.get('cache_creation_input_tokens', 0)
                )
        except:
            pass

    # Baseline: 65k (new session optimized)
    if total_tokens == 0:
        total_tokens = 65000

    return total_tokens, context_limit


def create_progress_bar(total_tokens, context_limit):
    """Context progress bar - optimized for 135k free baseline"""
    progress_pct = (total_tokens * 100.0 / context_limit)
    free_tokens = context_limit - total_tokens

    formatted_used = f"{total_tokens // 1000}k"
    formatted_free = f"{free_tokens // 1000}k"

    # Progress bar (20 blocks for precision)
    bar_width = 20
    filled_blocks = min(bar_width, int(progress_pct * bar_width / 100))
    empty_blocks = bar_width - filled_blocks

    # Color based on free space (target: >120k free)
    if free_tokens > 120000:  # >120k free (green)
        bar_color = COLORS['green']
        indicator = ' ✓'
    elif free_tokens > 80000:  # >80k free (yellow)
        bar_color = COLORS['yellow']
        indicator = ''
    elif free_tokens > 50000:  # >50k free (orange)
        bar_color = COLORS['orange']
        indicator = ' ⚠'
    else:  # <50k free (red - needs compacting)
        bar_color = COLORS['red']
        indicator = ' 🔴 COMPACT'

    bar = bar_color + ('█' * filled_blocks)
    bar += COLORS['gray'] + ('░' * empty_blocks)
    bar += f"{COLORS['reset']} {COLORS['text']}{progress_pct:.0f}% ({formatted_used}/{formatted_free} free){indicator}{COLORS['reset']}"

    return bar


def get_current_task(cwd):
    """Get current task name"""
    task_file = Path(cwd) / '.claude' / 'state' / 'current_task.json'
    if task_file.exists():
        try:
            with open(task_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                task_name = data.get('task')

                if task_name and task_name != 'null':
                    return f"{COLORS['cyan']}📋 {task_name}{COLORS['reset']}"
        except:
            pass
    return f"{COLORS['gray']}📋 No task{COLORS['reset']}"


def get_git_info(cwd):
    """Git status summary"""
    git_status = get_git_status(cwd)

    if git_status['total'] == 0:
        return f"{COLORS['green']}✓ Clean{COLORS['reset']}"

    parts = []
    if git_status['modified'] > 0:
        parts.append(f"{COLORS['yellow']}M:{git_status['modified']}{COLORS['reset']}")
    if git_status['added'] > 0:
        parts.append(f"{COLORS['green']}A:{git_status['added']}{COLORS['reset']}")
    if git_status['deleted'] > 0:
        parts.append(f"{COLORS['red']}D:{git_status['deleted']}{COLORS['reset']}")
    if git_status['untracked'] > 0:
        parts.append(f"{COLORS['gray']}?:{git_status['untracked']}{COLORS['reset']}")

    return f"{COLORS['text']}Git:{COLORS['reset']} " + ' '.join(parts)


def get_workflow_info():
    """Skills + Agents count"""
    return f"{COLORS['purple']}⚙9 Skills{COLORS['reset']} {COLORS['gray']}│{COLORS['reset']} {COLORS['cyan']}🤖21 Agents{COLORS['reset']}"


def get_time():
    """Session time"""
    return f"{COLORS['gray']}{datetime.now().strftime('%H:%M')}{COLORS['reset']}"


def main():
    """Generate clean statusline"""
    try:
        input_data = json.load(sys.stdin)
    except:
        input_data = {}

    cwd = (input_data.get('workspace', {}).get('current_dir') or
           input_data.get('cwd', '') or
           os.getcwd())
    cwd = str(Path(cwd).resolve())

    # Get components
    total_tokens, context_limit = get_context_usage(input_data)
    progress_bar = create_progress_bar(total_tokens, context_limit)
    task = get_current_task(cwd)
    git = get_git_info(cwd)
    workflow = get_workflow_info()
    time = get_time()

    # Output (2 lines, clean and focused)
    print(f"{progress_bar} │ {task}")
    print(f"{workflow} │ {git} │ {time}")


if __name__ == '__main__':
    main()
