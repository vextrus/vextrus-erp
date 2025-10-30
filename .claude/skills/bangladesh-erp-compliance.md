---
name: bangladesh-erp-compliance
description: |
  Bangladesh VAT, TDS, Mushak compliance patterns for construction & real estate ERP.
  Auto-activates on: VAT, TDS, invoice, Mushak, fiscal year, NBR, compliance, tax.
triggers:
  - VAT
  - TDS
  - invoice
  - Mushak
  - fiscal year
  - NBR
  - compliance
  - tax
  - payment
  - TIN
  - BIN
---

# Bangladesh ERP Compliance (Quick Reference)

## VAT (Value Added Tax)

**Rates**:
- Standard: **15%** (construction, most services)
- Reduced: **7.5%** (specific goods/services per NBR)
- Zero-Rated: **0%** (exports, designated sectors)

**Rule**: Always apply correct VAT rate based on transaction type.

---

## TDS/AIT (Tax Deducted at Source)

**Rates**:
- With TIN: **5%**
- Without TIN: **7.5%**
- Professional Services: **10%** (consultants, contractors)

**Rule**: Withhold TDS on payments. Higher rate if no TIN.

---

## Mushak 6.3 (VAT Challan)

**Requirements**:
- Auto-generate on invoice approval
- Include: TIN/BIN, VAT breakdown, QR code
- Format: PDF (NBR compliant)
- Submission: Within 15 days of month-end

**Rule**: Generate Mushak 6.3 for all VAT transactions.

---

## Fiscal Year

**Bangladesh Fiscal Year**: **July 1 - June 30** (NOT calendar year)

**Examples**:
- FY 2024-2025: Jul 1, 2024 - Jun 30, 2025
- FY 2025-2026: Jul 1, 2025 - Jun 30, 2026

**Rule**: Use fiscal year for all financial reporting.

---

## Submission Deadlines

- **Mushak 6.3**: Within 15 days of month-end
- **Example**: February transactions → Submit by March 15

---

## Compliance Checklist

**Before Invoice Approval**:
- [ ] TIN/BIN verified
- [ ] VAT rate correct
- [ ] TDS calculated (if applicable)
- [ ] Fiscal year correct
- [ ] Mushak 6.3 configured

---

## Quick Patterns

**VAT Calculation**: `amount * 0.15` (standard)
**TDS Calculation**: `amount * (hasTIN ? 0.05 : 0.075)` (or 0.10 for professional)
**Fiscal Year**: Current if month ≥ 7, else previous

---

## Reference

- **NBR**: https://nbr.gov.bd
- **Full Patterns**: `VEXTRUS-PATTERNS.md` sections 11-13
- **Implementation**: See domain aggregates for full code

---

**Always ensure Bangladesh compliance for all financial operations.**
