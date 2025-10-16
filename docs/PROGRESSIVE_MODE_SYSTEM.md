# Progressive Mode System Documentation

## Overview

The Progressive Mode System replaces the binary DAIC (Discussion/Implementation) pattern with a more nuanced 5-mode workflow specifically designed for enterprise ERP development. This system provides granular control over development phases while maintaining strict discipline and preventing accidental changes.

## Modes

### 1. 🔍 Explore Mode
**Purpose**: Research and investigation  
**Permissions**:
- Read: All files
- Write: None
- Execute: Read-only bash commands, MCP tools, Serena tools

**Use Cases**:
- Understanding existing code
- Researching architectural patterns
- Investigating bugs
- Planning implementation approaches

**Auto-Elevation Triggers**:
- "let's test this"
- "write a test"
- "create a prototype"

### 2. 🧪 Prototype Mode
**Purpose**: Testing and experimentation  
**Permissions**:
- Read: All files
- Write: Test files only (`test/**`, `**/*.test.*`, `**/*.spec.*`, `experiments/**`)
- Execute: All commands

**Use Cases**:
- Writing unit tests
- Creating proof-of-concepts
- Testing integration approaches
- Experimenting with new libraries

**Auto-Elevation Triggers**:
- "looks good"
- "implement this"
- "make it production ready"

### 3. 🔨 Implement Mode
**Purpose**: Full development access  
**Permissions**:
- Read: All files
- Write: All files
- Execute: All commands

**Use Cases**:
- Implementing features
- Fixing bugs
- Refactoring code
- Writing production code

**Auto-Elevation Triggers**:
- "validate this"
- "run tests"
- "check quality"

### 4. ✅ Validate Mode
**Purpose**: Testing and quality checks  
**Permissions**:
- Read: All files
- Write: None
- Execute: Test, lint, typecheck, build commands only

**Use Cases**:
- Running test suites
- Performing linting
- Type checking
- Building packages
- Performance testing

**Auto-Elevation Triggers**:
- "deploy it"
- "ship it"
- "push to production"

### 5. 🚀 Deploy Mode
**Purpose**: Production deployment  
**Permissions**:
- Read: All files
- Write: Configuration files only (`*.yml`, `*.yaml`, `*.json`, `*.env`)
- Execute: Deploy, rollback, monitor commands

**Use Cases**:
- Deploying to production
- Updating configurations
- Rolling back deployments
- Monitoring production

**Special Requirements**:
- Requires explicit confirmation
- Creates audit trail
- Limited to configuration changes

## Usage

### Command-Line Interface

```bash
# Show current mode and status
pmode

# Switch to a specific mode
pmode explore
pmode prototype
pmode implement
pmode validate
pmode deploy  # Requires confirmation
```

### Mode Transitions

The system supports both manual and automatic mode transitions:

1. **Manual Transitions**: Use the `pmode` command
2. **Automatic Transitions**: Triggered by specific phrases in conversation

### Transition Flow

```
explore → prototype → implement → validate → deploy
    ↑                                             ↓
    └─────────────────────────────────────────────┘
```

## Configuration Files

### `/claude/config/progressive-modes.json`
Defines mode permissions, blocked tools, and transition triggers.

### `/claude/state/progressive-mode.json`
Tracks current mode, transition history, and context retention settings.

### `/sessions/sessions-config.json`
Enables progressive mode workflow:
```json
{
  "workflow": {
    "mode": "progressive"  // or "daic" for legacy mode
  }
}
```

## Context Retention Strategies

Each mode has a specific context retention strategy:

- **explore**: `full` - Keep all context for research
- **prototype**: `relevant` - Keep test results and discoveries
- **implement**: `changes_only` - Focus on modified files
- **validate**: `results` - Keep test/lint results
- **deploy**: `audit_trail` - Maintain deployment records

## Integration with Existing Hooks

The progressive mode system integrates with existing hooks:

1. **sessions-enforce.py**: Enforces mode permissions
2. **user-messages.py**: Detects auto-elevation triggers
3. **post-tool-use.py**: Provides mode feedback
4. **session-start.py**: Initializes mode state

## Best Practices

### 1. Start in Explore Mode
Always begin new tasks in explore mode to understand the codebase before making changes.

### 2. Use Prototype for Testing
Write tests in prototype mode before implementing features.

### 3. Validate Before Deploy
Always run through validate mode before attempting deployment.

### 4. Document Mode Transitions
The system automatically tracks transitions for audit purposes.

### 5. Leverage Auto-Elevation
Use trigger phrases to smoothly transition between modes without manual commands.

## ERP-Specific Benefits

### 1. Compliance
- Explore mode ensures no accidental changes during audits
- Deploy mode requires confirmation for production changes
- Full audit trail of all mode transitions

### 2. Quality Assurance
- Prototype mode enforces test-first development
- Validate mode ensures all checks pass before deployment
- Separation of implementation and validation phases

### 3. Team Collaboration
- Clear phase indicators for team members
- Prevents accidental production changes
- Enforces review workflow through mode transitions

### 4. Risk Management
- Progressive permissions reduce error likelihood
- Deploy mode restrictions prevent accidental data loss
- Automatic context retention for troubleshooting

## Troubleshooting

### Common Issues

**Issue**: Can't write files in explore mode  
**Solution**: Switch to prototype or implement mode using `pmode prototype`

**Issue**: Deploy mode requires confirmation  
**Solution**: This is intentional for safety. Type "yes" when prompted.

**Issue**: Tool blocked in current mode  
**Solution**: Check current mode with `pmode` and transition to appropriate mode.

### Mode Reset

If needed, manually reset to explore mode:
```bash
echo '{"current_mode": "explore"}' > .claude/state/progressive-mode.json
```

## Migration from DAIC

To migrate from DAIC to Progressive Mode:

1. Update `sessions/sessions-config.json`:
   ```json
   {
     "workflow": {
       "mode": "progressive"
     }
   }
   ```

2. Create mode configuration files if not present
3. Run `pmode` to verify installation

The system maintains backward compatibility - you can switch back to DAIC mode by changing the workflow mode to "daic".

## Future Enhancements

- **Mode-specific templates**: Auto-load templates based on current mode
- **Intelligent suggestions**: AI-powered mode transition recommendations
- **Team synchronization**: Share mode state across team members
- **Custom modes**: Define project-specific modes and permissions
- **Mode analytics**: Track time spent in each mode for optimization