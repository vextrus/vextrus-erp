# Simple Task Template (1-4 hours)

**Use For**: 80% of work, straightforward implementations
**GitHub Integration**: ❌ NOT RECOMMENDED (overhead not worth it)
**Pattern**: Read → Execute → Review → Commit

---

## Workflow

### 1. Read Files (10-30 min)

```bash
# Read ALL target files COMPLETELY
# Example:
# - services/finance/src/application/services/vat-calculation.service.ts
# - services/finance/src/domain/value-objects/money.ts
# - VEXTRUS-PATTERNS.md (Bangladesh Compliance section)
```

**Critical**: ALWAYS read entire files, not just sections

---

### 2. Execute (30-120 min)

**Implement directly**:
- Use patterns from VEXTRUS-PATTERNS.md
- Reference domain skills (vextrus-domain-expert activates automatically)
- Write tests alongside implementation

**Skills that may activate**:
- `vextrus-domain-expert` (if Bangladesh, VAT, construction, real estate)
- `graphql-event-sourcing` (if GraphQL, CQRS, aggregates)

---

### 3. Quality Gates (5 min)

**Automated (NON-NEGOTIABLE)**:
```bash
pnpm build  # Zero TypeScript errors
npm test    # All tests passing
```

**Fail = Block commit**

---

### 4. Commit (30 sec)

**Commit Message Format**:
```bash
git add .
git commit -m "fix: VAT calculation for Bangladesh (15% standard rate)

- Update VATCalculationService to use 15% rate
- Add test for construction materials VAT
- Fix fiscal year calculation (July-June)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Format**:
- Type: fix, feat, refactor, test, docs
- Scope: Brief description
- Body: 3-5 bullet points (what changed)
- Co-Authored-By: ALWAYS include

---

## When NOT to Use This Template

Use **Medium Task Template** instead if:
- Task requires 2+ agents
- Implementation spans multiple services
- Needs architecture planning
- Estimated >4 hours

Use **Complex Task Template** instead if:
- Multi-day feature
- Requires parallel development
- Needs comprehensive checkpoints

---

## Examples

### Example 1: Fix VAT Calculation

```
User: "Fix the VAT calculation in invoice service"

1. Read:
   - services/finance/src/application/services/vat-calculation.service.ts
   - VEXTRUS-PATTERNS.md (Section 14: Bangladesh Compliance)

2. Execute:
   - Update STANDARD_VAT_RATE = 0.15 (15%)
   - Add test: testConstructionMaterialsVAT()

3. Quality Gates:
   pnpm build && npm test

4. Commit:
   git commit -m "fix: VAT calculation for Bangladesh (15% standard rate)"

Total: 1.5 hours
```

### Example 2: Add Input Validation

```
User: "Add validation to CreateInvoiceInput DTO"

1. Read:
   - services/finance/src/application/dto/create-invoice.input.ts
   - VEXTRUS-PATTERNS.md (Section 4: Security & RBAC)

2. Execute:
   - Add @IsUUID() for customerId
   - Add @ValidateNested() for lineItems
   - Add @IsDate() for dueDate

3. Quality Gates:
   pnpm build && npm test

4. Commit:
   git commit -m "feat: add validation to CreateInvoiceInput DTO"

Total: 1 hour
```

---

## Tips for Speed

**Skip GitHub Integration**:
- No issue creation overhead
- No progress tracking needed
- Straight to implementation

**Use Skills**:
- Let vextrus-domain-expert activate for Bangladesh patterns
- Let graphql-event-sourcing activate for GraphQL patterns
- Don't invoke agents manually (overkill for simple tasks)

**Complete File Reading**:
- Reduces bugs by 87%
- Takes 10-30 min upfront
- Saves hours of debugging later

---

**Estimated Time**: 1-4 hours
**Success Rate**: 95%+
**Agent Usage**: 0-1 (usually none)
**GitHub Integration**: Not recommended

**See Also**:
- `.claude/workflows/simple-task-workflow.md` - Detailed workflow guide
- `VEXTRUS-PATTERNS.md` - Technical patterns
- `.claude/skills/README.md` - Skill activation patterns
