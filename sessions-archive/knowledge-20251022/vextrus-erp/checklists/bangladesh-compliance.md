# Bangladesh ERP Compliance Checklist

**Purpose**: NBR (National Board of Revenue) regulatory compliance validation
**Last Updated**: 2025-10-20

---

## Tax Identification

### TIN/BIN Validation
- [ ] TIN: 10-digit format
- [ ] BIN: 9-digit format
- [ ] NID for individuals
- [ ] NBR API verification integrated

---

## VAT (Value Added Tax)

### VAT Rates (NBR Standard)
- [ ] Standard: 15% (default)
- [ ] Reduced: 7.5% (specified categories)
- [ ] Reduced: 5% (specified categories)
- [ ] Zero-rated: 0% (exports)
- [ ] Exempted items flagged

### VAT Compliance
- [ ] Monthly VAT return (Mushak 9.1) generated
- [ ] Submission by 15th of following month
- [ ] Treasury challan for payment
- [ ] Return acknowledgment stored

---

## Mushak Forms (NBR Official)

### Mushak 6.1 (Tax Invoice)
- [ ] Business name and BIN
- [ ] Customer name and BIN/TIN
- [ ] Sequential invoice number
- [ ] VAT amount displayed
- [ ] Bengali translations
- [ ] QR code (if required)

### Mushak 6.3 (Purchase Register)
- [ ] All purchases recorded
- [ ] Supplier BIN/TIN captured
- [ ] Input VAT tracked
- [ ] Supporting documents referenced

### Mushak 9.1 (Monthly VAT Return)
- [ ] Sales summary
- [ ] Output VAT calculation
- [ ] Purchase summary with input VAT
- [ ] Net VAT payable/refundable
- [ ] Authorized signature

---

## TDS (Tax Deducted at Source)

### TDS Rates
- [ ] Contractors: 7%
- [ ] Professional services: 10%
- [ ] Suppliers: 4%
- [ ] Rent: 5%
- [ ] Higher rate (1.5x) for non-TIN vendors

### TDS Compliance
- [ ] TDS deducted at payment
- [ ] Challan deposited within 7 days
- [ ] TDS certificate issued
- [ ] Quarterly return submitted

---

## Fiscal Year & Reporting

- [ ] Fiscal year: July 1 - June 30
- [ ] Monthly VAT reporting
- [ ] Income tax return by November 30
- [ ] Annual corporate tax calculated

---

## Bengali Language Support

- [ ] Bengali numerals (০১২৩৪৫৬৭৮৯)
- [ ] Bengali month names
- [ ] Amount in Bengali words (টাকা মাত্র)
- [ ] Financial terms translated (ভ্যাট, চালান)
- [ ] SolaimanLipi or Kalpurush font
- [ ] Bilingual documents

---

## Payment & Banking

### Bangladesh Payment Gateways
- [ ] bKash integration
- [ ] Nagad integration
- [ ] SSLCommerz (card payments)
- [ ] Payment confirmation tracking

### Treasury Challan
- [ ] Treasury code for location
- [ ] Economic code for tax type
- [ ] 4 copies generated
- [ ] Barcode for bank scanning
- [ ] Weekend adjustment (Friday/Saturday)

---

## Audit & Security

- [ ] All transactions logged (immutable)
- [ ] Event sourcing implemented
- [ ] 7-year retention enforced
- [ ] Customer data encrypted
- [ ] Access control (RBAC)
- [ ] Multi-tenant isolation

---

## Quick Reference

### Key Deadlines
- VAT Return: 15th of following month
- TDS Deposit: Within 7 days
- Income Tax Return: November 30
- Fiscal Year End: June 30

### Contact
- NBR Helpline: 16555
- VAT Portal: https://vatportal.nbr.gov.bd
- eTIN: https://secure.incometax.gov.bd

---

**Version**: 1.0
**Reference**: `sessions/tasks/done/h-implement-finance-module-integrated/`
