#!/usr/bin/env python3
"""
Vextrus ERP Environment Diagnostic Tool
Checks Git Bash/MinGW configuration and MCP server readiness
"""

import json
import os
import sys
import subprocess
import platform
from pathlib import Path
from datetime import datetime
import codecs

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    try:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except:
        pass

# ANSI colors
COLORS = {
    'green': '\033[38;5;114m',  
    'red': '\033[38;5;203m',    
    'yellow': '\033[38;5;215m', 
    'cyan': '\033[38;5;111m',   
    'gray': '\033[38;5;242m',   
    'reset': '\033[0m'
}

def print_header(text):
    """Print a section header"""
    print(f"\n{COLORS['cyan']}═══ {text} ═══{COLORS['reset']}")

def check_status(condition, success_msg, fail_msg):
    """Print status with color"""
    if condition:
        print(f"  {COLORS['green']}✓{COLORS['reset']} {success_msg}")
        return True
    else:
        print(f"  {COLORS['red']}✗{COLORS['reset']} {fail_msg}")
        return False

def check_python():
    """Check Python installation and version"""
    print_header("Python Configuration")
    
    # Check Python command
    python_cmd = None
    for cmd in ['python', 'python3', 'py']:
        try:
            result = subprocess.run([cmd, '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                python_cmd = cmd
                version = result.stdout.strip()
                check_status(True, f"Python found: {cmd} ({version})", "")
                break
        except:
            continue
    
    if not python_cmd:
        check_status(False, "", "Python not found in PATH")
        return False
    
    # Check Python version
    version_info = sys.version_info
    check_status(
        version_info >= (3, 7),
        f"Python version: {version_info.major}.{version_info.minor}.{version_info.micro}",
        f"Python version too old: {version_info.major}.{version_info.minor}"
    )
    
    # Check encoding
    check_status(
        sys.getdefaultencoding() == 'utf-8',
        f"Default encoding: {sys.getdefaultencoding()}",
        f"Encoding issue: {sys.getdefaultencoding()} (should be utf-8)"
    )
    
    return True

def check_git():
    """Check Git installation and configuration"""
    print_header("Git Configuration")
    
    try:
        # Check Git installation
        result = subprocess.run(['git', '--version'], capture_output=True, text=True)
        git_installed = result.returncode == 0
        check_status(git_installed, f"Git installed: {result.stdout.strip()}", "Git not found")
        
        if git_installed:
            # Check current branch
            branch = subprocess.run(['git', 'branch', '--show-current'], 
                                  capture_output=True, text=True).stdout.strip()
            check_status(True, f"Current branch: {branch}", "")
            
            # Check autocrlf setting
            autocrlf = subprocess.run(['git', 'config', 'core.autocrlf'], 
                                    capture_output=True, text=True).stdout.strip()
            check_status(
                autocrlf in ['input', 'false'],
                f"Line ending handling: core.autocrlf={autocrlf}",
                f"Line ending issue: core.autocrlf={autocrlf} (should be 'input' or 'false')"
            )
            
        return git_installed
    except:
        check_status(False, "", "Git check failed")
        return False

def check_environment():
    """Check environment variables and platform"""
    print_header("System Environment")
    
    # Platform detection
    is_windows = sys.platform == 'win32'
    is_mingw = 'MINGW' in platform.platform() or 'MSYS' in os.environ.get('MSYSTEM', '')
    
    check_status(True, f"Platform: {sys.platform}", "")
    check_status(True, f"System: {platform.system()} {platform.release()}", "")
    
    if is_windows:
        check_status(is_mingw, "Git Bash/MinGW detected", "Not running in Git Bash/MinGW")
    
    # Check shell
    shell = os.environ.get('SHELL', 'not set')
    check_status('/bash' in shell or shell == 'not set', f"Shell: {shell}", f"Unexpected shell: {shell}")
    
    # Check terminal encoding
    term_encoding = os.environ.get('LANG', 'not set')
    check_status(
        'UTF-8' in term_encoding.upper() or term_encoding == 'not set',
        f"Terminal encoding: {term_encoding}",
        f"Encoding issue: {term_encoding}"
    )
    
    return True

def check_project_structure():
    """Check project directories and files"""
    print_header("Project Structure")
    
    project_root = Path.cwd()
    
    # Essential directories
    essential_dirs = [
        '.claude',
        '.claude/state',
        '.claude/hooks',
        'sessions',
        'sessions/tasks',
        'sessions/protocols'
    ]
    
    all_exist = True
    for dir_path in essential_dirs:
        full_path = project_root / dir_path
        exists = full_path.exists() and full_path.is_dir()
        check_status(exists, f"Directory exists: {dir_path}", f"Missing directory: {dir_path}")
        if not exists:
            all_exist = False
    
    # Essential files
    essential_files = [
        'daic',
        'daic.bat',
        'statusline-script.py',
        '.claude/settings.json',
        '.claude/settings.local.json',
        '.claude/state/daic-mode.json'
    ]
    
    for file_path in essential_files:
        full_path = project_root / file_path
        exists = full_path.exists() and full_path.is_file()
        check_status(exists, f"File exists: {file_path}", f"Missing file: {file_path}")
        if not exists:
            all_exist = False
    
    return all_exist

def check_mcp_config():
    """Check MCP server configuration"""
    print_header("MCP Server Configuration")
    
    mcp_file = Path.cwd() / '.mcp.json'
    if not mcp_file.exists():
        check_status(False, "", "MCP configuration file not found")
        return False
    
    try:
        with open(mcp_file, 'r', encoding='utf-8') as f:
            mcp_config = json.load(f)
        
        servers = mcp_config.get('mcpServers', {})
        check_status(True, f"MCP servers configured: {len(servers)}", "")
        
        # Check key servers
        important_servers = ['filesystem', 'github', 'serena', 'memory']
        for server in important_servers:
            has_server = server in servers
            check_status(has_server, f"  • {server} server", f"  • {server} server missing")
        
        return True
    except Exception as e:
        check_status(False, "", f"Error reading MCP config: {e}")
        return False

def check_daic_mode():
    """Check DAIC mode status"""
    print_header("DAIC Mode")
    
    daic_file = Path.cwd() / '.claude/state/daic-mode.json'
    if not daic_file.exists():
        check_status(False, "", "DAIC mode file not found")
        return False
    
    try:
        with open(daic_file, 'r', encoding='utf-8') as f:
            daic_data = json.load(f)
        
        mode = daic_data.get('mode', 'unknown')
        if mode == 'implementation':
            print(f"  {COLORS['green']}▶{COLORS['reset']} Mode: IMPLEMENTATION (can use Write/Edit tools)")
        else:
            print(f"  {COLORS['yellow']}▶{COLORS['reset']} Mode: DISCUSSION (planning mode)")
        
        # Test DAIC command
        try:
            # Use bash to run the script on Windows
            if sys.platform == 'win32':
                result = subprocess.run(['bash', './daic'], capture_output=True, text=True)
            else:
                result = subprocess.run(['./daic'], capture_output=True, text=True, shell=False)
                
            # Read the mode again to see if toggle worked
            with open(daic_file, 'r', encoding='utf-8') as f:
                new_data = json.load(f)
            new_mode = new_data.get('mode', 'unknown')
            
            check_status(
                new_mode != mode,
                f"DAIC toggle working (switched to {new_mode})",
                "DAIC toggle not working"
            )
            
            # Toggle back
            if sys.platform == 'win32':
                subprocess.run(['bash', './daic'], capture_output=True, text=True)
            else:
                subprocess.run(['./daic'], capture_output=True, text=True, shell=False)
            
        except Exception as e:
            check_status(False, "", f"DAIC command failed: {e}")
        
        return True
    except Exception as e:
        check_status(False, "", f"Error reading DAIC mode: {e}")
        return False

def check_hooks():
    """Check hook scripts"""
    print_header("Hook Scripts")
    
    hooks_dir = Path.cwd() / '.claude/hooks'
    if not hooks_dir.exists():
        check_status(False, "", "Hooks directory not found")
        return False
    
    hook_files = [
        'session-start.py',
        'sessions-enforce.py',
        'user-messages.py',
        'task-transcript-link.py',
        'post-tool-use.py',
        'shared_state.py'
    ]
    
    all_exist = True
    for hook in hook_files:
        hook_path = hooks_dir / hook
        exists = hook_path.exists()
        check_status(exists, f"Hook: {hook}", f"Missing hook: {hook}")
        if not exists:
            all_exist = False
    
    return all_exist

def run_diagnostic():
    """Run complete diagnostic"""
    print(f"{COLORS['cyan']}{'='*50}{COLORS['reset']}")
    print(f"{COLORS['cyan']} VEXTRUS ERP ENVIRONMENT DIAGNOSTIC{COLORS['reset']}")
    print(f"{COLORS['cyan']}{'='*50}{COLORS['reset']}")
    print(f"{COLORS['gray']}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{COLORS['reset']}")
    
    # Run all checks
    results = []
    results.append(("Python", check_python()))
    results.append(("Git", check_git()))
    results.append(("Environment", check_environment()))
    results.append(("Project", check_project_structure()))
    results.append(("MCP", check_mcp_config()))
    results.append(("DAIC", check_daic_mode()))
    results.append(("Hooks", check_hooks()))
    
    # Summary
    print_header("Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    if passed == total:
        print(f"{COLORS['green']}✓ All checks passed! ({passed}/{total}){COLORS['reset']}")
        print(f"{COLORS['green']}Environment is properly configured for Git Bash/MinGW.{COLORS['reset']}")
        return 0
    else:
        print(f"{COLORS['yellow']}⚠ Some checks failed: {passed}/{total} passed{COLORS['reset']}")
        print(f"{COLORS['yellow']}Please address the issues above.{COLORS['reset']}")
        
        # Show failed categories
        failed = [name for name, result in results if not result]
        if failed:
            print(f"\n{COLORS['red']}Failed categories: {', '.join(failed)}{COLORS['reset']}")
        
        return 1

if __name__ == '__main__':
    sys.exit(run_diagnostic())