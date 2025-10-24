# security-sentinel Agent Card

**Type**: Security Audit
**Model**: Sonnet 4.5
**When**: Auth, RBAC, sensitive data, external APIs

---

## Quick Invocation

```
I'm running security-sentinel agent to audit security.

Scope: [authentication/RBAC/data-handling]
Files: [list files]

[Use Task tool with subagent_type=compounding-engineering:security-sentinel]
```

---

## What It Does

Audits for:
- Authentication vulnerabilities
- Authorization bypass (RBAC)
- SQL injection
- XSS/CSRF
- Sensitive data exposure
- API security
- Token handling
- Input validation

---

## Use Cases

### ALWAYS Audit When
- ✅ Authentication logic changes
- ✅ RBAC/permissions implementation
- ✅ Payment processing
- ✅ API endpoints handling sensitive data
- ✅ Database queries with user input
- ✅ File uploads/downloads
- ✅ External API integrations

### Skip When
- ❌ Internal domain logic (no external input)
- ❌ Read-only queries with no user input
- ❌ UI components (no data handling)

---

## Typical Output

```
🔒 Security Audit Complete

Severity Breakdown:
- Critical: 0
- High: 1
- Medium: 2
- Low: 3

HIGH Severity:
- invoice.resolver.ts:45 - Missing RBAC check on `deleteInvoice` mutation
  Fix: Add @UseGuards(JwtAuthGuard, RBACGuard) with 'invoice:delete' permission

MEDIUM Severity:
- payment.service.ts:78 - Logging sensitive payment details
  Fix: Redact card numbers in logs

- create-invoice.dto.ts:12 - No input length validation
  Fix: Add @MaxLength() decorator

Status: ⚠️ FIX HIGH ISSUES BEFORE DEPLOYMENT
```

---

## Severity Levels

- **Critical**: Immediate security risk, blocks deployment
- **High**: Serious vulnerability, fix before merge
- **Medium**: Should fix, but not blocking
- **Low**: Nice to have, technical debt

**Deployment Threshold**: 0 Critical, 0 High issues

---

## Integration with Workflow

```
1. Implement auth/RBAC feature
2. Run kieran-typescript-reviewer (code quality)
3. Run security-sentinel ← HERE
4. Fix Critical/High issues
5. Re-run if needed
6. Create checkpoint
7. Commit
```

---

## Checklist

- [ ] Security-sensitive changes identified
- [ ] Agent invoked with scope
- [ ] Vulnerabilities documented
- [ ] Critical/High issues fixed
- [ ] Re-audit if major fixes
- [ ] Ready for deployment
