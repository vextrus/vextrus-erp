# Claude Code Optimized Workflow - Training Examples

## Quick Start Guide for Team Members

This guide provides practical examples for using the optimized Claude Code workflow with progressive modes, intelligence tools, and ERP-specific features.

---

## 1. Progressive Mode Examples

### Example 1.1: Exploring a New Codebase
```bash
# Start in explore mode (read-only)
pmode explore

# Now you can safely explore without accidental changes
# Claude can read files, search, analyze, but cannot modify anything
```

**User**: "I need to understand how the payment system works"
**Claude**: [In explore mode] "I'll analyze the payment service architecture..." 
*Reads files, creates diagrams, explains flow - no modifications*

### Example 1.2: Prototyping a Solution
```bash
# Switch to prototype mode for experiments
pmode prototype

# Claude can now write to test directories only
# Perfect for POCs and trying ideas
```

**User**: "Let's try implementing a bKash integration prototype"
**Claude**: [In prototype mode] "I'll create a prototype in the test directory..."
*Creates files in .claude/test/bkash-integration/*

### Example 1.3: Implementing Features
```bash
# Ready to implement for real
pmode implement

# Full write access to implement features
```

**User**: "Make it so" (auto-triggers implement mode)
**Claude**: "Switching to implement mode. Creating the bKash integration service..."

### Example 1.4: Validation Phase
```bash
# Switch to validate mode for testing
pmode validate

# Read-only except for test execution
```

**User**: "Test this implementation"
**Claude**: [In validate mode] "Running validation suite..."
*Executes tests, generates reports, no code changes*

---

## 2. Task Complexity Management Examples

### Example 2.1: Analyzing Task Complexity
```bash
# Check complexity before starting
cd .claude/libs
python complexity-analyzer.py analyze ../../sessions/tasks/implement-invoice-system.md
```

**Output**:
```
Analyzing task: implement-invoice-system
Complexity Score: 92.5
Size Category: EPIC
Should Split: Yes

Suggested Splits (5 suggestions):
1. database-schema-migration (high priority)
2. backend-api-implementation (high priority)
3. frontend-ui-implementation (medium priority)
4. regulatory-compliance-validation (critical priority)
5. performance-optimization (high priority)
```

### Example 2.2: Generating Split Plan
```bash
python complexity-analyzer.py split ../../sessions/tasks/implement-invoice-system.md
```

**Claude's Response**:
"This task scores 92.5 complexity points (Epic category). I'll create a split plan with 5 subtasks:
1. Database migrations (25 points)
2. API implementation (30 points)
3. UI components (20 points)
4. NBR compliance (15 points)
5. Performance optimization (10 points)"

---

## 3. Intelligence Tools Examples

### Example 3.1: Checking Service Dependencies
```bash
python .claude/libs/dependency-graph-generator.py --summary
```

**Scenario**: Before modifying the auth service
**Claude**: "Let me check what depends on the auth service..."
```
Critical Services:
- auth: 8 dependents (high criticality)
  Dependents: finance, inventory, crm, hr, audit, document-generator, file-storage, gateway
```

### Example 3.2: Validating Business Rules
```bash
python .claude/libs/business-rule-registry.py validate
```

**Scenario**: After implementing tax calculations
**Claude**: "Validating Bangladesh compliance rules..."
```
✓ TIN validation (10 digits) implemented
✓ BIN validation (9 digits) implemented
✓ VAT calculation at 15% implemented
⚠ Missing: Withholding tax calculation
⚠ Missing: Fiscal year validation (July-June)
```

### Example 3.3: Checking API Contracts
```bash
python .claude/libs/integration-point-catalog.py validate
```

**Scenario**: Before deployment
**Claude**: "Validating API contracts..."
```
auth service:
⚠ Contract defined but not implemented: POST /api/auth/2fa
⚠ Endpoint implemented but no contract: GET /api/auth/sessions

finance service:
✓ All API contracts validated successfully
```

### Example 3.4: Performance Monitoring
```bash
python .claude/libs/performance-baseline-metrics.py measure auth
```

**Scenario**: After optimization
**Claude**: "Measuring performance impact..."
```
auth service performance:
- Health check: 45ms (excellent)
- Build time: 12000ms
- Test execution: 3500ms (15 tests)
- Bundle size: 245KB
📈 Performance improved by 23% from baseline
```

---

## 4. Bangladesh ERP-Specific Examples

### Example 4.1: Implementing VAT Calculation
**User**: "Implement VAT calculation for invoices"

**Claude** (checks business rules first):
```python
# Following NBR guidelines for 15% VAT
class VATCalculator:
    NBR_VAT_RATE = 0.15  # 15% as per Bangladesh NBR
    
    def calculate_vat(self, amount: Decimal, is_exempted: bool = False) -> Decimal:
        """Calculate VAT following NBR guidelines"""
        if is_exempted:
            return Decimal('0.00')
        return (amount * Decimal(str(self.NBR_VAT_RATE))).quantize(Decimal('0.01'))
```

### Example 4.2: TIN Validation
**User**: "Add TIN validation to supplier form"

**Claude** (using Bangladesh-specific validation):
```typescript
// Bangladesh TIN validation (10 digits)
export const validateTIN = (tin: string): boolean => {
  const tinRegex = /^\d{10}$/;
  if (!tinRegex.test(tin)) {
    throw new ValidationError('TIN must be exactly 10 digits');
  }
  return true;
};
```

### Example 4.3: bKash Integration
**User**: "Integrate bKash payment gateway"

**Claude** (using api-integration-tester agent):
```typescript
// bKash integration following their API v1.2.0
class BkashPaymentService {
  private readonly BASE_URL = process.env.BKASH_BASE_URL;
  private readonly APP_KEY = process.env.BKASH_APP_KEY;
  
  async createPayment(amount: number, invoice: string): Promise<BkashPaymentResponse> {
    // Following bKash API documentation
    const payload = {
      amount: amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: invoice
    };
    // ... implementation following bKash specs
  }
}
```

---

## 5. Context Management Examples

### Example 5.1: Context Warning at 80%
**System Alert**: 
```
[Context Optimizer] Context optimization recommended:
  - Focus on current task objectives
  - Archive non-essential context
```

**Claude**: "Context is at 80%. Let me archive completed subtasks and focus on the current implementation..."

### Example 5.2: Emergency Context Overflow
**System Alert**: "[90% WARNING] 144k/160k tokens used (90.0%)"

**User**: "We need to compact"

**Claude**: 
```bash
# Emergency procedure
pmode explore  # Lock writes first
python .claude/libs/context-optimizer.py emergency-archive
# Now running context-compaction protocol...
```

---

## 6. Workflow Scenarios

### Scenario 6.1: Starting a New Feature
```bash
# 1. Create task and check complexity
User: "Create a task for implementing employee payroll system"

Claude: 
- Creates task file
- Runs complexity analyzer
- Detects 85 point complexity
- Suggests splitting into 4 subtasks
- Sets mode to explore

# 2. Exploration phase
pmode explore
Claude: Analyzes existing payroll patterns, NBR tax rules, salary structures

# 3. Prototype phase  
pmode prototype
Claude: Creates POC in test directory with tax calculations

# 4. Implementation phase
pmode implement
Claude: Implements full payroll system with validations

# 5. Validation phase
pmode validate
Claude: Runs all tests, validates NBR compliance, checks performance
```

### Scenario 6.2: Emergency Production Fix
```bash
# 1. Immediate exploration
pmode explore
User: "Critical bug in payment processing"

Claude: 
- Analyzes payment service
- Identifies issue in VAT calculation
- Checks dependencies

# 2. Quick prototype
pmode prototype
Claude: Tests fix in isolation

# 3. Careful implementation
pmode implement
Claude: Applies minimal fix with validation

# 4. Thorough validation
pmode validate
Claude: 
- Runs business rule validator
- Checks API contracts
- Verifies performance impact
```

---

## 7. Common Commands Reference

### Daily Workflow Commands
```bash
# Start your day
pmode explore                          # Safe exploration mode
cat .claude/state/current_task.json    # Check current task
python complexity-analyzer.py scan     # Check all task complexities

# Before implementing
python dependency-graph-generator.py --summary  # Check dependencies
python business-rule-registry.py validate       # Validate compliance

# After implementing  
python performance-baseline-metrics.py measure service-name
python integration-point-catalog.py validate

# End of session
pmode validate                         # Switch to validation
python business-rule-registry.py report
```

### Quick Checks
```bash
# What mode am I in?
pmode

# How complex is this task?
python complexity-analyzer.py analyze task.md

# What depends on this service?
python dependency-graph-generator.py --summary | grep service-name

# Are we compliant?
python business-rule-registry.py validate

# Any performance issues?
python performance-baseline-metrics.py alerts
```

---

## 8. Team Guidelines

### DO's ✅
- Always start in explore mode for new tasks
- Check complexity before starting large tasks
- Validate Bangladesh compliance for financial features
- Run performance baseline before/after optimization
- Use prototype mode for experiments
- Check dependencies before modifying core services

### DON'Ts ❌
- Don't skip complexity analysis for large tasks
- Don't implement in production without validation
- Don't ignore NBR/RAJUK compliance requirements
- Don't modify critical paths without extra validation
- Don't skip performance checks for database changes
- Don't work in implement mode when exploring

### Red Flags 🚩
- Task complexity > 75 points without splitting
- No TIN/BIN validation in supplier/customer modules
- VAT calculation not using 15% rate
- Missing fiscal year validation (July-June)
- No health checks in new services
- Circular dependencies detected

---

## 9. Troubleshooting

### Issue: "Context overflow during implementation"
**Solution**:
```bash
pmode explore  # Lock writes
python context-optimizer.py emergency-archive
# Run context compaction protocol
```

### Issue: "Task too complex to handle"
**Solution**:
```bash
python complexity-analyzer.py split task.md
# Create subtasks based on recommendations
```

### Issue: "Compliance validation failed"
**Solution**:
```bash
python business-rule-registry.py validate --strict
# Fix each violation before proceeding
```

### Issue: "Performance degradation detected"
**Solution**:
```bash
python performance-baseline-metrics.py trends
python dependency-graph-generator.py --critical-paths
# Identify and optimize bottlenecks
```

---

## 10. Quick Win Examples

### Quick Win 1: Auto-Mode Transitions
Just say these phrases to auto-switch modes:
- "Let's explore" → explore mode
- "Try this idea" → prototype mode  
- "Make it so" → implement mode
- "Test this" → validate mode

### Quick Win 2: Smart Task Creation
```bash
User: "Create a task for VAT report generation"
Claude: [Automatically runs complexity analyzer, suggests template, sets appropriate mode]
```

### Quick Win 3: Compliance Shortcuts
```bash
User: "Implement tax calculation"
Claude: [Automatically loads NBR rules, validates rates, includes audit trail]
```

---

*Remember: The optimized workflow is designed to catch issues early, validate continuously, and maintain Bangladesh ERP compliance automatically. Trust the intelligence tools - they're your safety net!*