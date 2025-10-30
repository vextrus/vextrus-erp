# StatusLine Script Migration Guide

## Overview
The statusline script provides real-time session information at the bottom of your Claude Code interface. The optimized version adds progressive mode awareness, intelligence tool alerts, and ERP-specific indicators.

## Key Improvements in Optimized StatusLine

### 1. Progressive Mode Display (Replaces DAIC)
**Old**: `DAIC: Discussion` or `DAIC: Implementation`
**New**: 
- `🔍 Explore` - Read-only mode (cyan)
- `🧪 Prototype` - Test directory writes (purple)
- `🔨 Implement` - Full implementation (green)
- `✓ Validate` - Testing mode (yellow)
- `🚀 Deploy` - Production mode (red)

### 2. Enhanced Task Information
**Old**: `Task: task-name`
**New**: `📋 task-name [Large:65]` - Shows complexity score and category

### 3. Detailed Git Status
**Old**: `✎ 3 files`
**New**: `M:2 A:1 D:0 ?:3` - Shows Modified/Added/Deleted/Untracked separately

### 4. Priority-Based Task Count
**Old**: `[5 open]`
**New**: `📁 Tasks[5]: H:2/M:2/L:1` - Shows High/Medium/Low priority breakdown

### 5. Intelligence Tool Alerts (NEW)
Shows real-time alerts from intelligence tools:
- `⚠NBR` - Compliance issues detected
- `⚡Perf` - Performance alerts
- `📡API` - Undocumented endpoints
- `✓ All Clear` - No issues

### 6. Context Optimization Indicators
Enhanced progress bar with optimization warnings:
- **< 75%**: Normal display
- **75-80%**: Orange color warning
- **80-90%**: `⚠ OPT` - Optimization recommended
- **> 90%**: `🔴 CRITICAL` - Immediate action needed

### 7. ERP Domain Indicators (NEW)
Context-aware indicators based on current service:
- `💰VAT` - In finance/tax services
- `🆔TIN` - In auth/customer services
- `📱bKash` - In payment services

## Migration Steps

### Step 1: Backup Current StatusLine
```bash
cp statusline-script.py statusline-script-legacy.py
```

### Step 2: Test Optimized Version
```bash
# Test the new script standalone
echo '{"workspace": {"current_dir": "."}}' | python statusline-script-optimized.py
```

### Step 3: Update Claude Settings
Replace the statusline configuration in `.claude/settings.json`:

```json
{
  "statusLine": {
    "command": "python",
    "args": ["${CLAUDE_PROJECT_DIR}/statusline-script-optimized.py"]
  }
}
```

### Step 4: Verify Display
The optimized statusline should show 2-3 lines:
```
Line 1: Progress Bar │ Task Info with Complexity
Line 2: Progressive Mode │ Git Status │ Task Priorities
Line 3: Intelligence Alerts │ ERP Indicators │ Time (optional)
```

## Display Examples

### Example 1: Normal Development
```
███████████░░░░ 72.5% (116k/160k) │ 📋 implement-invoice-system [Large:65]
🔨 Implement │ M:3 A:2 │ 📁 Tasks[4]: H:1/M:2/L:1
✓ All Clear │ 14:35
```

### Example 2: Context Warning
```
█████████████░░ 85.0% (136k/160k) ⚠ OPT │ 📋 fix-payment-bug [Simple:15]
🔍 Explore │ ✓ Clean │ 📁 Tasks[2]: H:2
⚠NBR │ 💰VAT │ 15:20
```

### Example 3: Critical State
```
███████████████ 92.0% (147k/160k) 🔴 CRITICAL │ 📋 refactor-auth [Epic:95]
✓ Validate │ M:8 D:2 │ 📁 Tasks[6]: H:4/M:2
⚠NBR ⚡Perf 📡API │ 🆔TIN │ 16:45
```

## Troubleshooting

### Issue: Emojis not displaying on Windows
**Solution**: The script includes ASCII fallbacks:
```python
# If emojis fail, you'll see:
[E] Explore instead of 🔍 Explore
[P] Prototype instead of 🧪 Prototype
```

### Issue: StatusLine not updating
**Solution**: Check state files exist:
```bash
ls .claude/state/progressive-mode.json
ls .claude/state/current_task.json
```

### Issue: Intelligence alerts not showing
**Solution**: Run intelligence tools to generate state:
```bash
python .claude/libs/business-rule-registry.py scan
python .claude/libs/performance-baseline-metrics.py baseline
```

### Issue: UTF-8 encoding errors
**Solution**: The script auto-configures Windows console:
```python
# Automatically sets:
- UTF-8 codec wrapper
- Code page 65001
- Fallback encoding
```

## Feature Comparison

| Feature | Old StatusLine | Optimized StatusLine |
|---------|---------------|---------------------|
| Mode Display | Binary DAIC | 5 Progressive Modes |
| Task Info | Name only | Name + Complexity |
| Git Status | Total count | Detailed M/A/D/? |
| Task Count | Total only | Priority breakdown |
| Context Warning | At 75%/90% | Progressive with OPT/CRITICAL |
| Intelligence | None | Live alerts |
| ERP Context | None | Domain indicators |
| Lines | 2 | 2-3 (dynamic) |
| Colors | 6 | 10 (more nuanced) |
| Windows Support | Basic | Enhanced UTF-8 |

## Configuration Options

The optimized statusline respects these environment variables:
```bash
# Disable emoji mode
export CLAUDE_ASCII_MODE=1

# Force specific context limit
export CLAUDE_CONTEXT_LIMIT=160000

# Enable debug output
export CLAUDE_STATUSLINE_DEBUG=1
```

## Performance Impact

The optimized statusline is slightly more complex but still lightweight:
- **Execution time**: ~50ms (vs 30ms original)
- **Additional file reads**: 3-4 state files
- **Memory usage**: Negligible (<1MB)
- **Update frequency**: On each command

## Best Practices

### DO's ✅
- Keep state files updated for accurate display
- Run intelligence tools periodically for alerts
- Use the statusline to monitor context usage
- Pay attention to mode indicators

### DON'Ts ❌
- Don't ignore CRITICAL context warnings
- Don't work in wrong mode (check statusline)
- Don't ignore intelligence alerts
- Don't modify state files manually

## Quick Reference

### StatusLine Symbols
```
Progress Bar:
█ - Used context
░ - Available context

Modes:
🔍/[E] - Explore
🧪/[P] - Prototype
🔨/[I] - Implement
✓/[V] - Validate
🚀/[D] - Deploy

Git Status:
M: Modified files
A: Added files
D: Deleted files
?: Untracked files

Alerts:
⚠ - Warning
🔴 - Critical
✓ - All Clear
OPT - Optimization needed

ERP:
💰 - Financial/VAT
🆔 - Identity/TIN
📱 - Payment gateway
```

## Rollback Procedure

If issues occur, rollback to original:
```bash
# Restore original script
cp statusline-script-legacy.py statusline-script.py

# Update settings.json
{
  "statusLine": {
    "command": "python",
    "args": ["${CLAUDE_PROJECT_DIR}/statusline-script.py"]
  }
}
```

---
*The optimized statusline provides real-time awareness of your development state, helping prevent issues before they occur.*