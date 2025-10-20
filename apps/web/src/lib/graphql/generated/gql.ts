/* eslint-disable */
import * as types from "./graphql";

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  "query GetInvoices($limit: Int = 50, $offset: Int = 0) {\n  invoices(limit: $limit, offset: $offset) {\n    id\n    invoiceNumber\n    status\n    customerId\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetInvoice($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    status\n    vendorId\n    customerId\n    vendorTIN\n    vendorBIN\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    subtotal {\n      amount\n      currency\n    }\n    vatAmount {\n      amount\n      currency\n    }\n    supplementaryDuty {\n      amount\n      currency\n    }\n    advanceIncomeTax {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    fiscalYear\n    mushakNumber\n    challanNumber\n    lineItems {\n      description\n      quantity\n      unitPrice {\n        amount\n        currency\n      }\n    }\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetChartOfAccounts {\n  chartOfAccounts {\n    id\n    accountCode\n    accountName\n    accountType\n    parentAccountId\n    balance {\n      amount\n      currency\n    }\n    currency\n    isActive\n    createdAt\n  }\n}\n\nquery GetPaymentsByStatus($status: PaymentStatus!, $limit: Int = 50, $offset: Int = 0) {\n  paymentsByStatus(status: $status, limit: $limit, offset: $offset) {\n    id\n    paymentNumber\n    invoiceId\n    amount {\n      amount\n      currency\n    }\n    paymentMethod\n    status\n    paymentDate\n    reference\n    createdAt\n    updatedAt\n  }\n}": typeof types.GetInvoicesDocument;
  "query HealthCheck {\n  __typename\n}": typeof types.HealthCheckDocument;
};
const documents: Documents = {
  "query GetInvoices($limit: Int = 50, $offset: Int = 0) {\n  invoices(limit: $limit, offset: $offset) {\n    id\n    invoiceNumber\n    status\n    customerId\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetInvoice($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    status\n    vendorId\n    customerId\n    vendorTIN\n    vendorBIN\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    subtotal {\n      amount\n      currency\n    }\n    vatAmount {\n      amount\n      currency\n    }\n    supplementaryDuty {\n      amount\n      currency\n    }\n    advanceIncomeTax {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    fiscalYear\n    mushakNumber\n    challanNumber\n    lineItems {\n      description\n      quantity\n      unitPrice {\n        amount\n        currency\n      }\n    }\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetChartOfAccounts {\n  chartOfAccounts {\n    id\n    accountCode\n    accountName\n    accountType\n    parentAccountId\n    balance {\n      amount\n      currency\n    }\n    currency\n    isActive\n    createdAt\n  }\n}\n\nquery GetPaymentsByStatus($status: PaymentStatus!, $limit: Int = 50, $offset: Int = 0) {\n  paymentsByStatus(status: $status, limit: $limit, offset: $offset) {\n    id\n    paymentNumber\n    invoiceId\n    amount {\n      amount\n      currency\n    }\n    paymentMethod\n    status\n    paymentDate\n    reference\n    createdAt\n    updatedAt\n  }\n}":
    types.GetInvoicesDocument,
  "query HealthCheck {\n  __typename\n}": types.HealthCheckDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: "query GetInvoices($limit: Int = 50, $offset: Int = 0) {\n  invoices(limit: $limit, offset: $offset) {\n    id\n    invoiceNumber\n    status\n    customerId\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetInvoice($id: ID!) {\n  invoice(id: $id) {\n    id\n    invoiceNumber\n    status\n    vendorId\n    customerId\n    vendorTIN\n    vendorBIN\n    customerTIN\n    customerBIN\n    grandTotal {\n      amount\n      currency\n    }\n    subtotal {\n      amount\n      currency\n    }\n    vatAmount {\n      amount\n      currency\n    }\n    supplementaryDuty {\n      amount\n      currency\n    }\n    advanceIncomeTax {\n      amount\n      currency\n    }\n    invoiceDate\n    dueDate\n    fiscalYear\n    mushakNumber\n    challanNumber\n    lineItems {\n      description\n      quantity\n      unitPrice {\n        amount\n        currency\n      }\n    }\n    createdAt\n    updatedAt\n  }\n}\n\nquery GetChartOfAccounts {\n  chartOfAccounts {\n    id\n    accountCode\n    accountName\n    accountType\n    parentAccountId\n    balance {\n      amount\n      currency\n    }\n    currency\n    isActive\n    createdAt\n  }\n}\n\nquery GetPaymentsByStatus($status: PaymentStatus!, $limit: Int = 50, $offset: Int = 0) {\n  paymentsByStatus(status: $status, limit: $limit, offset: $offset) {\n    id\n    paymentNumber\n    invoiceId\n    amount {\n      amount\n      currency\n    }\n    paymentMethod\n    status\n    paymentDate\n    reference\n    createdAt\n    updatedAt\n  }\n}",
): typeof import("./graphql").GetInvoicesDocument;
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: "query HealthCheck {\n  __typename\n}",
): typeof import("./graphql").HealthCheckDocument;

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}
