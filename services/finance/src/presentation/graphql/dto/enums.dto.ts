import { registerEnumType } from '@nestjs/graphql';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE',
}

export enum VATCategory {
  STANDARD = 'STANDARD',         // 15%
  REDUCED = 'REDUCED',           // 7.5%
  TRUNCATED = 'TRUNCATED',       // 5%
  ZERO_RATED = 'ZERO_RATED',     // 0%
  EXEMPT = 'EXEMPT',             // Exempt
}

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  MOBILE_WALLET = 'MOBILE_WALLET',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  ONLINE_BANKING = 'ONLINE_BANKING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RECONCILED = 'RECONCILED',
  REVERSED = 'REVERSED',
}

export enum JournalType {
  GENERAL = 'GENERAL',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  CASH_RECEIPT = 'CASH_RECEIPT',
  CASH_PAYMENT = 'CASH_PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
  REVERSING = 'REVERSING',
  CLOSING = 'CLOSING',
  OPENING = 'OPENING',
}

export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

export enum MobileWalletProvider {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  UPAY = 'UPAY',
  SURECASH = 'SURECASH',
  MCASH = 'MCASH',
  TCASH = 'TCASH',
}

// Register all enums for GraphQL
registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'Invoice lifecycle status',
});

registerEnumType(VATCategory, {
  name: 'VATCategory',
  description: 'Bangladesh VAT categories per NBR regulations',
});

registerEnumType(AccountType, {
  name: 'AccountType',
  description: 'Chart of Accounts classification',
});

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Supported payment methods',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Payment processing status',
});

registerEnumType(JournalType, {
  name: 'JournalType',
  description: 'Journal entry types for accounting',
});

registerEnumType(JournalStatus, {
  name: 'JournalStatus',
  description: 'Journal entry lifecycle status',
});

registerEnumType(MobileWalletProvider, {
  name: 'MobileWalletProvider',
  description: 'Bangladesh mobile wallet providers',
});
