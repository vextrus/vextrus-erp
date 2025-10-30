import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: string; output: string };
};

/** Chart of Accounts classification */
export enum AccountType {
  Asset = "ASSET",
  Equity = "EQUITY",
  Expense = "EXPENSE",
  Liability = "LIABILITY",
  Revenue = "REVENUE",
}

export type AddJournalLineInput = {
  accountId: Scalars["ID"]["input"];
  costCenter?: InputMaybe<Scalars["String"]["input"]>;
  creditAmount?: InputMaybe<Scalars["Float"]["input"]>;
  debitAmount?: InputMaybe<Scalars["Float"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  project?: InputMaybe<Scalars["String"]["input"]>;
  reference?: InputMaybe<Scalars["String"]["input"]>;
  taxCode?: InputMaybe<Scalars["String"]["input"]>;
};

export type AddressInput = {
  city: Scalars["String"]["input"];
  country?: Scalars["String"]["input"];
  district: Scalars["String"]["input"];
  division: Scalars["String"]["input"];
  postalCode: Scalars["String"]["input"];
  street1: Scalars["String"]["input"];
  street2?: InputMaybe<Scalars["String"]["input"]>;
};

/** Type of audit event */
export enum AuditEventType {
  AuthFailed = "AUTH_FAILED",
  AuthLogin = "AUTH_LOGIN",
  AuthLogout = "AUTH_LOGOUT",
  AuthMfaDisabled = "AUTH_MFA_DISABLED",
  AuthMfaEnabled = "AUTH_MFA_ENABLED",
  AuthPasswordChange = "AUTH_PASSWORD_CHANGE",
  BusinessTransaction = "BUSINESS_TRANSACTION",
  ComplianceConsentGiven = "COMPLIANCE_CONSENT_GIVEN",
  ComplianceConsentWithdrawn = "COMPLIANCE_CONSENT_WITHDRAWN",
  ComplianceDataAccess = "COMPLIANCE_DATA_ACCESS",
  ComplianceDataDeletion = "COMPLIANCE_DATA_DELETION",
  DataAccess = "DATA_ACCESS",
  DataCreate = "DATA_CREATE",
  DataDelete = "DATA_DELETE",
  DataExport = "DATA_EXPORT",
  DataRead = "DATA_READ",
  DataUpdate = "DATA_UPDATE",
  FileDelete = "FILE_DELETE",
  FileDownload = "FILE_DOWNLOAD",
  FileShare = "FILE_SHARE",
  FileUpload = "FILE_UPLOAD",
  PermissionChange = "PERMISSION_CHANGE",
  SecurityAccessDenied = "SECURITY_ACCESS_DENIED",
  SecurityBruteForce = "SECURITY_BRUTE_FORCE",
  SecurityEvent = "SECURITY_EVENT",
  SecuritySuspiciousActivity = "SECURITY_SUSPICIOUS_ACTIVITY",
  SystemConfig = "SYSTEM_CONFIG",
  SystemConfigChange = "SYSTEM_CONFIG_CHANGE",
  UserCreate = "USER_CREATE",
  UserDelete = "USER_DELETE",
  UserLogin = "USER_LOGIN",
  UserLogout = "USER_LOGOUT",
  UserRegister = "USER_REGISTER",
  UserRoleChange = "USER_ROLE_CHANGE",
  UserUpdate = "USER_UPDATE",
}

export type AuditLog = {
  __typename?: "AuditLog";
  action: Scalars["String"]["output"];
  compliance_info?: Maybe<Scalars["String"]["output"]>;
  correlation_id?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  device_info?: Maybe<Scalars["String"]["output"]>;
  duration?: Maybe<Scalars["Float"]["output"]>;
  entity_id?: Maybe<Scalars["String"]["output"]>;
  entity_type: Scalars["String"]["output"];
  error_message?: Maybe<Scalars["String"]["output"]>;
  event_type?: Maybe<AuditEventType>;
  headers?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  ip_address?: Maybe<Scalars["String"]["output"]>;
  is_archived: Scalars["Boolean"]["output"];
  is_sensitive: Scalars["Boolean"]["output"];
  location?: Maybe<Scalars["String"]["output"]>;
  metadata?: Maybe<Scalars["String"]["output"]>;
  method?: Maybe<Scalars["String"]["output"]>;
  new_values?: Maybe<Scalars["String"]["output"]>;
  old_values?: Maybe<Scalars["String"]["output"]>;
  outcome?: Maybe<AuditOutcome>;
  path?: Maybe<Scalars["String"]["output"]>;
  request_body?: Maybe<Scalars["String"]["output"]>;
  request_id?: Maybe<Scalars["String"]["output"]>;
  response_body?: Maybe<Scalars["String"]["output"]>;
  service_name?: Maybe<Scalars["String"]["output"]>;
  session_id?: Maybe<Scalars["String"]["output"]>;
  severity?: Maybe<AuditSeverity>;
  signature?: Maybe<Scalars["String"]["output"]>;
  stack_trace?: Maybe<Scalars["String"]["output"]>;
  status_code?: Maybe<Scalars["Float"]["output"]>;
  tenant_id: Scalars["String"]["output"];
  timestamp?: Maybe<Scalars["DateTime"]["output"]>;
  user_agent?: Maybe<Scalars["String"]["output"]>;
  user_id?: Maybe<Scalars["String"]["output"]>;
  username?: Maybe<Scalars["String"]["output"]>;
};

export type AuditLogConnection = {
  __typename?: "AuditLogConnection";
  edges: Array<AuditLogEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type AuditLogEdge = {
  __typename?: "AuditLogEdge";
  cursor: Scalars["String"]["output"];
  node: AuditLog;
};

/** Outcome of the audited action */
export enum AuditOutcome {
  Failure = "FAILURE",
  Partial = "PARTIAL",
  Pending = "PENDING",
  Success = "SUCCESS",
}

/** Severity level of audit event */
export enum AuditSeverity {
  Critical = "CRITICAL",
  Error = "ERROR",
  High = "HIGH",
  Info = "INFO",
  Low = "LOW",
  Medium = "MEDIUM",
  Warning = "WARNING",
}

export type ChartOfAccount = {
  __typename?: "ChartOfAccount";
  accountCode: Scalars["String"]["output"];
  accountName: Scalars["String"]["output"];
  accountType: AccountType;
  balance: MoneyDto;
  children?: Maybe<Array<ChartOfAccount>>;
  createdAt: Scalars["DateTime"]["output"];
  currency: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  parentAccount?: Maybe<ChartOfAccount>;
  parentAccountId?: Maybe<Scalars["String"]["output"]>;
  tenantId: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

export type CompletePaymentInput = {
  transactionReference: Scalars["String"]["input"];
};

export type Configuration = {
  __typename?: "Configuration";
  category: Scalars["String"]["output"];
  created_at: Scalars["DateTime"]["output"];
  created_by?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  environment?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  is_active: Scalars["Boolean"]["output"];
  is_encrypted: Scalars["Boolean"]["output"];
  key: Scalars["String"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  tenant_id?: Maybe<Scalars["String"]["output"]>;
  type: Scalars["String"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  updated_by?: Maybe<Scalars["String"]["output"]>;
  validation_rules?: Maybe<Scalars["String"]["output"]>;
  value: Scalars["String"]["output"];
};

export type ConfigurationConnection = {
  __typename?: "ConfigurationConnection";
  edges: Array<ConfigurationEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type ConfigurationEdge = {
  __typename?: "ConfigurationEdge";
  cursor: Scalars["String"]["output"];
  node: Configuration;
};

export type CreateAccountInput = {
  accountCode: Scalars["String"]["input"];
  accountName: Scalars["String"]["input"];
  accountType: AccountType;
  currency: Scalars["String"]["input"];
  parentAccountId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateAuditLogInput = {
  action: Scalars["String"]["input"];
  correlation_id?: InputMaybe<Scalars["String"]["input"]>;
  duration?: InputMaybe<Scalars["Float"]["input"]>;
  entity_id?: InputMaybe<Scalars["String"]["input"]>;
  entity_type: Scalars["String"]["input"];
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  event_type?: InputMaybe<AuditEventType>;
  ip_address?: InputMaybe<Scalars["String"]["input"]>;
  is_sensitive: Scalars["Boolean"]["input"];
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  method?: InputMaybe<Scalars["String"]["input"]>;
  new_values?: InputMaybe<Scalars["String"]["input"]>;
  old_values?: InputMaybe<Scalars["String"]["input"]>;
  outcome?: InputMaybe<AuditOutcome>;
  path?: InputMaybe<Scalars["String"]["input"]>;
  request_id?: InputMaybe<Scalars["String"]["input"]>;
  service_name?: InputMaybe<Scalars["String"]["input"]>;
  session_id?: InputMaybe<Scalars["String"]["input"]>;
  severity?: InputMaybe<AuditSeverity>;
  status_code?: InputMaybe<Scalars["Float"]["input"]>;
  tenant_id: Scalars["String"]["input"];
  user_agent?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["String"]["input"]>;
  username?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateConfigurationInput = {
  category: Scalars["String"]["input"];
  created_by?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  environment?: InputMaybe<Scalars["String"]["input"]>;
  is_active?: InputMaybe<Scalars["Boolean"]["input"]>;
  is_encrypted?: InputMaybe<Scalars["Boolean"]["input"]>;
  key: Scalars["String"]["input"];
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id?: InputMaybe<Scalars["String"]["input"]>;
  type: Scalars["String"]["input"];
  validation_rules?: InputMaybe<Scalars["String"]["input"]>;
  value: Scalars["String"]["input"];
};

export type CreateCustomerInput = {
  address: AddressInput;
  code: Scalars["String"]["input"];
  creditLimit: Scalars["Float"]["input"];
  email: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  nameInBengali?: InputMaybe<Scalars["String"]["input"]>;
  nid?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms: PaymentTermsInput;
  phone: Scalars["String"]["input"];
  tin?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateExportJobInput = {
  batch_size?: InputMaybe<Scalars["Float"]["input"]>;
  compress?: InputMaybe<Scalars["Boolean"]["input"]>;
  compression_type?: InputMaybe<Scalars["String"]["input"]>;
  created_by?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  entity_type: Scalars["String"]["input"];
  export_config?: InputMaybe<Scalars["String"]["input"]>;
  format: ExportFormat;
  job_name: Scalars["String"]["input"];
  notification_config?: InputMaybe<Scalars["String"]["input"]>;
  query_params?: InputMaybe<Scalars["String"]["input"]>;
  schedule_config?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id: Scalars["String"]["input"];
};

export type CreateFeatureFlagInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  enabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  key: Scalars["String"]["input"];
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  rules?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateFileInput = {
  accessLevel?: FileAccessLevel;
  bucket: Scalars["String"]["input"];
  createdBy: Scalars["String"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  mimeType: Scalars["String"]["input"];
  originalName: Scalars["String"]["input"];
  parentFolderId?: InputMaybe<Scalars["String"]["input"]>;
  size: Scalars["Int"]["input"];
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tenantId: Scalars["String"]["input"];
};

export type CreateImportJobInput = {
  batch_size?: InputMaybe<Scalars["Float"]["input"]>;
  created_by?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  dry_run?: InputMaybe<Scalars["Boolean"]["input"]>;
  entity_type: Scalars["String"]["input"];
  file_path: Scalars["String"]["input"];
  file_size?: InputMaybe<Scalars["Float"]["input"]>;
  format: ImportFormat;
  job_name: Scalars["String"]["input"];
  mapping_config?: InputMaybe<Scalars["String"]["input"]>;
  mapping_id?: InputMaybe<Scalars["String"]["input"]>;
  options?: InputMaybe<Scalars["String"]["input"]>;
  original_filename?: InputMaybe<Scalars["String"]["input"]>;
  rollback_on_error?: InputMaybe<Scalars["Boolean"]["input"]>;
  tenant_id: Scalars["String"]["input"];
  validation_rules?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateInvoiceInput = {
  customerBIN?: InputMaybe<Scalars["String"]["input"]>;
  customerId: Scalars["String"]["input"];
  customerTIN?: InputMaybe<Scalars["String"]["input"]>;
  dueDate: Scalars["String"]["input"];
  invoiceDate: Scalars["String"]["input"];
  lineItems: Array<LineItemInput>;
  vendorBIN?: InputMaybe<Scalars["String"]["input"]>;
  vendorId: Scalars["String"]["input"];
  vendorTIN?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateJobInput = {
  createdBy: Scalars["String"]["input"];
  cronExpression?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  handlerName: Scalars["String"]["input"];
  jobData?: InputMaybe<Scalars["String"]["input"]>;
  jobType: JobType;
  name: Scalars["String"]["input"];
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  tenantId: Scalars["String"]["input"];
  timezone?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateJournalInput = {
  autoPost?: InputMaybe<Scalars["Boolean"]["input"]>;
  description: Scalars["String"]["input"];
  journalDate: Scalars["String"]["input"];
  journalType?: InputMaybe<JournalType>;
  lines: Array<JournalLineInput>;
  reference?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateNotificationInput = {
  batch_id?: InputMaybe<Scalars["String"]["input"]>;
  channel: NotificationChannel;
  content: Scalars["String"]["input"];
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Scalars["String"]["input"]>;
  recipient: Scalars["String"]["input"];
  scheduled_for?: InputMaybe<Scalars["DateTime"]["input"]>;
  subject: Scalars["String"]["input"];
  template_data?: InputMaybe<Scalars["String"]["input"]>;
  template_id?: InputMaybe<Scalars["String"]["input"]>;
  template_name?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id: Scalars["String"]["input"];
  type?: InputMaybe<Scalars["String"]["input"]>;
  variables?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateOrganizationInput = {
  bin?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  phone?: InputMaybe<Scalars["String"]["input"]>;
  slug: Scalars["String"]["input"];
  subscriptionPlan?: InputMaybe<Scalars["String"]["input"]>;
  tin?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreatePaymentInput = {
  amount: Scalars["Float"]["input"];
  bankAccountId?: InputMaybe<Scalars["String"]["input"]>;
  checkNumber?: InputMaybe<Scalars["String"]["input"]>;
  currency: Scalars["String"]["input"];
  invoiceId: Scalars["String"]["input"];
  merchantCode?: InputMaybe<Scalars["String"]["input"]>;
  mobileNumber?: InputMaybe<Scalars["String"]["input"]>;
  paymentDate: Scalars["String"]["input"];
  paymentMethod: PaymentMethod;
  reference?: InputMaybe<Scalars["String"]["input"]>;
  walletProvider?: InputMaybe<MobileWalletProvider>;
  walletTransactionId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateProductInput = {
  barcode?: InputMaybe<Scalars["String"]["input"]>;
  brand?: InputMaybe<Scalars["String"]["input"]>;
  category: Scalars["String"]["input"];
  costPrice: Scalars["Float"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  hsCode?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: Scalars["Boolean"]["input"];
  isInventoryItem?: Scalars["Boolean"]["input"];
  isServiceItem?: Scalars["Boolean"]["input"];
  isTaxable?: Scalars["Boolean"]["input"];
  manufacturer?: InputMaybe<Scalars["String"]["input"]>;
  maxStock?: Scalars["Float"]["input"];
  minStock?: Scalars["Float"]["input"];
  model?: InputMaybe<Scalars["String"]["input"]>;
  mrp?: InputMaybe<Scalars["Float"]["input"]>;
  name: Scalars["String"]["input"];
  nameBn?: InputMaybe<Scalars["String"]["input"]>;
  preferredVendorId?: InputMaybe<Scalars["String"]["input"]>;
  qrCode?: InputMaybe<Scalars["String"]["input"]>;
  reorderLevel?: Scalars["Float"]["input"];
  reorderQuantity?: Scalars["Float"]["input"];
  salePrice: Scalars["Float"]["input"];
  sku: Scalars["String"]["input"];
  subCategory?: InputMaybe<Scalars["String"]["input"]>;
  type?: Scalars["String"]["input"];
  unit: Scalars["String"]["input"];
  unitPrice: Scalars["Float"]["input"];
  uom: Scalars["String"]["input"];
  vatRate?: Scalars["Float"]["input"];
};

export type CreateRuleInput = {
  action?: InputMaybe<Scalars["String"]["input"]>;
  actions?: InputMaybe<Scalars["String"]["input"]>;
  category: Scalars["String"]["input"];
  conditions?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  entityType: Scalars["String"]["input"];
  errorMessage?: InputMaybe<Scalars["String"]["input"]>;
  expression: Scalars["String"]["input"];
  isActive?: Scalars["Boolean"]["input"];
  isSystemRule?: Scalars["Boolean"]["input"];
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  operator?: Scalars["String"]["input"];
  priority?: Scalars["Int"]["input"];
  requiresApproval?: Scalars["Boolean"]["input"];
  severity?: Scalars["String"]["input"];
  status?: Scalars["String"]["input"];
  successMessage?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateTaskInput = {
  allowComments?: Scalars["Boolean"]["input"];
  allowDelegation?: Scalars["Boolean"]["input"];
  assigneeId?: InputMaybe<Scalars["String"]["input"]>;
  assigneeRole?: InputMaybe<Scalars["String"]["input"]>;
  data?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  dueDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  parentTaskId?: InputMaybe<Scalars["String"]["input"]>;
  priority?: Scalars["String"]["input"];
  requiresApproval?: Scalars["Boolean"]["input"];
  status?: Scalars["String"]["input"];
  type: Scalars["String"]["input"];
  workflowId?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateVendorInput = {
  address: VendorAddressInput;
  bankAccountNo?: InputMaybe<Scalars["String"]["input"]>;
  bankBranch?: InputMaybe<Scalars["String"]["input"]>;
  bankName?: InputMaybe<Scalars["String"]["input"]>;
  bankRoutingNo?: InputMaybe<Scalars["String"]["input"]>;
  bin?: InputMaybe<Scalars["String"]["input"]>;
  code: Scalars["String"]["input"];
  contactPerson?: InputMaybe<Scalars["String"]["input"]>;
  contactPersonPhone?: InputMaybe<Scalars["String"]["input"]>;
  creditLimit?: Scalars["Float"]["input"];
  email?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: Scalars["Boolean"]["input"];
  mobile?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  nameBn?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms?: Scalars["Float"]["input"];
  phone?: InputMaybe<Scalars["String"]["input"]>;
  tin?: InputMaybe<Scalars["String"]["input"]>;
  type: Scalars["String"]["input"];
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateWorkflowInput = {
  autoStart?: Scalars["Boolean"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  dueDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  priority?: Scalars["String"]["input"];
  templateId: Scalars["String"]["input"];
  type: Scalars["String"]["input"];
  variables?: InputMaybe<Scalars["String"]["input"]>;
};

/** Customer entity for master data management */
export type Customer = {
  __typename?: "Customer";
  address: Scalars["String"]["output"];
  bank_details?: Maybe<Scalars["String"]["output"]>;
  billing_address?: Maybe<Scalars["String"]["output"]>;
  bin?: Maybe<Scalars["String"]["output"]>;
  code: Scalars["String"]["output"];
  contact_persons?: Maybe<Scalars["String"]["output"]>;
  credit_limit: Scalars["Float"]["output"];
  customer_group?: Maybe<Scalars["String"]["output"]>;
  customer_type: Scalars["String"]["output"];
  discount_group?: Maybe<Scalars["String"]["output"]>;
  email?: Maybe<Scalars["String"]["output"]>;
  first_transaction_date?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  kyc_documents?: Maybe<Scalars["String"]["output"]>;
  last_transaction_date?: Maybe<Scalars["DateTime"]["output"]>;
  loyalty_points: Scalars["Float"]["output"];
  name: Scalars["String"]["output"];
  name_bn?: Maybe<Scalars["String"]["output"]>;
  nid?: Maybe<Scalars["String"]["output"]>;
  outstanding_balance: Scalars["Float"]["output"];
  payment_terms: Scalars["String"]["output"];
  phone: Scalars["String"]["output"];
  phone_secondary?: Maybe<Scalars["String"]["output"]>;
  preferences?: Maybe<Scalars["String"]["output"]>;
  shipping_address?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  tags: Array<Scalars["String"]["output"]>;
  tin?: Maybe<Scalars["String"]["output"]>;
  total_revenue: Scalars["Float"]["output"];
  total_transactions: Scalars["Float"]["output"];
};

export type CustomerFilterInput = {
  code?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  tin?: InputMaybe<Scalars["String"]["input"]>;
};

export type Division = {
  __typename?: "Division";
  code?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  managerId?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  organization?: Maybe<Organization>;
  organizationId: Scalars["String"]["output"];
  settings: Scalars["String"]["output"];
  type?: Maybe<Scalars["String"]["output"]>;
  updatedAt: Scalars["DateTime"]["output"];
};

export type Document = {
  __typename?: "Document";
  created_at: Scalars["DateTime"]["output"];
  error_message?: Maybe<Scalars["String"]["output"]>;
  file_name: Scalars["String"]["output"];
  file_path?: Maybe<Scalars["String"]["output"]>;
  file_size?: Maybe<Scalars["Int"]["output"]>;
  generated_at?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  mime_type?: Maybe<Scalars["String"]["output"]>;
  status: DocumentStatus;
  template_id: Scalars["String"]["output"];
  tenant_id: Scalars["String"]["output"];
};

export type DocumentConnection = {
  __typename?: "DocumentConnection";
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  nodes: Array<Document>;
  totalCount: Scalars["Int"]["output"];
};

/** The status of a document */
export enum DocumentStatus {
  Completed = "COMPLETED",
  Failed = "FAILED",
  Generating = "GENERATING",
  Pending = "PENDING",
}

export type EvaluateRuleInput = {
  context: Scalars["String"]["input"];
  ruleId: Scalars["String"]["input"];
};

export enum ExportFormat {
  Csv = "CSV",
  Excel = "EXCEL",
  Json = "JSON",
  Pdf = "PDF",
  Tsv = "TSV",
  Xml = "XML",
}

export type ExportJob = {
  __typename?: "ExportJob";
  batch_size: Scalars["Float"]["output"];
  completed_at?: Maybe<Scalars["DateTime"]["output"]>;
  compress: Scalars["Boolean"]["output"];
  compression_type?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  created_by?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  entity_type: Scalars["String"]["output"];
  error_details?: Maybe<Scalars["String"]["output"]>;
  error_message?: Maybe<Scalars["String"]["output"]>;
  expires_at?: Maybe<Scalars["DateTime"]["output"]>;
  export_config?: Maybe<Scalars["String"]["output"]>;
  file_path?: Maybe<Scalars["String"]["output"]>;
  file_size: Scalars["Float"]["output"];
  file_url?: Maybe<Scalars["String"]["output"]>;
  format: ExportFormat;
  id: Scalars["ID"]["output"];
  job_name: Scalars["String"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  mime_type?: Maybe<Scalars["String"]["output"]>;
  notification_config?: Maybe<Scalars["String"]["output"]>;
  processed_records: Scalars["Float"]["output"];
  processing_time_ms?: Maybe<Scalars["Float"]["output"]>;
  query_params?: Maybe<Scalars["String"]["output"]>;
  schedule_config?: Maybe<Scalars["String"]["output"]>;
  started_at?: Maybe<Scalars["DateTime"]["output"]>;
  status: ExportStatus;
  tenant_id: Scalars["String"]["output"];
  total_records: Scalars["Float"]["output"];
  updated_at: Scalars["DateTime"]["output"];
};

export type ExportJobConnection = {
  __typename?: "ExportJobConnection";
  edges: Array<ExportJobEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type ExportJobEdge = {
  __typename?: "ExportJobEdge";
  cursor: Scalars["String"]["output"];
  node: ExportJob;
};

export enum ExportStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Pending = "PENDING",
  Processing = "PROCESSING",
  Querying = "QUERYING",
}

export type FailPaymentInput = {
  reason: Scalars["String"]["input"];
};

export type FeatureFlag = {
  __typename?: "FeatureFlag";
  created_at: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  enabled: Scalars["Boolean"]["output"];
  id: Scalars["ID"]["output"];
  key: Scalars["String"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  rules?: Maybe<Scalars["String"]["output"]>;
  tenant_id?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["DateTime"]["output"];
  user_id?: Maybe<Scalars["String"]["output"]>;
};

export type FeatureFlagConnection = {
  __typename?: "FeatureFlagConnection";
  edges: Array<FeatureFlagEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type FeatureFlagEdge = {
  __typename?: "FeatureFlagEdge";
  cursor: Scalars["String"]["output"];
  node: FeatureFlag;
};

export type File = {
  __typename?: "File";
  access_level: FileAccessLevel;
  bucket: Scalars["String"]["output"];
  checksum?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  encoding?: Maybe<Scalars["String"]["output"]>;
  file_path: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  mime_type?: Maybe<Scalars["String"]["output"]>;
  object_key: Scalars["String"]["output"];
  original_name: Scalars["String"]["output"];
  preview_url?: Maybe<Scalars["String"]["output"]>;
  size: Scalars["Float"]["output"];
  status: FileStatus;
  tenant_id: Scalars["String"]["output"];
  thumbnail_url?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["DateTime"]["output"];
  version: Scalars["Int"]["output"];
};

/** The access level of a file */
export enum FileAccessLevel {
  Private = "PRIVATE",
  Public = "PUBLIC",
  Restricted = "RESTRICTED",
  Tenant = "TENANT",
}

export type FileConnection = {
  __typename?: "FileConnection";
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  nodes: Array<File>;
  totalCount: Scalars["Int"]["output"];
};

/** The status of a file */
export enum FileStatus {
  Active = "ACTIVE",
  Archived = "ARCHIVED",
  Deleted = "DELETED",
  Failed = "FAILED",
  Quarantined = "QUARANTINED",
  Uploading = "UPLOADING",
}

export type GenerateDocumentInput = {
  data: Scalars["String"]["input"];
  fileName: Scalars["String"]["input"];
  format: Scalars["String"]["input"];
  options?: InputMaybe<Scalars["String"]["input"]>;
  templateId: Scalars["String"]["input"];
  tenantId: Scalars["String"]["input"];
};

export enum ImportFormat {
  Csv = "CSV",
  Excel = "EXCEL",
  Json = "JSON",
  Tsv = "TSV",
  Xml = "XML",
}

export type ImportJob = {
  __typename?: "ImportJob";
  batch_size: Scalars["Float"]["output"];
  completed_at?: Maybe<Scalars["DateTime"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  created_by?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  dry_run: Scalars["Boolean"]["output"];
  entity_type: Scalars["String"]["output"];
  error_details?: Maybe<Scalars["String"]["output"]>;
  error_file_path?: Maybe<Scalars["String"]["output"]>;
  failed_rows: Scalars["Float"]["output"];
  file_path: Scalars["String"]["output"];
  file_size: Scalars["Float"]["output"];
  format: ImportFormat;
  id: Scalars["ID"]["output"];
  job_name: Scalars["String"]["output"];
  mapping_config?: Maybe<Scalars["String"]["output"]>;
  mapping_id?: Maybe<Scalars["String"]["output"]>;
  metadata?: Maybe<Scalars["String"]["output"]>;
  options?: Maybe<Scalars["String"]["output"]>;
  original_filename?: Maybe<Scalars["String"]["output"]>;
  processed_rows: Scalars["Float"]["output"];
  processing_time_ms?: Maybe<Scalars["Float"]["output"]>;
  rollback_on_error: Scalars["Boolean"]["output"];
  skipped_rows: Scalars["Float"]["output"];
  started_at?: Maybe<Scalars["DateTime"]["output"]>;
  status: ImportStatus;
  successful_rows: Scalars["Float"]["output"];
  summary?: Maybe<Scalars["String"]["output"]>;
  tenant_id: Scalars["String"]["output"];
  total_rows: Scalars["Float"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  validation_rules?: Maybe<Scalars["String"]["output"]>;
};

export type ImportJobConnection = {
  __typename?: "ImportJobConnection";
  edges: Array<ImportJobEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type ImportJobEdge = {
  __typename?: "ImportJobEdge";
  cursor: Scalars["String"]["output"];
  node: ImportJob;
};

export enum ImportStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Partial = "PARTIAL",
  Pending = "PENDING",
  Processing = "PROCESSING",
  Validating = "VALIDATING",
}

export type Invoice = {
  __typename?: "Invoice";
  advanceIncomeTax: MoneyDto;
  challanNumber?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  customerBIN?: Maybe<Scalars["String"]["output"]>;
  customerId: Scalars["String"]["output"];
  customerTIN?: Maybe<Scalars["String"]["output"]>;
  dueDate: Scalars["DateTime"]["output"];
  fiscalYear: Scalars["String"]["output"];
  grandTotal: MoneyDto;
  id: Scalars["ID"]["output"];
  invoiceDate: Scalars["DateTime"]["output"];
  invoiceNumber: Scalars["String"]["output"];
  lineItems: Array<LineItem>;
  mushakNumber?: Maybe<Scalars["String"]["output"]>;
  status: InvoiceStatus;
  subtotal: MoneyDto;
  supplementaryDuty: MoneyDto;
  updatedAt: Scalars["DateTime"]["output"];
  vatAmount: MoneyDto;
  vendorBIN?: Maybe<Scalars["String"]["output"]>;
  vendorId: Scalars["String"]["output"];
  vendorTIN?: Maybe<Scalars["String"]["output"]>;
};

/** Invoice lifecycle status */
export enum InvoiceStatus {
  Approved = "APPROVED",
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Overdue = "OVERDUE",
  Paid = "PAID",
  PartiallyPaid = "PARTIALLY_PAID",
  PendingApproval = "PENDING_APPROVAL",
}

export type JobSchedule = {
  __typename?: "JobSchedule";
  created_at: Scalars["DateTime"]["output"];
  cron_expression?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  end_date?: Maybe<Scalars["DateTime"]["output"]>;
  execution_count: Scalars["Int"]["output"];
  failure_count: Scalars["Int"]["output"];
  handler_name: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  job_type: JobType;
  last_run_at?: Maybe<Scalars["DateTime"]["output"]>;
  name: Scalars["String"]["output"];
  next_run_at?: Maybe<Scalars["DateTime"]["output"]>;
  start_date?: Maybe<Scalars["DateTime"]["output"]>;
  status: JobStatus;
  tenant_id: Scalars["String"]["output"];
  timezone?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["DateTime"]["output"];
};

export type JobScheduleConnection = {
  __typename?: "JobScheduleConnection";
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  nodes: Array<JobSchedule>;
  totalCount: Scalars["Int"]["output"];
};

/** The status of a scheduled job */
export enum JobStatus {
  Active = "ACTIVE",
  Completed = "COMPLETED",
  Disabled = "DISABLED",
  Paused = "PAUSED",
}

/** The type of scheduled job */
export enum JobType {
  Cron = "CRON",
  Interval = "INTERVAL",
  OneTime = "ONE_TIME",
}

export type JournalEntry = {
  __typename?: "JournalEntry";
  createdAt: Scalars["DateTime"]["output"];
  currency: Scalars["String"]["output"];
  description: Scalars["String"]["output"];
  fiscalPeriod: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  isReversing: Scalars["Boolean"]["output"];
  journalDate: Scalars["DateTime"]["output"];
  journalNumber: Scalars["String"]["output"];
  journalType: JournalType;
  lines: Array<JournalLine>;
  originalJournalId?: Maybe<Scalars["ID"]["output"]>;
  postedAt?: Maybe<Scalars["DateTime"]["output"]>;
  postedBy?: Maybe<Scalars["ID"]["output"]>;
  reference?: Maybe<Scalars["String"]["output"]>;
  status: JournalStatus;
  totalCredit: Scalars["Float"]["output"];
  totalDebit: Scalars["Float"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

export type JournalLine = {
  __typename?: "JournalLine";
  accountId: Scalars["ID"]["output"];
  costCenter?: Maybe<Scalars["String"]["output"]>;
  creditAmount: Scalars["Float"]["output"];
  debitAmount: Scalars["Float"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  lineId: Scalars["ID"]["output"];
  project?: Maybe<Scalars["String"]["output"]>;
  reference?: Maybe<Scalars["String"]["output"]>;
  taxCode?: Maybe<Scalars["String"]["output"]>;
};

export type JournalLineInput = {
  accountId: Scalars["ID"]["input"];
  costCenter?: InputMaybe<Scalars["String"]["input"]>;
  creditAmount?: InputMaybe<Scalars["Float"]["input"]>;
  debitAmount?: InputMaybe<Scalars["Float"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  project?: InputMaybe<Scalars["String"]["input"]>;
  reference?: InputMaybe<Scalars["String"]["input"]>;
  taxCode?: InputMaybe<Scalars["String"]["input"]>;
};

/** Journal entry lifecycle status */
export enum JournalStatus {
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Error = "ERROR",
  Posted = "POSTED",
  Reversed = "REVERSED",
}

/** Journal entry types for accounting */
export enum JournalType {
  Adjustment = "ADJUSTMENT",
  CashPayment = "CASH_PAYMENT",
  CashReceipt = "CASH_RECEIPT",
  Closing = "CLOSING",
  General = "GENERAL",
  Opening = "OPENING",
  Purchase = "PURCHASE",
  Reversing = "REVERSING",
  Sales = "SALES",
}

export type LineItem = {
  __typename?: "LineItem";
  advanceIncomeTax?: Maybe<MoneyDto>;
  amount: MoneyDto;
  description: Scalars["String"]["output"];
  hsCode?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  quantity: Scalars["Float"]["output"];
  supplementaryDuty?: Maybe<MoneyDto>;
  unitPrice: MoneyDto;
  vatAmount: MoneyDto;
  vatCategory: VatCategory;
  vatRate: Scalars["Float"]["output"];
};

export type LineItemInput = {
  advanceIncomeTaxRate?: InputMaybe<Scalars["Float"]["input"]>;
  currency: Scalars["String"]["input"];
  description: Scalars["String"]["input"];
  hsCode?: InputMaybe<Scalars["String"]["input"]>;
  quantity: Scalars["Float"]["input"];
  supplementaryDutyRate?: InputMaybe<Scalars["Float"]["input"]>;
  unitPrice: Scalars["Float"]["input"];
  vatCategory?: InputMaybe<VatCategory>;
};

export type LoginInput = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type LoginResponse = {
  __typename?: "LoginResponse";
  accessToken: Scalars["String"]["output"];
  expiresIn: Scalars["Float"]["output"];
  refreshToken: Scalars["String"]["output"];
  user: UserResponse;
};

export type MobileWallet = {
  __typename?: "MobileWallet";
  merchantCode?: Maybe<Scalars["String"]["output"]>;
  mobileNumber: Scalars["String"]["output"];
  provider: MobileWalletProvider;
  transactionId: Scalars["String"]["output"];
};

/** Bangladesh mobile wallet providers */
export enum MobileWalletProvider {
  Bkash = "BKASH",
  Mcash = "MCASH",
  Nagad = "NAGAD",
  Rocket = "ROCKET",
  Surecash = "SURECASH",
  Tcash = "TCASH",
  Upay = "UPAY",
}

export type MoneyDto = {
  __typename?: "MoneyDto";
  amount: Scalars["Float"]["output"];
  currency: Scalars["String"]["output"];
  formattedAmount: Scalars["String"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  activateRule: RuleResponse;
  addJournalLine: JournalEntry;
  approveInvoice: Invoice;
  approveTask: TaskResponse;
  archiveAuditLogs: Scalars["Boolean"]["output"];
  archiveFile: File;
  assignTask: TaskResponse;
  bulkUpdateConfigurations: Array<Configuration>;
  cancelExportJob: ExportJob;
  cancelImportJob: ImportJob;
  cancelInvoice: Invoice;
  cancelScheduledNotification: Scalars["Boolean"]["output"];
  cancelTask: TaskResponse;
  cancelWorkflow: WorkflowResponse;
  cleanupExpiredFiles: Scalars["Boolean"]["output"];
  cleanupOldDocuments: Scalars["Boolean"]["output"];
  cleanupOldExecutions: Scalars["Int"]["output"];
  completePayment: Payment;
  completeTask: TaskResponse;
  createAccount: ChartOfAccount;
  createAuditLog: AuditLog;
  createConfiguration: Configuration;
  createCustomer: Customer;
  createExportJob: ExportJob;
  createFeatureFlag: FeatureFlag;
  createImportJob: ImportJob;
  createInvoice: Invoice;
  createJob: JobSchedule;
  createJournal: JournalEntry;
  createOrganization: Organization;
  createPayment: Payment;
  createProduct: Product;
  createRule: RuleResponse;
  createTask: TaskResponse;
  createVendor: Vendor;
  createWorkflow: WorkflowResponse;
  deactivateAccount: ChartOfAccount;
  deactivateRule: RuleResponse;
  deleteArchivedLogs: Scalars["Boolean"]["output"];
  deleteConfiguration: Scalars["Boolean"]["output"];
  deleteCustomer: Scalars["Boolean"]["output"];
  deleteDocument: Scalars["Boolean"]["output"];
  deleteExportJob: Scalars["Boolean"]["output"];
  deleteFeatureFlag: Scalars["Boolean"]["output"];
  deleteFile: Scalars["Boolean"]["output"];
  deleteImportJob: Scalars["Boolean"]["output"];
  deleteJob: Scalars["Boolean"]["output"];
  deleteOrganization: Scalars["Boolean"]["output"];
  deleteProduct: Scalars["Boolean"]["output"];
  deleteRule: Scalars["Boolean"]["output"];
  deleteTask: Scalars["Boolean"]["output"];
  deleteVendor: Scalars["Boolean"]["output"];
  deleteWorkflow: Scalars["Boolean"]["output"];
  disableJob: JobSchedule;
  downloadExportFile: Scalars["String"]["output"];
  evaluateRule: RuleEvaluationResponse;
  evaluateRuleSet: RuleEvaluationResponse;
  executeJobNow: JobSchedule;
  failPayment: Payment;
  generateDocument: Document;
  generateExcel: Document;
  generatePdf: Document;
  generateThumbnail: Scalars["String"]["output"];
  generateWord: Document;
  login: LoginResponse;
  logout: Scalars["Boolean"]["output"];
  markAsRead: Scalars["Boolean"]["output"];
  moveFile: File;
  pauseJob: JobSchedule;
  postJournal: JournalEntry;
  reconcilePayment: Payment;
  refreshToken: RefreshTokenResponse;
  regenerateDocument: Document;
  register: RegisterResponse;
  rejectTask: TaskResponse;
  restoreFile: File;
  resumeJob: JobSchedule;
  retryExportJob: ExportJob;
  retryFailedNotification: Scalars["Boolean"]["output"];
  retryImportJob: ImportJob;
  retryWorkflow: WorkflowResponse;
  reverseJournal: JournalEntry;
  reversePayment: Payment;
  scanFile: File;
  scheduleNotification: Notification;
  sendBulkNotifications: Array<Notification>;
  sendNotification: Notification;
  shareFile: File;
  startExportJob: ExportJob;
  startImportJob: ImportJob;
  startWorkflow: WorkflowResponse;
  toggleFeatureFlag: FeatureFlag;
  updateConfiguration: Configuration;
  updateCustomer: Customer;
  updateExportJob: ExportJob;
  updateFeatureFlag: FeatureFlag;
  updateFile: File;
  updateImportJob: ImportJob;
  updateJob: JobSchedule;
  updateNotificationStatus: Notification;
  updateOrganization: Organization;
  updateProduct: Product;
  updateProductInventory: Product;
  updateRule: RuleResponse;
  updateTask: TaskResponse;
  updateVendor: Vendor;
  updateWorkflow: WorkflowResponse;
  uploadFile: File;
  validateImportFile: Scalars["String"]["output"];
};

export type MutationActivateRuleArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationAddJournalLineArgs = {
  input: AddJournalLineInput;
  journalId: Scalars["ID"]["input"];
};

export type MutationApproveInvoiceArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationApproveTaskArgs = {
  comments?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["ID"]["input"];
};

export type MutationArchiveAuditLogsArgs = {
  beforeDate: Scalars["DateTime"]["input"];
  tenantId: Scalars["String"]["input"];
};

export type MutationArchiveFileArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationAssignTaskArgs = {
  assigneeId: Scalars["String"]["input"];
  id: Scalars["ID"]["input"];
};

export type MutationBulkUpdateConfigurationsArgs = {
  configurations: Array<UpdateConfigurationInput>;
};

export type MutationCancelExportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationCancelImportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationCancelInvoiceArgs = {
  id: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationCancelScheduledNotificationArgs = {
  id: Scalars["String"]["input"];
};

export type MutationCancelTaskArgs = {
  id: Scalars["ID"]["input"];
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationCancelWorkflowArgs = {
  id: Scalars["ID"]["input"];
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationCleanupOldDocumentsArgs = {
  daysOld?: Scalars["Int"]["input"];
};

export type MutationCleanupOldExecutionsArgs = {
  daysOld?: Scalars["Int"]["input"];
};

export type MutationCompletePaymentArgs = {
  id: Scalars["ID"]["input"];
  input: CompletePaymentInput;
};

export type MutationCompleteTaskArgs = {
  id: Scalars["ID"]["input"];
  result?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};

export type MutationCreateAuditLogArgs = {
  input: CreateAuditLogInput;
};

export type MutationCreateConfigurationArgs = {
  input: CreateConfigurationInput;
};

export type MutationCreateCustomerArgs = {
  input: CreateCustomerInput;
};

export type MutationCreateExportJobArgs = {
  input: CreateExportJobInput;
};

export type MutationCreateFeatureFlagArgs = {
  input: CreateFeatureFlagInput;
};

export type MutationCreateImportJobArgs = {
  input: CreateImportJobInput;
};

export type MutationCreateInvoiceArgs = {
  input: CreateInvoiceInput;
};

export type MutationCreateJobArgs = {
  input: CreateJobInput;
};

export type MutationCreateJournalArgs = {
  input: CreateJournalInput;
};

export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};

export type MutationCreatePaymentArgs = {
  input: CreatePaymentInput;
};

export type MutationCreateProductArgs = {
  input: CreateProductInput;
};

export type MutationCreateRuleArgs = {
  input: CreateRuleInput;
};

export type MutationCreateTaskArgs = {
  input: CreateTaskInput;
};

export type MutationCreateVendorArgs = {
  input: CreateVendorInput;
};

export type MutationCreateWorkflowArgs = {
  input: CreateWorkflowInput;
};

export type MutationDeactivateAccountArgs = {
  id: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationDeactivateRuleArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteArchivedLogsArgs = {
  beforeDate: Scalars["DateTime"]["input"];
  tenantId: Scalars["String"]["input"];
};

export type MutationDeleteConfigurationArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteCustomerArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteDocumentArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteExportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteFeatureFlagArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteFileArgs = {
  id: Scalars["ID"]["input"];
  permanent?: Scalars["Boolean"]["input"];
};

export type MutationDeleteImportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationDeleteJobArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteOrganizationArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteProductArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteRuleArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteTaskArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteVendorArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteWorkflowArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDisableJobArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDownloadExportFileArgs = {
  id: Scalars["String"]["input"];
};

export type MutationEvaluateRuleArgs = {
  input: EvaluateRuleInput;
};

export type MutationEvaluateRuleSetArgs = {
  category: Scalars["String"]["input"];
  context: Scalars["String"]["input"];
};

export type MutationExecuteJobNowArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationFailPaymentArgs = {
  id: Scalars["ID"]["input"];
  input: FailPaymentInput;
};

export type MutationGenerateDocumentArgs = {
  input: GenerateDocumentInput;
};

export type MutationGenerateExcelArgs = {
  data: Scalars["String"]["input"];
  templateId: Scalars["ID"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type MutationGeneratePdfArgs = {
  data: Scalars["String"]["input"];
  templateId: Scalars["ID"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type MutationGenerateThumbnailArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationGenerateWordArgs = {
  data: Scalars["String"]["input"];
  templateId: Scalars["ID"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationMarkAsReadArgs = {
  id: Scalars["String"]["input"];
};

export type MutationMoveFileArgs = {
  id: Scalars["ID"]["input"];
  targetFolderId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type MutationPauseJobArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationPostJournalArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationReconcilePaymentArgs = {
  id: Scalars["ID"]["input"];
  input: ReconcilePaymentInput;
};

export type MutationRefreshTokenArgs = {
  input: RefreshTokenInput;
};

export type MutationRegenerateDocumentArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationRejectTaskArgs = {
  id: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationRestoreFileArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationResumeJobArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationRetryExportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationRetryFailedNotificationArgs = {
  id: Scalars["String"]["input"];
};

export type MutationRetryImportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationRetryWorkflowArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationReverseJournalArgs = {
  id: Scalars["ID"]["input"];
  reversingDate: Scalars["String"]["input"];
};

export type MutationReversePaymentArgs = {
  id: Scalars["ID"]["input"];
  input: ReversePaymentInput;
};

export type MutationScanFileArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationScheduleNotificationArgs = {
  input: CreateNotificationInput;
  scheduledFor: Scalars["DateTime"]["input"];
};

export type MutationSendBulkNotificationsArgs = {
  inputs: Array<CreateNotificationInput>;
};

export type MutationSendNotificationArgs = {
  input: CreateNotificationInput;
};

export type MutationShareFileArgs = {
  id: Scalars["ID"]["input"];
  input: ShareFileInput;
};

export type MutationStartExportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationStartImportJobArgs = {
  id: Scalars["String"]["input"];
};

export type MutationStartWorkflowArgs = {
  id: Scalars["ID"]["input"];
  variables?: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationToggleFeatureFlagArgs = {
  enabled: Scalars["Boolean"]["input"];
  id: Scalars["String"]["input"];
};

export type MutationUpdateConfigurationArgs = {
  id: Scalars["String"]["input"];
  input: UpdateConfigurationInput;
};

export type MutationUpdateCustomerArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateCustomerInput;
};

export type MutationUpdateExportJobArgs = {
  id: Scalars["String"]["input"];
  input: UpdateExportJobInput;
};

export type MutationUpdateFeatureFlagArgs = {
  id: Scalars["String"]["input"];
  input: UpdateFeatureFlagInput;
};

export type MutationUpdateFileArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateFileInput;
};

export type MutationUpdateImportJobArgs = {
  id: Scalars["String"]["input"];
  input: UpdateImportJobInput;
};

export type MutationUpdateJobArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateJobInput;
};

export type MutationUpdateNotificationStatusArgs = {
  input: UpdateNotificationStatusInput;
};

export type MutationUpdateOrganizationArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateOrganizationInput;
};

export type MutationUpdateProductArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateProductInput;
};

export type MutationUpdateProductInventoryArgs = {
  id: Scalars["ID"]["input"];
  operation: Scalars["String"]["input"];
  quantity: Scalars["Float"]["input"];
};

export type MutationUpdateRuleArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateRuleInput;
};

export type MutationUpdateTaskArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateTaskInput;
};

export type MutationUpdateVendorArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateVendorInput;
};

export type MutationUpdateWorkflowArgs = {
  id: Scalars["ID"]["input"];
  input: UpdateWorkflowInput;
};

export type MutationUploadFileArgs = {
  input: CreateFileInput;
};

export type MutationValidateImportFileArgs = {
  entityType: Scalars["String"]["input"];
  filePath: Scalars["String"]["input"];
  format: Scalars["String"]["input"];
};

export type Notification = {
  __typename?: "Notification";
  batch_id?: Maybe<Scalars["String"]["output"]>;
  channel: NotificationChannel;
  content: Scalars["String"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  error_message?: Maybe<Scalars["String"]["output"]>;
  failed_at?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  max_retries: Scalars["Float"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  priority: Scalars["String"]["output"];
  recipient: Scalars["String"]["output"];
  retry_count: Scalars["Float"]["output"];
  scheduled_for?: Maybe<Scalars["DateTime"]["output"]>;
  sent_at?: Maybe<Scalars["DateTime"]["output"]>;
  status: NotificationStatus;
  subject: Scalars["String"]["output"];
  template_data?: Maybe<Scalars["String"]["output"]>;
  template_id?: Maybe<Scalars["String"]["output"]>;
  template_name?: Maybe<Scalars["String"]["output"]>;
  tenant_id: Scalars["String"]["output"];
  type?: Maybe<Scalars["String"]["output"]>;
  variables?: Maybe<Scalars["String"]["output"]>;
};

/** Notification delivery channel */
export enum NotificationChannel {
  Email = "EMAIL",
  InApp = "IN_APP",
  Push = "PUSH",
  Sms = "SMS",
}

export type NotificationConnection = {
  __typename?: "NotificationConnection";
  edges: Array<NotificationEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars["Float"]["output"];
};

export type NotificationEdge = {
  __typename?: "NotificationEdge";
  cursor: Scalars["String"]["output"];
  node: Notification;
};

/** Status of notification delivery */
export enum NotificationStatus {
  Delivered = "DELIVERED",
  Failed = "FAILED",
  Pending = "PENDING",
  Read = "READ",
  Sent = "SENT",
}

export type Organization = {
  __typename?: "Organization";
  createdAt: Scalars["DateTime"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  divisions?: Maybe<Array<Division>>;
  email?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  logoUrl?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  phone?: Maybe<Scalars["String"]["output"]>;
  settings?: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
  subscriptionPlan: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
};

export type OrganizationFilterInput = {
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  subscriptionPlan?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type PageInfo = {
  __typename?: "PageInfo";
  endCursor?: Maybe<Scalars["String"]["output"]>;
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  startCursor?: Maybe<Scalars["String"]["output"]>;
};

export type PaginatedCustomerResponse = {
  __typename?: "PaginatedCustomerResponse";
  data: Array<Customer>;
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type PaginatedProductResponse = {
  __typename?: "PaginatedProductResponse";
  items: Array<Product>;
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type PaginatedRuleResponse = {
  __typename?: "PaginatedRuleResponse";
  items: Array<RuleResponse>;
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type PaginatedTaskResponse = {
  __typename?: "PaginatedTaskResponse";
  items: Array<TaskResponse>;
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type PaginatedVendorResponse = {
  __typename?: "PaginatedVendorResponse";
  items: Array<Vendor>;
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type PaginatedWorkflowResponse = {
  __typename?: "PaginatedWorkflowResponse";
  items: Array<WorkflowResponse>;
  limit: Scalars["Int"]["output"];
  page: Scalars["Int"]["output"];
  total: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

export type Payment = {
  __typename?: "Payment";
  amount: MoneyDto;
  bankAccountId?: Maybe<Scalars["ID"]["output"]>;
  bankTransactionId?: Maybe<Scalars["String"]["output"]>;
  checkNumber?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  failureReason?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  invoiceId: Scalars["ID"]["output"];
  mobileWallet?: Maybe<MobileWallet>;
  paymentDate: Scalars["DateTime"]["output"];
  paymentMethod: PaymentMethod;
  paymentNumber: Scalars["String"]["output"];
  reconciledAt?: Maybe<Scalars["DateTime"]["output"]>;
  reconciledBy?: Maybe<Scalars["ID"]["output"]>;
  reference?: Maybe<Scalars["String"]["output"]>;
  reversalReason?: Maybe<Scalars["String"]["output"]>;
  reversedAt?: Maybe<Scalars["DateTime"]["output"]>;
  reversedBy?: Maybe<Scalars["ID"]["output"]>;
  status: PaymentStatus;
  transactionReference?: Maybe<Scalars["String"]["output"]>;
  updatedAt: Scalars["DateTime"]["output"];
};

/** Supported payment methods */
export enum PaymentMethod {
  BankTransfer = "BANK_TRANSFER",
  Cash = "CASH",
  Check = "CHECK",
  CreditCard = "CREDIT_CARD",
  DebitCard = "DEBIT_CARD",
  MobileWallet = "MOBILE_WALLET",
  OnlineBanking = "ONLINE_BANKING",
}

/** Payment processing status */
export enum PaymentStatus {
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Pending = "PENDING",
  Processing = "PROCESSING",
  Reconciled = "RECONCILED",
  Reversed = "REVERSED",
}

export type PaymentTermsInput = {
  days: Scalars["Float"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
};

export type Product = {
  __typename?: "Product";
  ait_rate: Scalars["Float"]["output"];
  barcode?: Maybe<Scalars["String"]["output"]>;
  brand?: Maybe<Scalars["String"]["output"]>;
  category: Scalars["String"]["output"];
  customs_duty_rate: Scalars["Float"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  description_bn?: Maybe<Scalars["String"]["output"]>;
  hs_code?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  model?: Maybe<Scalars["String"]["output"]>;
  mrp?: Maybe<Scalars["Float"]["output"]>;
  name: Scalars["String"]["output"];
  name_bn?: Maybe<Scalars["String"]["output"]>;
  product_type: Scalars["String"]["output"];
  secondary_unit?: Maybe<Scalars["String"]["output"]>;
  selling_price: Scalars["Float"]["output"];
  sku: Scalars["String"]["output"];
  sub_category?: Maybe<Scalars["String"]["output"]>;
  unit: Scalars["String"]["output"];
  unit_conversion_factor?: Maybe<Scalars["Float"]["output"]>;
  unit_cost: Scalars["Float"]["output"];
  vat_exempt: Scalars["Boolean"]["output"];
  vat_exemption_reason?: Maybe<Scalars["String"]["output"]>;
  vat_rate: Scalars["Float"]["output"];
};

export type ProductFilterInput = {
  brand?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isInventoryItem?: InputMaybe<Scalars["Boolean"]["input"]>;
  isServiceItem?: InputMaybe<Scalars["Boolean"]["input"]>;
  maxPrice?: InputMaybe<Scalars["Float"]["input"]>;
  minPrice?: InputMaybe<Scalars["Float"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  subCategory?: InputMaybe<Scalars["String"]["input"]>;
};

export type Query = {
  __typename?: "Query";
  accountByCode?: Maybe<ChartOfAccount>;
  activeJobs: Array<JobSchedule>;
  applicableRules: Array<RuleResponse>;
  auditLog?: Maybe<AuditLog>;
  auditLogs: Array<AuditLog>;
  auditLogsPaginated: AuditLogConnection;
  calculateProductVat: Scalars["Float"]["output"];
  chartOfAccount?: Maybe<ChartOfAccount>;
  chartOfAccounts: Array<ChartOfAccount>;
  configuration?: Maybe<Configuration>;
  configurationByKey?: Maybe<Configuration>;
  configurationsByCategory: Array<Configuration>;
  configurationsByTenant: Array<Configuration>;
  configurationsConnection: ConfigurationConnection;
  customer: Customer;
  customerByCode?: Maybe<Customer>;
  customerByTin?: Maybe<Customer>;
  customers: PaginatedCustomerResponse;
  document?: Maybe<Document>;
  documentDownloadUrl?: Maybe<Scalars["String"]["output"]>;
  documentsByTemplate: Array<Document>;
  documentsByTenant: Array<Document>;
  documentsPaginated: DocumentConnection;
  exportJob?: Maybe<ExportJob>;
  exportJobsByStatus: Array<ExportJob>;
  exportJobsByTenant: Array<ExportJob>;
  exportJobsConnection: ExportJobConnection;
  featureFlag?: Maybe<FeatureFlag>;
  featureFlagByKey?: Maybe<FeatureFlag>;
  featureFlagsByTenant: Array<FeatureFlag>;
  featureFlagsConnection: FeatureFlagConnection;
  file?: Maybe<File>;
  fileDownloadUrl: Scalars["String"]["output"];
  filesByFolder: Array<File>;
  filesByTenant: Array<File>;
  filesPaginated: FileConnection;
  importJob?: Maybe<ImportJob>;
  importJobsByStatus: Array<ImportJob>;
  importJobsByTenant: Array<ImportJob>;
  importJobsConnection: ImportJobConnection;
  invoice?: Maybe<Invoice>;
  invoices: Array<Invoice>;
  isFeatureEnabled: Scalars["Boolean"]["output"];
  jobSchedule?: Maybe<JobSchedule>;
  jobSchedulesByTenant: Array<JobSchedule>;
  jobsPaginated: JobScheduleConnection;
  journal?: Maybe<JournalEntry>;
  journals: Array<JournalEntry>;
  journalsByPeriod: Array<JournalEntry>;
  me?: Maybe<User>;
  myTasks: Array<TaskResponse>;
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  notificationsPaginated: NotificationConnection;
  organization: Organization;
  organizationBySlug: Organization;
  organizations: Array<Organization>;
  payment?: Maybe<Payment>;
  payments: Array<Payment>;
  paymentsByInvoice: Array<Payment>;
  paymentsByStatus: Array<Payment>;
  pendingNotifications: Array<Notification>;
  product: Product;
  productBySku?: Maybe<Product>;
  products: PaginatedProductResponse;
  productsByCategory: Array<Product>;
  rule: RuleResponse;
  rules: PaginatedRuleResponse;
  rulesByCategory: Array<RuleResponse>;
  rulesByEntity: Array<RuleResponse>;
  searchAuditLogs: Array<AuditLog>;
  searchDocuments: DocumentConnection;
  searchFiles: FileConnection;
  searchJobs: JobScheduleConnection;
  task: TaskResponse;
  tasks: PaginatedTaskResponse;
  tasksByWorkflow: Array<TaskResponse>;
  unpostedJournals: Array<JournalEntry>;
  upcomingJobs: Array<JobSchedule>;
  user?: Maybe<User>;
  userByEmail?: Maybe<User>;
  users: Array<User>;
  validateNid: Scalars["Boolean"]["output"];
  validateRuleExpression: Scalars["Boolean"]["output"];
  validateTin: Scalars["Boolean"]["output"];
  validateToken: Scalars["Boolean"]["output"];
  validateVendorTin: Scalars["Boolean"]["output"];
  vendor: Vendor;
  vendorByCode?: Maybe<Vendor>;
  vendorByTin?: Maybe<Vendor>;
  vendors: PaginatedVendorResponse;
  workflow: WorkflowResponse;
  workflowHistory: Array<WorkflowResponse>;
  workflows: PaginatedWorkflowResponse;
  workflowsByStatus: Array<WorkflowResponse>;
};

export type QueryAccountByCodeArgs = {
  accountCode: Scalars["String"]["input"];
};

export type QueryActiveJobsArgs = {
  tenantId: Scalars["ID"]["input"];
};

export type QueryApplicableRulesArgs = {
  action: Scalars["String"]["input"];
  entityType: Scalars["String"]["input"];
};

export type QueryAuditLogArgs = {
  id: Scalars["String"]["input"];
};

export type QueryAuditLogsArgs = {
  limit?: Scalars["Float"]["input"];
  offset?: Scalars["Float"]["input"];
  tenantId: Scalars["String"]["input"];
};

export type QueryAuditLogsPaginatedArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  last?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId: Scalars["String"]["input"];
};

export type QueryCalculateProductVatArgs = {
  price: Scalars["Float"]["input"];
  vatRate?: InputMaybe<Scalars["Float"]["input"]>;
};

export type QueryChartOfAccountArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryChartOfAccountsArgs = {
  accountType?: InputMaybe<AccountType>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryConfigurationArgs = {
  id: Scalars["String"]["input"];
};

export type QueryConfigurationByKeyArgs = {
  key: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryConfigurationsByCategoryArgs = {
  category: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryConfigurationsByTenantArgs = {
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryConfigurationsConnectionArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryCustomerArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryCustomerByCodeArgs = {
  code: Scalars["String"]["input"];
};

export type QueryCustomerByTinArgs = {
  tin: Scalars["String"]["input"];
};

export type QueryCustomersArgs = {
  filter?: InputMaybe<CustomerFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryDocumentArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryDocumentDownloadUrlArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryDocumentsByTemplateArgs = {
  templateId: Scalars["ID"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type QueryDocumentsByTenantArgs = {
  tenantId: Scalars["ID"]["input"];
};

export type QueryDocumentsPaginatedArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type QueryExportJobArgs = {
  id: Scalars["String"]["input"];
};

export type QueryExportJobsByStatusArgs = {
  status: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryExportJobsByTenantArgs = {
  tenantId: Scalars["String"]["input"];
};

export type QueryExportJobsConnectionArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryFeatureFlagArgs = {
  id: Scalars["String"]["input"];
};

export type QueryFeatureFlagByKeyArgs = {
  key: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryFeatureFlagsByTenantArgs = {
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryFeatureFlagsConnectionArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryFileArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryFileDownloadUrlArgs = {
  expiresIn?: Scalars["Int"]["input"];
  id: Scalars["ID"]["input"];
};

export type QueryFilesByFolderArgs = {
  folderId?: InputMaybe<Scalars["ID"]["input"]>;
  tenantId: Scalars["ID"]["input"];
};

export type QueryFilesByTenantArgs = {
  tenantId: Scalars["ID"]["input"];
};

export type QueryFilesPaginatedArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type QueryImportJobArgs = {
  id: Scalars["String"]["input"];
};

export type QueryImportJobsByStatusArgs = {
  status: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryImportJobsByTenantArgs = {
  tenantId: Scalars["String"]["input"];
};

export type QueryImportJobsConnectionArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryInvoiceArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryInvoicesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryIsFeatureEnabledArgs = {
  key: Scalars["String"]["input"];
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
  userId?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryJobScheduleArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryJobSchedulesByTenantArgs = {
  tenantId: Scalars["ID"]["input"];
};

export type QueryJobsPaginatedArgs = {
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type QueryJournalArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryJournalsArgs = {
  fiscalPeriod?: InputMaybe<Scalars["String"]["input"]>;
  journalType?: InputMaybe<JournalType>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<JournalStatus>;
};

export type QueryJournalsByPeriodArgs = {
  fiscalPeriod: Scalars["String"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryMyTasksArgs = {
  status?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryNotificationArgs = {
  id: Scalars["String"]["input"];
};

export type QueryNotificationsArgs = {
  limit?: Scalars["Float"]["input"];
  offset?: Scalars["Float"]["input"];
  tenantId: Scalars["String"]["input"];
};

export type QueryNotificationsPaginatedArgs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  before?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Float"]["input"]>;
  last?: InputMaybe<Scalars["Float"]["input"]>;
  tenantId: Scalars["String"]["input"];
};

export type QueryOrganizationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryOrganizationBySlugArgs = {
  slug: Scalars["String"]["input"];
};

export type QueryOrganizationsArgs = {
  filter?: InputMaybe<OrganizationFilterInput>;
};

export type QueryPaymentArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryPaymentsArgs = {
  invoiceId?: InputMaybe<Scalars["String"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  paymentMethod?: InputMaybe<PaymentMethod>;
  status?: InputMaybe<PaymentStatus>;
};

export type QueryPaymentsByInvoiceArgs = {
  invoiceId: Scalars["ID"]["input"];
};

export type QueryPaymentsByStatusArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  status: PaymentStatus;
};

export type QueryPendingNotificationsArgs = {
  tenantId: Scalars["String"]["input"];
};

export type QueryProductArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryProductBySkuArgs = {
  sku: Scalars["String"]["input"];
};

export type QueryProductsArgs = {
  filter?: InputMaybe<ProductFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryProductsByCategoryArgs = {
  category: Scalars["String"]["input"];
};

export type QueryRuleArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryRulesArgs = {
  filter?: InputMaybe<RuleFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryRulesByCategoryArgs = {
  category: Scalars["String"]["input"];
};

export type QueryRulesByEntityArgs = {
  entityType: Scalars["String"]["input"];
};

export type QuerySearchAuditLogsArgs = {
  input: SearchAuditInput;
};

export type QuerySearchDocumentsArgs = {
  input: SearchDocumentInput;
};

export type QuerySearchFilesArgs = {
  input: SearchFileInput;
};

export type QuerySearchJobsArgs = {
  input: SearchJobInput;
};

export type QueryTaskArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryTasksArgs = {
  filter?: InputMaybe<TaskFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryTasksByWorkflowArgs = {
  workflowId: Scalars["String"]["input"];
};

export type QueryUnpostedJournalsArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

export type QueryUpcomingJobsArgs = {
  hours?: Scalars["Int"]["input"];
  tenantId: Scalars["ID"]["input"];
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryUserByEmailArgs = {
  email: Scalars["String"]["input"];
};

export type QueryUsersArgs = {
  organizationId: Scalars["String"]["input"];
};

export type QueryValidateNidArgs = {
  nid: Scalars["String"]["input"];
};

export type QueryValidateRuleExpressionArgs = {
  expression: Scalars["String"]["input"];
};

export type QueryValidateTinArgs = {
  tin: Scalars["String"]["input"];
};

export type QueryValidateTokenArgs = {
  token: Scalars["String"]["input"];
};

export type QueryValidateVendorTinArgs = {
  tin: Scalars["String"]["input"];
};

export type QueryVendorArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryVendorByCodeArgs = {
  code: Scalars["String"]["input"];
};

export type QueryVendorByTinArgs = {
  tin: Scalars["String"]["input"];
};

export type QueryVendorsArgs = {
  filter?: InputMaybe<VendorFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryWorkflowArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryWorkflowHistoryArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryWorkflowsArgs = {
  filter?: InputMaybe<WorkflowFilterInput>;
  limit?: Scalars["Float"]["input"];
  page?: Scalars["Float"]["input"];
};

export type QueryWorkflowsByStatusArgs = {
  status: Scalars["String"]["input"];
};

export type ReconcilePaymentInput = {
  bankStatementTransactionId: Scalars["String"]["input"];
};

export type RefreshTokenInput = {
  refreshToken: Scalars["String"]["input"];
};

export type RefreshTokenResponse = {
  __typename?: "RefreshTokenResponse";
  accessToken: Scalars["String"]["output"];
  expiresIn: Scalars["Float"]["output"];
  refreshToken: Scalars["String"]["output"];
};

export type RegisterInput = {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  phone?: InputMaybe<Scalars["String"]["input"]>;
  tenantId?: InputMaybe<Scalars["String"]["input"]>;
};

export type RegisterResponse = {
  __typename?: "RegisterResponse";
  accessToken: Scalars["String"]["output"];
  message: Scalars["String"]["output"];
  refreshToken: Scalars["String"]["output"];
  user: UserResponse;
};

export type ReversePaymentInput = {
  reason: Scalars["String"]["input"];
};

export type RuleEvaluationResponse = {
  __typename?: "RuleEvaluationResponse";
  actions?: Maybe<Scalars["String"]["output"]>;
  appliedRules?: Maybe<Scalars["String"]["output"]>;
  context?: Maybe<Scalars["String"]["output"]>;
  errors?: Maybe<Scalars["String"]["output"]>;
  executionTime: Scalars["Float"]["output"];
  failedRules?: Maybe<Scalars["String"]["output"]>;
  message?: Maybe<Scalars["String"]["output"]>;
  metadata?: Maybe<Scalars["String"]["output"]>;
  passed: Scalars["Boolean"]["output"];
  result?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
  timestamp: Scalars["DateTime"]["output"];
  warnings?: Maybe<Scalars["String"]["output"]>;
};

export type RuleFilterInput = {
  action?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isSystemRule?: InputMaybe<Scalars["Boolean"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  severity?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Scalars["String"]["input"]>;
};

export type RuleResponse = {
  __typename?: "RuleResponse";
  action?: Maybe<Scalars["String"]["output"]>;
  actions?: Maybe<Scalars["String"]["output"]>;
  averageExecutionTime: Scalars["Float"]["output"];
  category: Scalars["String"]["output"];
  conditions?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  createdBy?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  entityType: Scalars["String"]["output"];
  errorMessage?: Maybe<Scalars["String"]["output"]>;
  executionCount: Scalars["Int"]["output"];
  expression: Scalars["String"]["output"];
  failureCount: Scalars["Int"]["output"];
  id: Scalars["ID"]["output"];
  isActive: Scalars["Boolean"]["output"];
  isSystemRule: Scalars["Boolean"]["output"];
  lastExecutedAt?: Maybe<Scalars["DateTime"]["output"]>;
  metadata?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  operator: Scalars["String"]["output"];
  priority: Scalars["Int"]["output"];
  requiresApproval: Scalars["Boolean"]["output"];
  severity: Scalars["String"]["output"];
  status: Scalars["String"]["output"];
  successCount: Scalars["Int"]["output"];
  successMessage?: Maybe<Scalars["String"]["output"]>;
  tags?: Maybe<Scalars["String"]["output"]>;
  updatedAt: Scalars["DateTime"]["output"];
  updatedBy?: Maybe<Scalars["String"]["output"]>;
};

export type SearchAuditInput = {
  action?: InputMaybe<Scalars["String"]["input"]>;
  correlation_id?: InputMaybe<Scalars["String"]["input"]>;
  end_date?: InputMaybe<Scalars["String"]["input"]>;
  entity_id?: InputMaybe<Scalars["String"]["input"]>;
  entity_type?: InputMaybe<Scalars["String"]["input"]>;
  event_type?: InputMaybe<AuditEventType>;
  limit?: InputMaybe<Scalars["Float"]["input"]>;
  offset?: InputMaybe<Scalars["Float"]["input"]>;
  outcome?: InputMaybe<AuditOutcome>;
  request_id?: InputMaybe<Scalars["String"]["input"]>;
  service_name?: InputMaybe<Scalars["String"]["input"]>;
  session_id?: InputMaybe<Scalars["String"]["input"]>;
  severity?: InputMaybe<AuditSeverity>;
  start_date?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id: Scalars["String"]["input"];
  user_id?: InputMaybe<Scalars["String"]["input"]>;
};

export type SearchDocumentInput = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  query?: InputMaybe<Scalars["String"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<DocumentStatus>;
  templateId?: InputMaybe<Scalars["String"]["input"]>;
  tenantId: Scalars["String"]["input"];
};

export type SearchFileInput = {
  accessLevel?: InputMaybe<FileAccessLevel>;
  limit?: Scalars["Int"]["input"];
  mimeType?: InputMaybe<Scalars["String"]["input"]>;
  offset?: Scalars["Int"]["input"];
  parentFolderId?: InputMaybe<Scalars["String"]["input"]>;
  query?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<FileStatus>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tenantId: Scalars["String"]["input"];
};

export type SearchJobInput = {
  handlerName?: InputMaybe<Scalars["String"]["input"]>;
  jobType?: InputMaybe<JobType>;
  limit?: Scalars["Int"]["input"];
  offset?: Scalars["Int"]["input"];
  query?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<JobStatus>;
  tenantId: Scalars["String"]["input"];
};

export type ShareFileInput = {
  expiresAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  maxDownloads?: InputMaybe<Scalars["Int"]["input"]>;
  password?: InputMaybe<Scalars["String"]["input"]>;
  publicUrl?: InputMaybe<Scalars["String"]["input"]>;
};

export type TaskFilterInput = {
  assigneeId?: InputMaybe<Scalars["String"]["input"]>;
  assigneeRole?: InputMaybe<Scalars["String"]["input"]>;
  dueDateFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  dueDateTo?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  overdue?: InputMaybe<Scalars["Boolean"]["input"]>;
  priority?: InputMaybe<Scalars["String"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  workflowId?: InputMaybe<Scalars["String"]["input"]>;
};

export type TaskResponse = {
  __typename?: "TaskResponse";
  allowComments: Scalars["Boolean"]["output"];
  allowDelegation: Scalars["Boolean"]["output"];
  approvedAt?: Maybe<Scalars["DateTime"]["output"]>;
  approvedBy?: Maybe<Scalars["String"]["output"]>;
  assigneeId?: Maybe<Scalars["String"]["output"]>;
  assigneeRole?: Maybe<Scalars["String"]["output"]>;
  comments?: Maybe<Scalars["String"]["output"]>;
  completedAt?: Maybe<Scalars["DateTime"]["output"]>;
  completionPercentage: Scalars["Int"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  createdBy?: Maybe<Scalars["String"]["output"]>;
  data?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  dueDate?: Maybe<Scalars["DateTime"]["output"]>;
  entityId?: Maybe<Scalars["String"]["output"]>;
  entityType?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isOverdue: Scalars["Boolean"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  parentTaskId?: Maybe<Scalars["String"]["output"]>;
  priority: Scalars["String"]["output"];
  rejectedAt?: Maybe<Scalars["DateTime"]["output"]>;
  rejectedBy?: Maybe<Scalars["String"]["output"]>;
  rejectionReason?: Maybe<Scalars["String"]["output"]>;
  requiresApproval: Scalars["Boolean"]["output"];
  result?: Maybe<Scalars["String"]["output"]>;
  startedAt?: Maybe<Scalars["DateTime"]["output"]>;
  status: Scalars["String"]["output"];
  type: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  updatedBy?: Maybe<Scalars["String"]["output"]>;
  workflowId?: Maybe<Scalars["String"]["output"]>;
};

export type UpdateConfigurationInput = {
  category?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  environment?: InputMaybe<Scalars["String"]["input"]>;
  is_active?: InputMaybe<Scalars["Boolean"]["input"]>;
  is_encrypted?: InputMaybe<Scalars["Boolean"]["input"]>;
  key?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  updated_by?: InputMaybe<Scalars["String"]["input"]>;
  validation_rules?: InputMaybe<Scalars["String"]["input"]>;
  value?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateCustomerInput = {
  address?: InputMaybe<AddressInput>;
  code?: InputMaybe<Scalars["String"]["input"]>;
  creditLimit?: InputMaybe<Scalars["Float"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameInBengali?: InputMaybe<Scalars["String"]["input"]>;
  nid?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms?: InputMaybe<PaymentTermsInput>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  tin?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateExportJobInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  error_details?: InputMaybe<Scalars["String"]["input"]>;
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  file_path?: InputMaybe<Scalars["String"]["input"]>;
  file_size?: InputMaybe<Scalars["Float"]["input"]>;
  file_url?: InputMaybe<Scalars["String"]["input"]>;
  job_name?: InputMaybe<Scalars["String"]["input"]>;
  mime_type?: InputMaybe<Scalars["String"]["input"]>;
  processed_records?: InputMaybe<Scalars["Float"]["input"]>;
  status?: InputMaybe<ExportStatus>;
  total_records?: InputMaybe<Scalars["Float"]["input"]>;
};

export type UpdateFeatureFlagInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  enabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  key?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  rules?: InputMaybe<Scalars["String"]["input"]>;
  tenant_id?: InputMaybe<Scalars["String"]["input"]>;
  user_id?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateFileInput = {
  accessLevel?: InputMaybe<FileAccessLevel>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  originalName?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  updatedBy?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateImportJobInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  error_details?: InputMaybe<Scalars["String"]["input"]>;
  error_file_path?: InputMaybe<Scalars["String"]["input"]>;
  failed_rows?: InputMaybe<Scalars["Float"]["input"]>;
  job_name?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  processed_rows?: InputMaybe<Scalars["Float"]["input"]>;
  skipped_rows?: InputMaybe<Scalars["Float"]["input"]>;
  status?: InputMaybe<ImportStatus>;
  successful_rows?: InputMaybe<Scalars["Float"]["input"]>;
  summary?: InputMaybe<Scalars["String"]["input"]>;
  total_rows?: InputMaybe<Scalars["Float"]["input"]>;
};

export type UpdateJobInput = {
  cronExpression?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  jobData?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  timezone?: InputMaybe<Scalars["String"]["input"]>;
  updatedBy?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateNotificationStatusInput = {
  error_message?: InputMaybe<Scalars["String"]["input"]>;
  failed_at?: InputMaybe<Scalars["DateTime"]["input"]>;
  id: Scalars["String"]["input"];
  sent_at?: InputMaybe<Scalars["DateTime"]["input"]>;
  status: NotificationStatus;
};

export type UpdateOrganizationInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  logoUrl?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateProductInput = {
  barcode?: InputMaybe<Scalars["String"]["input"]>;
  brand?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  costPrice?: InputMaybe<Scalars["Float"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  hsCode?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isInventoryItem?: InputMaybe<Scalars["Boolean"]["input"]>;
  isServiceItem?: InputMaybe<Scalars["Boolean"]["input"]>;
  isTaxable?: InputMaybe<Scalars["Boolean"]["input"]>;
  manufacturer?: InputMaybe<Scalars["String"]["input"]>;
  maxStock?: InputMaybe<Scalars["Float"]["input"]>;
  minStock?: InputMaybe<Scalars["Float"]["input"]>;
  model?: InputMaybe<Scalars["String"]["input"]>;
  mrp?: InputMaybe<Scalars["Float"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameBn?: InputMaybe<Scalars["String"]["input"]>;
  preferredVendorId?: InputMaybe<Scalars["String"]["input"]>;
  qrCode?: InputMaybe<Scalars["String"]["input"]>;
  reorderLevel?: InputMaybe<Scalars["Float"]["input"]>;
  reorderQuantity?: InputMaybe<Scalars["Float"]["input"]>;
  salePrice?: InputMaybe<Scalars["Float"]["input"]>;
  sku?: InputMaybe<Scalars["String"]["input"]>;
  subCategory?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  unit?: InputMaybe<Scalars["String"]["input"]>;
  unitPrice?: InputMaybe<Scalars["Float"]["input"]>;
  uom?: InputMaybe<Scalars["String"]["input"]>;
  vatRate?: InputMaybe<Scalars["Float"]["input"]>;
};

export type UpdateRuleInput = {
  action?: InputMaybe<Scalars["String"]["input"]>;
  actions?: InputMaybe<Scalars["String"]["input"]>;
  category?: InputMaybe<Scalars["String"]["input"]>;
  conditions?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  errorMessage?: InputMaybe<Scalars["String"]["input"]>;
  expression?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  isSystemRule?: InputMaybe<Scalars["Boolean"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  operator?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Scalars["Int"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  severity?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  successMessage?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateTaskInput = {
  allowComments?: InputMaybe<Scalars["Boolean"]["input"]>;
  allowDelegation?: InputMaybe<Scalars["Boolean"]["input"]>;
  assigneeId?: InputMaybe<Scalars["String"]["input"]>;
  assigneeRole?: InputMaybe<Scalars["String"]["input"]>;
  comments?: InputMaybe<Scalars["String"]["input"]>;
  completedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  data?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  dueDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  parentTaskId?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Scalars["String"]["input"]>;
  rejectionReason?: InputMaybe<Scalars["String"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  result?: InputMaybe<Scalars["String"]["input"]>;
  startedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  workflowId?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateVendorInput = {
  address?: InputMaybe<VendorAddressInput>;
  bankAccountNo?: InputMaybe<Scalars["String"]["input"]>;
  bankBranch?: InputMaybe<Scalars["String"]["input"]>;
  bankName?: InputMaybe<Scalars["String"]["input"]>;
  bankRoutingNo?: InputMaybe<Scalars["String"]["input"]>;
  bin?: InputMaybe<Scalars["String"]["input"]>;
  code?: InputMaybe<Scalars["String"]["input"]>;
  contactPerson?: InputMaybe<Scalars["String"]["input"]>;
  contactPersonPhone?: InputMaybe<Scalars["String"]["input"]>;
  creditLimit?: InputMaybe<Scalars["Float"]["input"]>;
  email?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  mobile?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  nameBn?: InputMaybe<Scalars["String"]["input"]>;
  paymentTerms?: InputMaybe<Scalars["Float"]["input"]>;
  phone?: InputMaybe<Scalars["String"]["input"]>;
  tin?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateWorkflowInput = {
  autoStart?: InputMaybe<Scalars["Boolean"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  dueDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  metadata?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  templateId?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
  variables?: InputMaybe<Scalars["String"]["input"]>;
};

export type User = {
  __typename?: "User";
  createdAt: Scalars["DateTime"]["output"];
  email: Scalars["String"]["output"];
  emailVerified: Scalars["Boolean"]["output"];
  firstName?: Maybe<Scalars["String"]["output"]>;
  fullName: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  lastLoginAt?: Maybe<Scalars["DateTime"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  organizationId: Scalars["String"]["output"];
  phone?: Maybe<Scalars["String"]["output"]>;
  phoneVerified: Scalars["Boolean"]["output"];
  status: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  username: Scalars["String"]["output"];
};

export type UserResponse = {
  __typename?: "UserResponse";
  createdAt: Scalars["DateTime"]["output"];
  email: Scalars["String"]["output"];
  firstName?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  lastName?: Maybe<Scalars["String"]["output"]>;
  organizationId: Scalars["String"]["output"];
  phone?: Maybe<Scalars["String"]["output"]>;
  roleId?: Maybe<Scalars["String"]["output"]>;
  status: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  username: Scalars["String"]["output"];
};

/** Bangladesh VAT categories per NBR regulations */
export enum VatCategory {
  Exempt = "EXEMPT",
  Reduced = "REDUCED",
  Standard = "STANDARD",
  Truncated = "TRUNCATED",
  ZeroRated = "ZERO_RATED",
}

export type Vendor = {
  __typename?: "Vendor";
  bin?: Maybe<Scalars["String"]["output"]>;
  code: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  name_bn?: Maybe<Scalars["String"]["output"]>;
  phone: Scalars["String"]["output"];
  phone_secondary?: Maybe<Scalars["String"]["output"]>;
  tin: Scalars["String"]["output"];
  trade_license_expiry?: Maybe<Scalars["DateTime"]["output"]>;
  trade_license_no?: Maybe<Scalars["String"]["output"]>;
  vendor_type: Scalars["String"]["output"];
  website?: Maybe<Scalars["String"]["output"]>;
};

export type VendorAddressInput = {
  city: Scalars["String"]["input"];
  country?: Scalars["String"]["input"];
  district: Scalars["String"]["input"];
  division: Scalars["String"]["input"];
  postalCode: Scalars["String"]["input"];
  street1: Scalars["String"]["input"];
  street2?: InputMaybe<Scalars["String"]["input"]>;
};

export type VendorFilterInput = {
  district?: InputMaybe<Scalars["String"]["input"]>;
  division?: InputMaybe<Scalars["String"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type WorkflowFilterInput = {
  dueDateFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  dueDateTo?: InputMaybe<Scalars["DateTime"]["input"]>;
  entityId?: InputMaybe<Scalars["String"]["input"]>;
  entityType?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  startDateFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDateTo?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<Scalars["String"]["input"]>;
  type?: InputMaybe<Scalars["String"]["input"]>;
};

export type WorkflowResponse = {
  __typename?: "WorkflowResponse";
  completedAt?: Maybe<Scalars["DateTime"]["output"]>;
  createdAt: Scalars["DateTime"]["output"];
  createdBy?: Maybe<Scalars["String"]["output"]>;
  currentStep: Scalars["Int"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  dueDate?: Maybe<Scalars["DateTime"]["output"]>;
  entityId?: Maybe<Scalars["String"]["output"]>;
  entityType?: Maybe<Scalars["String"]["output"]>;
  error?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  metadata?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  priority: Scalars["String"]["output"];
  startedAt?: Maybe<Scalars["DateTime"]["output"]>;
  status: Scalars["String"]["output"];
  templateId: Scalars["String"]["output"];
  temporalRunId?: Maybe<Scalars["String"]["output"]>;
  temporalWorkflowId?: Maybe<Scalars["String"]["output"]>;
  totalSteps: Scalars["Int"]["output"];
  type: Scalars["String"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
  updatedBy?: Maybe<Scalars["String"]["output"]>;
  variables?: Maybe<Scalars["String"]["output"]>;
};

export type GetInvoicesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetInvoicesQuery = {
  __typename?: "Query";
  invoices: Array<{
    __typename?: "Invoice";
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    customerId: string;
    customerTIN?: string | null;
    customerBIN?: string | null;
    invoiceDate: string;
    dueDate: string;
    createdAt: string;
    updatedAt: string;
    grandTotal: { __typename?: "MoneyDto"; amount: number; currency: string };
  }>;
};

export type GetInvoiceQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetInvoiceQuery = {
  __typename?: "Query";
  invoice?: {
    __typename?: "Invoice";
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    vendorId: string;
    customerId: string;
    vendorTIN?: string | null;
    vendorBIN?: string | null;
    customerTIN?: string | null;
    customerBIN?: string | null;
    invoiceDate: string;
    dueDate: string;
    fiscalYear: string;
    mushakNumber?: string | null;
    challanNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    grandTotal: { __typename?: "MoneyDto"; amount: number; currency: string };
    subtotal: { __typename?: "MoneyDto"; amount: number; currency: string };
    vatAmount: { __typename?: "MoneyDto"; amount: number; currency: string };
    supplementaryDuty: {
      __typename?: "MoneyDto";
      amount: number;
      currency: string;
    };
    advanceIncomeTax: {
      __typename?: "MoneyDto";
      amount: number;
      currency: string;
    };
    lineItems: Array<{
      __typename?: "LineItem";
      description: string;
      quantity: number;
      unitPrice: { __typename?: "MoneyDto"; amount: number; currency: string };
    }>;
  } | null;
};

export type GetChartOfAccountsQueryVariables = Exact<{ [key: string]: never }>;

export type GetChartOfAccountsQuery = {
  __typename?: "Query";
  chartOfAccounts: Array<{
    __typename?: "ChartOfAccount";
    id: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    parentAccountId?: string | null;
    currency: string;
    isActive: boolean;
    createdAt: string;
    balance: { __typename?: "MoneyDto"; amount: number; currency: string };
  }>;
};

export type GetPaymentsByStatusQueryVariables = Exact<{
  status: PaymentStatus;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetPaymentsByStatusQuery = {
  __typename?: "Query";
  paymentsByStatus: Array<{
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    invoiceId: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    paymentDate: string;
    reference?: string | null;
    createdAt: string;
    updatedAt: string;
    amount: { __typename?: "MoneyDto"; amount: number; currency: string };
  }>;
};

export type HealthCheckQueryVariables = Exact<{ [key: string]: never }>;

export type HealthCheckQuery = { __typename: "Query" };

export type CreateInvoiceMutationVariables = Exact<{
  input: CreateInvoiceInput;
}>;

export type CreateInvoiceMutation = {
  __typename?: "Mutation";
  createInvoice: {
    __typename?: "Invoice";
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    customerId: string;
    customerTIN?: string | null;
    customerBIN?: string | null;
    vendorId: string;
    vendorTIN?: string | null;
    vendorBIN?: string | null;
    invoiceDate: string;
    dueDate: string;
    fiscalYear: string;
    mushakNumber?: string | null;
    challanNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    grandTotal: { __typename?: "MoneyDto"; amount: number; currency: string };
    subtotal: { __typename?: "MoneyDto"; amount: number; currency: string };
    vatAmount: { __typename?: "MoneyDto"; amount: number; currency: string };
    supplementaryDuty: {
      __typename?: "MoneyDto";
      amount: number;
      currency: string;
    };
    advanceIncomeTax: {
      __typename?: "MoneyDto";
      amount: number;
      currency: string;
    };
    lineItems: Array<{
      __typename?: "LineItem";
      description: string;
      quantity: number;
      unitPrice: { __typename?: "MoneyDto"; amount: number; currency: string };
    }>;
  };
};

export type ApproveInvoiceMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ApproveInvoiceMutation = {
  __typename?: "Mutation";
  approveInvoice: {
    __typename?: "Invoice";
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    mushakNumber?: string | null;
    challanNumber?: string | null;
    updatedAt: string;
  };
};

export type CancelInvoiceMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
}>;

export type CancelInvoiceMutation = {
  __typename?: "Mutation";
  cancelInvoice: {
    __typename?: "Invoice";
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    updatedAt: string;
  };
};

export type CreatePaymentMutationVariables = Exact<{
  input: CreatePaymentInput;
}>;

export type CreatePaymentMutation = {
  __typename?: "Mutation";
  createPayment: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    invoiceId: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    paymentDate: string;
    reference?: string | null;
    bankAccountId?: string | null;
    checkNumber?: string | null;
    createdAt: string;
    updatedAt: string;
    amount: { __typename?: "MoneyDto"; amount: number; currency: string };
    mobileWallet?: {
      __typename?: "MobileWallet";
      provider: MobileWalletProvider;
      mobileNumber: string;
      transactionId: string;
      merchantCode?: string | null;
    } | null;
  };
};

export type CompletePaymentMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  input: CompletePaymentInput;
}>;

export type CompletePaymentMutation = {
  __typename?: "Mutation";
  completePayment: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    status: PaymentStatus;
    transactionReference?: string | null;
    updatedAt: string;
  };
};

export type FailPaymentMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  input: FailPaymentInput;
}>;

export type FailPaymentMutation = {
  __typename?: "Mutation";
  failPayment: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    status: PaymentStatus;
    failureReason?: string | null;
    updatedAt: string;
  };
};

export type ReconcilePaymentMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  input: ReconcilePaymentInput;
}>;

export type ReconcilePaymentMutation = {
  __typename?: "Mutation";
  reconcilePayment: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    status: PaymentStatus;
    bankTransactionId?: string | null;
    reconciledAt?: string | null;
    reconciledBy?: string | null;
    updatedAt: string;
  };
};

export type ReversePaymentMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  input: ReversePaymentInput;
}>;

export type ReversePaymentMutation = {
  __typename?: "Mutation";
  reversePayment: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    status: PaymentStatus;
    reversalReason?: string | null;
    reversedAt?: string | null;
    reversedBy?: string | null;
    updatedAt: string;
  };
};

export type CreateAccountMutationVariables = Exact<{
  input: CreateAccountInput;
}>;

export type CreateAccountMutation = {
  __typename?: "Mutation";
  createAccount: {
    __typename?: "ChartOfAccount";
    id: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    parentAccountId?: string | null;
    currency: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    balance: { __typename?: "MoneyDto"; amount: number; currency: string };
  };
};

export type DeactivateAccountMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
}>;

export type DeactivateAccountMutation = {
  __typename?: "Mutation";
  deactivateAccount: {
    __typename?: "ChartOfAccount";
    id: string;
    accountCode: string;
    accountName: string;
    isActive: boolean;
    updatedAt: string;
  };
};

export type CreateJournalMutationVariables = Exact<{
  input: CreateJournalInput;
}>;

export type CreateJournalMutation = {
  __typename?: "Mutation";
  createJournal: {
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    journalDate: string;
    journalType: JournalType;
    description: string;
    reference?: string | null;
    totalDebit: number;
    totalCredit: number;
    currency: string;
    status: JournalStatus;
    fiscalPeriod: string;
    isReversing: boolean;
    originalJournalId?: string | null;
    createdAt: string;
    updatedAt: string;
    lines: Array<{
      __typename?: "JournalLine";
      lineId: string;
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description?: string | null;
      costCenter?: string | null;
      project?: string | null;
      reference?: string | null;
      taxCode?: string | null;
    }>;
  };
};

export type AddJournalLineMutationVariables = Exact<{
  journalId: Scalars["ID"]["input"];
  input: AddJournalLineInput;
}>;

export type AddJournalLineMutation = {
  __typename?: "Mutation";
  addJournalLine: {
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    totalDebit: number;
    totalCredit: number;
    updatedAt: string;
    lines: Array<{
      __typename?: "JournalLine";
      lineId: string;
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description?: string | null;
      costCenter?: string | null;
      project?: string | null;
    }>;
  };
};

export type PostJournalMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type PostJournalMutation = {
  __typename?: "Mutation";
  postJournal: {
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    status: JournalStatus;
    postedAt?: string | null;
    postedBy?: string | null;
    updatedAt: string;
  };
};

export type ReverseJournalMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  reversingDate: Scalars["String"]["input"];
}>;

export type ReverseJournalMutation = {
  __typename?: "Mutation";
  reverseJournal: {
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    journalDate: string;
    journalType: JournalType;
    description: string;
    totalDebit: number;
    totalCredit: number;
    status: JournalStatus;
    isReversing: boolean;
    originalJournalId?: string | null;
    createdAt: string;
    lines: Array<{
      __typename?: "JournalLine";
      lineId: string;
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description?: string | null;
    }>;
  };
};

export type GetPaymentQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetPaymentQuery = {
  __typename?: "Query";
  payment?: {
    __typename?: "Payment";
    id: string;
    paymentNumber: string;
    invoiceId: string;
    paymentMethod: PaymentMethod;
    bankAccountId?: string | null;
    checkNumber?: string | null;
    status: PaymentStatus;
    paymentDate: string;
    reference?: string | null;
    transactionReference?: string | null;
    reconciledAt?: string | null;
    reconciledBy?: string | null;
    bankTransactionId?: string | null;
    reversedAt?: string | null;
    reversedBy?: string | null;
    reversalReason?: string | null;
    failureReason?: string | null;
    createdAt: string;
    updatedAt: string;
    amount: { __typename?: "MoneyDto"; amount: number; currency: string };
    mobileWallet?: {
      __typename?: "MobileWallet";
      provider: MobileWalletProvider;
      mobileNumber: string;
      transactionId: string;
      merchantCode?: string | null;
    } | null;
  } | null;
};

export type GetJournalsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  status?: InputMaybe<JournalStatus>;
}>;

export type GetJournalsQuery = {
  __typename?: "Query";
  journals: Array<{
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    journalDate: string;
    journalType: JournalType;
    description: string;
    reference?: string | null;
    totalDebit: number;
    totalCredit: number;
    currency: string;
    status: JournalStatus;
    fiscalPeriod: string;
    isReversing: boolean;
    originalJournalId?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type GetJournalQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetJournalQuery = {
  __typename?: "Query";
  journal?: {
    __typename?: "JournalEntry";
    id: string;
    journalNumber: string;
    journalDate: string;
    journalType: JournalType;
    description: string;
    reference?: string | null;
    totalDebit: number;
    totalCredit: number;
    currency: string;
    status: JournalStatus;
    fiscalPeriod: string;
    isReversing: boolean;
    originalJournalId?: string | null;
    postedAt?: string | null;
    postedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    lines: Array<{
      __typename?: "JournalLine";
      lineId: string;
      accountId: string;
      debitAmount: number;
      creditAmount: number;
      description?: string | null;
      costCenter?: string | null;
      project?: string | null;
      reference?: string | null;
      taxCode?: string | null;
    }>;
  } | null;
};

export type GetChartOfAccountQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetChartOfAccountQuery = {
  __typename?: "Query";
  chartOfAccount?: {
    __typename?: "ChartOfAccount";
    id: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    parentAccountId?: string | null;
    currency: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    parentAccount?: {
      __typename?: "ChartOfAccount";
      id: string;
      accountCode: string;
      accountName: string;
    } | null;
    balance: { __typename?: "MoneyDto"; amount: number; currency: string };
  } | null;
};

export const GetInvoicesDocument = gql`
  query GetInvoices($limit: Int = 50, $offset: Int = 0) {
    invoices(limit: $limit, offset: $offset) {
      id
      invoiceNumber
      status
      customerId
      customerTIN
      customerBIN
      grandTotal {
        amount
        currency
      }
      invoiceDate
      dueDate
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetInvoicesQuery__
 *
 * To run a query within a React component, call `useGetInvoicesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInvoicesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInvoicesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetInvoicesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetInvoicesQuery,
    GetInvoicesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetInvoicesQuery, GetInvoicesQueryVariables>(
    GetInvoicesDocument,
    options,
  );
}
export function useGetInvoicesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetInvoicesQuery,
    GetInvoicesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetInvoicesQuery, GetInvoicesQueryVariables>(
    GetInvoicesDocument,
    options,
  );
}
export function useGetInvoicesSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetInvoicesQuery,
        GetInvoicesQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetInvoicesQuery, GetInvoicesQueryVariables>(
    GetInvoicesDocument,
    options,
  );
}
export type GetInvoicesQueryHookResult = ReturnType<typeof useGetInvoicesQuery>;
export type GetInvoicesLazyQueryHookResult = ReturnType<
  typeof useGetInvoicesLazyQuery
>;
export type GetInvoicesSuspenseQueryHookResult = ReturnType<
  typeof useGetInvoicesSuspenseQuery
>;
export type GetInvoicesQueryResult = Apollo.QueryResult<
  GetInvoicesQuery,
  GetInvoicesQueryVariables
>;
export const GetInvoiceDocument = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      id
      invoiceNumber
      status
      vendorId
      customerId
      vendorTIN
      vendorBIN
      customerTIN
      customerBIN
      grandTotal {
        amount
        currency
      }
      subtotal {
        amount
        currency
      }
      vatAmount {
        amount
        currency
      }
      supplementaryDuty {
        amount
        currency
      }
      advanceIncomeTax {
        amount
        currency
      }
      invoiceDate
      dueDate
      fiscalYear
      mushakNumber
      challanNumber
      lineItems {
        description
        quantity
        unitPrice {
          amount
          currency
        }
      }
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetInvoiceQuery__
 *
 * To run a query within a React component, call `useGetInvoiceQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInvoiceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInvoiceQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetInvoiceQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetInvoiceQuery,
    GetInvoiceQueryVariables
  > &
    (
      | { variables: GetInvoiceQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetInvoiceQuery, GetInvoiceQueryVariables>(
    GetInvoiceDocument,
    options,
  );
}
export function useGetInvoiceLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetInvoiceQuery,
    GetInvoiceQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetInvoiceQuery, GetInvoiceQueryVariables>(
    GetInvoiceDocument,
    options,
  );
}
export function useGetInvoiceSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetInvoiceQuery,
        GetInvoiceQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetInvoiceQuery, GetInvoiceQueryVariables>(
    GetInvoiceDocument,
    options,
  );
}
export type GetInvoiceQueryHookResult = ReturnType<typeof useGetInvoiceQuery>;
export type GetInvoiceLazyQueryHookResult = ReturnType<
  typeof useGetInvoiceLazyQuery
>;
export type GetInvoiceSuspenseQueryHookResult = ReturnType<
  typeof useGetInvoiceSuspenseQuery
>;
export type GetInvoiceQueryResult = Apollo.QueryResult<
  GetInvoiceQuery,
  GetInvoiceQueryVariables
>;
export const GetChartOfAccountsDocument = gql`
  query GetChartOfAccounts {
    chartOfAccounts {
      id
      accountCode
      accountName
      accountType
      parentAccountId
      balance {
        amount
        currency
      }
      currency
      isActive
      createdAt
    }
  }
`;

/**
 * __useGetChartOfAccountsQuery__
 *
 * To run a query within a React component, call `useGetChartOfAccountsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChartOfAccountsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChartOfAccountsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChartOfAccountsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetChartOfAccountsQuery,
    GetChartOfAccountsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetChartOfAccountsQuery,
    GetChartOfAccountsQueryVariables
  >(GetChartOfAccountsDocument, options);
}
export function useGetChartOfAccountsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetChartOfAccountsQuery,
    GetChartOfAccountsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetChartOfAccountsQuery,
    GetChartOfAccountsQueryVariables
  >(GetChartOfAccountsDocument, options);
}
export function useGetChartOfAccountsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetChartOfAccountsQuery,
        GetChartOfAccountsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetChartOfAccountsQuery,
    GetChartOfAccountsQueryVariables
  >(GetChartOfAccountsDocument, options);
}
export type GetChartOfAccountsQueryHookResult = ReturnType<
  typeof useGetChartOfAccountsQuery
>;
export type GetChartOfAccountsLazyQueryHookResult = ReturnType<
  typeof useGetChartOfAccountsLazyQuery
>;
export type GetChartOfAccountsSuspenseQueryHookResult = ReturnType<
  typeof useGetChartOfAccountsSuspenseQuery
>;
export type GetChartOfAccountsQueryResult = Apollo.QueryResult<
  GetChartOfAccountsQuery,
  GetChartOfAccountsQueryVariables
>;
export const GetPaymentsByStatusDocument = gql`
  query GetPaymentsByStatus(
    $status: PaymentStatus!
    $limit: Int = 50
    $offset: Int = 0
  ) {
    paymentsByStatus(status: $status, limit: $limit, offset: $offset) {
      id
      paymentNumber
      invoiceId
      amount {
        amount
        currency
      }
      paymentMethod
      status
      paymentDate
      reference
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetPaymentsByStatusQuery__
 *
 * To run a query within a React component, call `useGetPaymentsByStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPaymentsByStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPaymentsByStatusQuery({
 *   variables: {
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPaymentsByStatusQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetPaymentsByStatusQuery,
    GetPaymentsByStatusQueryVariables
  > &
    (
      | { variables: GetPaymentsByStatusQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetPaymentsByStatusQuery,
    GetPaymentsByStatusQueryVariables
  >(GetPaymentsByStatusDocument, options);
}
export function useGetPaymentsByStatusLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetPaymentsByStatusQuery,
    GetPaymentsByStatusQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetPaymentsByStatusQuery,
    GetPaymentsByStatusQueryVariables
  >(GetPaymentsByStatusDocument, options);
}
export function useGetPaymentsByStatusSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetPaymentsByStatusQuery,
        GetPaymentsByStatusQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetPaymentsByStatusQuery,
    GetPaymentsByStatusQueryVariables
  >(GetPaymentsByStatusDocument, options);
}
export type GetPaymentsByStatusQueryHookResult = ReturnType<
  typeof useGetPaymentsByStatusQuery
>;
export type GetPaymentsByStatusLazyQueryHookResult = ReturnType<
  typeof useGetPaymentsByStatusLazyQuery
>;
export type GetPaymentsByStatusSuspenseQueryHookResult = ReturnType<
  typeof useGetPaymentsByStatusSuspenseQuery
>;
export type GetPaymentsByStatusQueryResult = Apollo.QueryResult<
  GetPaymentsByStatusQuery,
  GetPaymentsByStatusQueryVariables
>;
export const HealthCheckDocument = gql`
  query HealthCheck {
    __typename
  }
`;

/**
 * __useHealthCheckQuery__
 *
 * To run a query within a React component, call `useHealthCheckQuery` and pass it any options that fit your needs.
 * When your component renders, `useHealthCheckQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHealthCheckQuery({
 *   variables: {
 *   },
 * });
 */
export function useHealthCheckQuery(
  baseOptions?: Apollo.QueryHookOptions<
    HealthCheckQuery,
    HealthCheckQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<HealthCheckQuery, HealthCheckQueryVariables>(
    HealthCheckDocument,
    options,
  );
}
export function useHealthCheckLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    HealthCheckQuery,
    HealthCheckQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<HealthCheckQuery, HealthCheckQueryVariables>(
    HealthCheckDocument,
    options,
  );
}
export function useHealthCheckSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        HealthCheckQuery,
        HealthCheckQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<HealthCheckQuery, HealthCheckQueryVariables>(
    HealthCheckDocument,
    options,
  );
}
export type HealthCheckQueryHookResult = ReturnType<typeof useHealthCheckQuery>;
export type HealthCheckLazyQueryHookResult = ReturnType<
  typeof useHealthCheckLazyQuery
>;
export type HealthCheckSuspenseQueryHookResult = ReturnType<
  typeof useHealthCheckSuspenseQuery
>;
export type HealthCheckQueryResult = Apollo.QueryResult<
  HealthCheckQuery,
  HealthCheckQueryVariables
>;
export const CreateInvoiceDocument = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
      status
      customerId
      customerTIN
      customerBIN
      vendorId
      vendorTIN
      vendorBIN
      grandTotal {
        amount
        currency
      }
      subtotal {
        amount
        currency
      }
      vatAmount {
        amount
        currency
      }
      supplementaryDuty {
        amount
        currency
      }
      advanceIncomeTax {
        amount
        currency
      }
      invoiceDate
      dueDate
      fiscalYear
      mushakNumber
      challanNumber
      lineItems {
        description
        quantity
        unitPrice {
          amount
          currency
        }
      }
      createdAt
      updatedAt
    }
  }
`;
export type CreateInvoiceMutationFn = Apollo.MutationFunction<
  CreateInvoiceMutation,
  CreateInvoiceMutationVariables
>;

/**
 * __useCreateInvoiceMutation__
 *
 * To run a mutation, you first call `useCreateInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createInvoiceMutation, { data, loading, error }] = useCreateInvoiceMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateInvoiceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateInvoiceMutation,
    CreateInvoiceMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateInvoiceMutation,
    CreateInvoiceMutationVariables
  >(CreateInvoiceDocument, options);
}
export type CreateInvoiceMutationHookResult = ReturnType<
  typeof useCreateInvoiceMutation
>;
export type CreateInvoiceMutationResult =
  Apollo.MutationResult<CreateInvoiceMutation>;
export type CreateInvoiceMutationOptions = Apollo.BaseMutationOptions<
  CreateInvoiceMutation,
  CreateInvoiceMutationVariables
>;
export const ApproveInvoiceDocument = gql`
  mutation ApproveInvoice($id: ID!) {
    approveInvoice(id: $id) {
      id
      invoiceNumber
      status
      mushakNumber
      challanNumber
      updatedAt
    }
  }
`;
export type ApproveInvoiceMutationFn = Apollo.MutationFunction<
  ApproveInvoiceMutation,
  ApproveInvoiceMutationVariables
>;

/**
 * __useApproveInvoiceMutation__
 *
 * To run a mutation, you first call `useApproveInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveInvoiceMutation, { data, loading, error }] = useApproveInvoiceMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApproveInvoiceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ApproveInvoiceMutation,
    ApproveInvoiceMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ApproveInvoiceMutation,
    ApproveInvoiceMutationVariables
  >(ApproveInvoiceDocument, options);
}
export type ApproveInvoiceMutationHookResult = ReturnType<
  typeof useApproveInvoiceMutation
>;
export type ApproveInvoiceMutationResult =
  Apollo.MutationResult<ApproveInvoiceMutation>;
export type ApproveInvoiceMutationOptions = Apollo.BaseMutationOptions<
  ApproveInvoiceMutation,
  ApproveInvoiceMutationVariables
>;
export const CancelInvoiceDocument = gql`
  mutation CancelInvoice($id: ID!, $reason: String!) {
    cancelInvoice(id: $id, reason: $reason) {
      id
      invoiceNumber
      status
      updatedAt
    }
  }
`;
export type CancelInvoiceMutationFn = Apollo.MutationFunction<
  CancelInvoiceMutation,
  CancelInvoiceMutationVariables
>;

/**
 * __useCancelInvoiceMutation__
 *
 * To run a mutation, you first call `useCancelInvoiceMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelInvoiceMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelInvoiceMutation, { data, loading, error }] = useCancelInvoiceMutation({
 *   variables: {
 *      id: // value for 'id'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useCancelInvoiceMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CancelInvoiceMutation,
    CancelInvoiceMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CancelInvoiceMutation,
    CancelInvoiceMutationVariables
  >(CancelInvoiceDocument, options);
}
export type CancelInvoiceMutationHookResult = ReturnType<
  typeof useCancelInvoiceMutation
>;
export type CancelInvoiceMutationResult =
  Apollo.MutationResult<CancelInvoiceMutation>;
export type CancelInvoiceMutationOptions = Apollo.BaseMutationOptions<
  CancelInvoiceMutation,
  CancelInvoiceMutationVariables
>;
export const CreatePaymentDocument = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      paymentNumber
      invoiceId
      amount {
        amount
        currency
      }
      paymentMethod
      status
      paymentDate
      reference
      bankAccountId
      checkNumber
      mobileWallet {
        provider
        mobileNumber
        transactionId
        merchantCode
      }
      createdAt
      updatedAt
    }
  }
`;
export type CreatePaymentMutationFn = Apollo.MutationFunction<
  CreatePaymentMutation,
  CreatePaymentMutationVariables
>;

/**
 * __useCreatePaymentMutation__
 *
 * To run a mutation, you first call `useCreatePaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPaymentMutation, { data, loading, error }] = useCreatePaymentMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreatePaymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreatePaymentMutation,
    CreatePaymentMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreatePaymentMutation,
    CreatePaymentMutationVariables
  >(CreatePaymentDocument, options);
}
export type CreatePaymentMutationHookResult = ReturnType<
  typeof useCreatePaymentMutation
>;
export type CreatePaymentMutationResult =
  Apollo.MutationResult<CreatePaymentMutation>;
export type CreatePaymentMutationOptions = Apollo.BaseMutationOptions<
  CreatePaymentMutation,
  CreatePaymentMutationVariables
>;
export const CompletePaymentDocument = gql`
  mutation CompletePayment($id: ID!, $input: CompletePaymentInput!) {
    completePayment(id: $id, input: $input) {
      id
      paymentNumber
      status
      transactionReference
      updatedAt
    }
  }
`;
export type CompletePaymentMutationFn = Apollo.MutationFunction<
  CompletePaymentMutation,
  CompletePaymentMutationVariables
>;

/**
 * __useCompletePaymentMutation__
 *
 * To run a mutation, you first call `useCompletePaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompletePaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completePaymentMutation, { data, loading, error }] = useCompletePaymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCompletePaymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CompletePaymentMutation,
    CompletePaymentMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CompletePaymentMutation,
    CompletePaymentMutationVariables
  >(CompletePaymentDocument, options);
}
export type CompletePaymentMutationHookResult = ReturnType<
  typeof useCompletePaymentMutation
>;
export type CompletePaymentMutationResult =
  Apollo.MutationResult<CompletePaymentMutation>;
export type CompletePaymentMutationOptions = Apollo.BaseMutationOptions<
  CompletePaymentMutation,
  CompletePaymentMutationVariables
>;
export const FailPaymentDocument = gql`
  mutation FailPayment($id: ID!, $input: FailPaymentInput!) {
    failPayment(id: $id, input: $input) {
      id
      paymentNumber
      status
      failureReason
      updatedAt
    }
  }
`;
export type FailPaymentMutationFn = Apollo.MutationFunction<
  FailPaymentMutation,
  FailPaymentMutationVariables
>;

/**
 * __useFailPaymentMutation__
 *
 * To run a mutation, you first call `useFailPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFailPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [failPaymentMutation, { data, loading, error }] = useFailPaymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useFailPaymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    FailPaymentMutation,
    FailPaymentMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<FailPaymentMutation, FailPaymentMutationVariables>(
    FailPaymentDocument,
    options,
  );
}
export type FailPaymentMutationHookResult = ReturnType<
  typeof useFailPaymentMutation
>;
export type FailPaymentMutationResult =
  Apollo.MutationResult<FailPaymentMutation>;
export type FailPaymentMutationOptions = Apollo.BaseMutationOptions<
  FailPaymentMutation,
  FailPaymentMutationVariables
>;
export const ReconcilePaymentDocument = gql`
  mutation ReconcilePayment($id: ID!, $input: ReconcilePaymentInput!) {
    reconcilePayment(id: $id, input: $input) {
      id
      paymentNumber
      status
      bankTransactionId
      reconciledAt
      reconciledBy
      updatedAt
    }
  }
`;
export type ReconcilePaymentMutationFn = Apollo.MutationFunction<
  ReconcilePaymentMutation,
  ReconcilePaymentMutationVariables
>;

/**
 * __useReconcilePaymentMutation__
 *
 * To run a mutation, you first call `useReconcilePaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReconcilePaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reconcilePaymentMutation, { data, loading, error }] = useReconcilePaymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useReconcilePaymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ReconcilePaymentMutation,
    ReconcilePaymentMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ReconcilePaymentMutation,
    ReconcilePaymentMutationVariables
  >(ReconcilePaymentDocument, options);
}
export type ReconcilePaymentMutationHookResult = ReturnType<
  typeof useReconcilePaymentMutation
>;
export type ReconcilePaymentMutationResult =
  Apollo.MutationResult<ReconcilePaymentMutation>;
export type ReconcilePaymentMutationOptions = Apollo.BaseMutationOptions<
  ReconcilePaymentMutation,
  ReconcilePaymentMutationVariables
>;
export const ReversePaymentDocument = gql`
  mutation ReversePayment($id: ID!, $input: ReversePaymentInput!) {
    reversePayment(id: $id, input: $input) {
      id
      paymentNumber
      status
      reversalReason
      reversedAt
      reversedBy
      updatedAt
    }
  }
`;
export type ReversePaymentMutationFn = Apollo.MutationFunction<
  ReversePaymentMutation,
  ReversePaymentMutationVariables
>;

/**
 * __useReversePaymentMutation__
 *
 * To run a mutation, you first call `useReversePaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReversePaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reversePaymentMutation, { data, loading, error }] = useReversePaymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useReversePaymentMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ReversePaymentMutation,
    ReversePaymentMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ReversePaymentMutation,
    ReversePaymentMutationVariables
  >(ReversePaymentDocument, options);
}
export type ReversePaymentMutationHookResult = ReturnType<
  typeof useReversePaymentMutation
>;
export type ReversePaymentMutationResult =
  Apollo.MutationResult<ReversePaymentMutation>;
export type ReversePaymentMutationOptions = Apollo.BaseMutationOptions<
  ReversePaymentMutation,
  ReversePaymentMutationVariables
>;
export const CreateAccountDocument = gql`
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      id
      accountCode
      accountName
      accountType
      parentAccountId
      balance {
        amount
        currency
      }
      currency
      isActive
      createdAt
      updatedAt
    }
  }
`;
export type CreateAccountMutationFn = Apollo.MutationFunction<
  CreateAccountMutation,
  CreateAccountMutationVariables
>;

/**
 * __useCreateAccountMutation__
 *
 * To run a mutation, you first call `useCreateAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAccountMutation, { data, loading, error }] = useCreateAccountMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateAccountMutation,
    CreateAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateAccountMutation,
    CreateAccountMutationVariables
  >(CreateAccountDocument, options);
}
export type CreateAccountMutationHookResult = ReturnType<
  typeof useCreateAccountMutation
>;
export type CreateAccountMutationResult =
  Apollo.MutationResult<CreateAccountMutation>;
export type CreateAccountMutationOptions = Apollo.BaseMutationOptions<
  CreateAccountMutation,
  CreateAccountMutationVariables
>;
export const DeactivateAccountDocument = gql`
  mutation DeactivateAccount($id: ID!, $reason: String!) {
    deactivateAccount(id: $id, reason: $reason) {
      id
      accountCode
      accountName
      isActive
      updatedAt
    }
  }
`;
export type DeactivateAccountMutationFn = Apollo.MutationFunction<
  DeactivateAccountMutation,
  DeactivateAccountMutationVariables
>;

/**
 * __useDeactivateAccountMutation__
 *
 * To run a mutation, you first call `useDeactivateAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeactivateAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deactivateAccountMutation, { data, loading, error }] = useDeactivateAccountMutation({
 *   variables: {
 *      id: // value for 'id'
 *      reason: // value for 'reason'
 *   },
 * });
 */
export function useDeactivateAccountMutation(
  baseOptions?: Apollo.MutationHookOptions<
    DeactivateAccountMutation,
    DeactivateAccountMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    DeactivateAccountMutation,
    DeactivateAccountMutationVariables
  >(DeactivateAccountDocument, options);
}
export type DeactivateAccountMutationHookResult = ReturnType<
  typeof useDeactivateAccountMutation
>;
export type DeactivateAccountMutationResult =
  Apollo.MutationResult<DeactivateAccountMutation>;
export type DeactivateAccountMutationOptions = Apollo.BaseMutationOptions<
  DeactivateAccountMutation,
  DeactivateAccountMutationVariables
>;
export const CreateJournalDocument = gql`
  mutation CreateJournal($input: CreateJournalInput!) {
    createJournal(input: $input) {
      id
      journalNumber
      journalDate
      journalType
      description
      reference
      lines {
        lineId
        accountId
        debitAmount
        creditAmount
        description
        costCenter
        project
        reference
        taxCode
      }
      totalDebit
      totalCredit
      currency
      status
      fiscalPeriod
      isReversing
      originalJournalId
      createdAt
      updatedAt
    }
  }
`;
export type CreateJournalMutationFn = Apollo.MutationFunction<
  CreateJournalMutation,
  CreateJournalMutationVariables
>;

/**
 * __useCreateJournalMutation__
 *
 * To run a mutation, you first call `useCreateJournalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateJournalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createJournalMutation, { data, loading, error }] = useCreateJournalMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateJournalMutation(
  baseOptions?: Apollo.MutationHookOptions<
    CreateJournalMutation,
    CreateJournalMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    CreateJournalMutation,
    CreateJournalMutationVariables
  >(CreateJournalDocument, options);
}
export type CreateJournalMutationHookResult = ReturnType<
  typeof useCreateJournalMutation
>;
export type CreateJournalMutationResult =
  Apollo.MutationResult<CreateJournalMutation>;
export type CreateJournalMutationOptions = Apollo.BaseMutationOptions<
  CreateJournalMutation,
  CreateJournalMutationVariables
>;
export const AddJournalLineDocument = gql`
  mutation AddJournalLine($journalId: ID!, $input: AddJournalLineInput!) {
    addJournalLine(journalId: $journalId, input: $input) {
      id
      journalNumber
      lines {
        lineId
        accountId
        debitAmount
        creditAmount
        description
        costCenter
        project
      }
      totalDebit
      totalCredit
      updatedAt
    }
  }
`;
export type AddJournalLineMutationFn = Apollo.MutationFunction<
  AddJournalLineMutation,
  AddJournalLineMutationVariables
>;

/**
 * __useAddJournalLineMutation__
 *
 * To run a mutation, you first call `useAddJournalLineMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddJournalLineMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addJournalLineMutation, { data, loading, error }] = useAddJournalLineMutation({
 *   variables: {
 *      journalId: // value for 'journalId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useAddJournalLineMutation(
  baseOptions?: Apollo.MutationHookOptions<
    AddJournalLineMutation,
    AddJournalLineMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    AddJournalLineMutation,
    AddJournalLineMutationVariables
  >(AddJournalLineDocument, options);
}
export type AddJournalLineMutationHookResult = ReturnType<
  typeof useAddJournalLineMutation
>;
export type AddJournalLineMutationResult =
  Apollo.MutationResult<AddJournalLineMutation>;
export type AddJournalLineMutationOptions = Apollo.BaseMutationOptions<
  AddJournalLineMutation,
  AddJournalLineMutationVariables
>;
export const PostJournalDocument = gql`
  mutation PostJournal($id: ID!) {
    postJournal(id: $id) {
      id
      journalNumber
      status
      postedAt
      postedBy
      updatedAt
    }
  }
`;
export type PostJournalMutationFn = Apollo.MutationFunction<
  PostJournalMutation,
  PostJournalMutationVariables
>;

/**
 * __usePostJournalMutation__
 *
 * To run a mutation, you first call `usePostJournalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePostJournalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [postJournalMutation, { data, loading, error }] = usePostJournalMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePostJournalMutation(
  baseOptions?: Apollo.MutationHookOptions<
    PostJournalMutation,
    PostJournalMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<PostJournalMutation, PostJournalMutationVariables>(
    PostJournalDocument,
    options,
  );
}
export type PostJournalMutationHookResult = ReturnType<
  typeof usePostJournalMutation
>;
export type PostJournalMutationResult =
  Apollo.MutationResult<PostJournalMutation>;
export type PostJournalMutationOptions = Apollo.BaseMutationOptions<
  PostJournalMutation,
  PostJournalMutationVariables
>;
export const ReverseJournalDocument = gql`
  mutation ReverseJournal($id: ID!, $reversingDate: String!) {
    reverseJournal(id: $id, reversingDate: $reversingDate) {
      id
      journalNumber
      journalDate
      journalType
      description
      lines {
        lineId
        accountId
        debitAmount
        creditAmount
        description
      }
      totalDebit
      totalCredit
      status
      isReversing
      originalJournalId
      createdAt
    }
  }
`;
export type ReverseJournalMutationFn = Apollo.MutationFunction<
  ReverseJournalMutation,
  ReverseJournalMutationVariables
>;

/**
 * __useReverseJournalMutation__
 *
 * To run a mutation, you first call `useReverseJournalMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReverseJournalMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [reverseJournalMutation, { data, loading, error }] = useReverseJournalMutation({
 *   variables: {
 *      id: // value for 'id'
 *      reversingDate: // value for 'reversingDate'
 *   },
 * });
 */
export function useReverseJournalMutation(
  baseOptions?: Apollo.MutationHookOptions<
    ReverseJournalMutation,
    ReverseJournalMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    ReverseJournalMutation,
    ReverseJournalMutationVariables
  >(ReverseJournalDocument, options);
}
export type ReverseJournalMutationHookResult = ReturnType<
  typeof useReverseJournalMutation
>;
export type ReverseJournalMutationResult =
  Apollo.MutationResult<ReverseJournalMutation>;
export type ReverseJournalMutationOptions = Apollo.BaseMutationOptions<
  ReverseJournalMutation,
  ReverseJournalMutationVariables
>;
export const GetPaymentDocument = gql`
  query GetPayment($id: ID!) {
    payment(id: $id) {
      id
      paymentNumber
      invoiceId
      amount {
        amount
        currency
      }
      paymentMethod
      bankAccountId
      checkNumber
      mobileWallet {
        provider
        mobileNumber
        transactionId
        merchantCode
      }
      status
      paymentDate
      reference
      transactionReference
      reconciledAt
      reconciledBy
      bankTransactionId
      reversedAt
      reversedBy
      reversalReason
      failureReason
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetPaymentQuery__
 *
 * To run a query within a React component, call `useGetPaymentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPaymentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPaymentQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPaymentQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetPaymentQuery,
    GetPaymentQueryVariables
  > &
    (
      | { variables: GetPaymentQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetPaymentQuery, GetPaymentQueryVariables>(
    GetPaymentDocument,
    options,
  );
}
export function useGetPaymentLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetPaymentQuery,
    GetPaymentQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetPaymentQuery, GetPaymentQueryVariables>(
    GetPaymentDocument,
    options,
  );
}
export function useGetPaymentSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetPaymentQuery,
        GetPaymentQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetPaymentQuery, GetPaymentQueryVariables>(
    GetPaymentDocument,
    options,
  );
}
export type GetPaymentQueryHookResult = ReturnType<typeof useGetPaymentQuery>;
export type GetPaymentLazyQueryHookResult = ReturnType<
  typeof useGetPaymentLazyQuery
>;
export type GetPaymentSuspenseQueryHookResult = ReturnType<
  typeof useGetPaymentSuspenseQuery
>;
export type GetPaymentQueryResult = Apollo.QueryResult<
  GetPaymentQuery,
  GetPaymentQueryVariables
>;
export const GetJournalsDocument = gql`
  query GetJournals(
    $limit: Int = 50
    $offset: Int = 0
    $status: JournalStatus
  ) {
    journals(limit: $limit, offset: $offset, status: $status) {
      id
      journalNumber
      journalDate
      journalType
      description
      reference
      totalDebit
      totalCredit
      currency
      status
      fiscalPeriod
      isReversing
      originalJournalId
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetJournalsQuery__
 *
 * To run a query within a React component, call `useGetJournalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJournalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJournalsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetJournalsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetJournalsQuery,
    GetJournalsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetJournalsQuery, GetJournalsQueryVariables>(
    GetJournalsDocument,
    options,
  );
}
export function useGetJournalsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetJournalsQuery,
    GetJournalsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetJournalsQuery, GetJournalsQueryVariables>(
    GetJournalsDocument,
    options,
  );
}
export function useGetJournalsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetJournalsQuery,
        GetJournalsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetJournalsQuery, GetJournalsQueryVariables>(
    GetJournalsDocument,
    options,
  );
}
export type GetJournalsQueryHookResult = ReturnType<typeof useGetJournalsQuery>;
export type GetJournalsLazyQueryHookResult = ReturnType<
  typeof useGetJournalsLazyQuery
>;
export type GetJournalsSuspenseQueryHookResult = ReturnType<
  typeof useGetJournalsSuspenseQuery
>;
export type GetJournalsQueryResult = Apollo.QueryResult<
  GetJournalsQuery,
  GetJournalsQueryVariables
>;
export const GetJournalDocument = gql`
  query GetJournal($id: ID!) {
    journal(id: $id) {
      id
      journalNumber
      journalDate
      journalType
      description
      reference
      lines {
        lineId
        accountId
        debitAmount
        creditAmount
        description
        costCenter
        project
        reference
        taxCode
      }
      totalDebit
      totalCredit
      currency
      status
      fiscalPeriod
      isReversing
      originalJournalId
      postedAt
      postedBy
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetJournalQuery__
 *
 * To run a query within a React component, call `useGetJournalQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJournalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJournalQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetJournalQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetJournalQuery,
    GetJournalQueryVariables
  > &
    (
      | { variables: GetJournalQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetJournalQuery, GetJournalQueryVariables>(
    GetJournalDocument,
    options,
  );
}
export function useGetJournalLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetJournalQuery,
    GetJournalQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetJournalQuery, GetJournalQueryVariables>(
    GetJournalDocument,
    options,
  );
}
export function useGetJournalSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetJournalQuery,
        GetJournalQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetJournalQuery, GetJournalQueryVariables>(
    GetJournalDocument,
    options,
  );
}
export type GetJournalQueryHookResult = ReturnType<typeof useGetJournalQuery>;
export type GetJournalLazyQueryHookResult = ReturnType<
  typeof useGetJournalLazyQuery
>;
export type GetJournalSuspenseQueryHookResult = ReturnType<
  typeof useGetJournalSuspenseQuery
>;
export type GetJournalQueryResult = Apollo.QueryResult<
  GetJournalQuery,
  GetJournalQueryVariables
>;
export const GetChartOfAccountDocument = gql`
  query GetChartOfAccount($id: ID!) {
    chartOfAccount(id: $id) {
      id
      accountCode
      accountName
      accountType
      parentAccountId
      parentAccount {
        id
        accountCode
        accountName
      }
      balance {
        amount
        currency
      }
      currency
      isActive
      createdAt
      updatedAt
    }
  }
`;

/**
 * __useGetChartOfAccountQuery__
 *
 * To run a query within a React component, call `useGetChartOfAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChartOfAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChartOfAccountQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetChartOfAccountQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetChartOfAccountQuery,
    GetChartOfAccountQueryVariables
  > &
    (
      | { variables: GetChartOfAccountQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetChartOfAccountQuery,
    GetChartOfAccountQueryVariables
  >(GetChartOfAccountDocument, options);
}
export function useGetChartOfAccountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetChartOfAccountQuery,
    GetChartOfAccountQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetChartOfAccountQuery,
    GetChartOfAccountQueryVariables
  >(GetChartOfAccountDocument, options);
}
export function useGetChartOfAccountSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetChartOfAccountQuery,
        GetChartOfAccountQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetChartOfAccountQuery,
    GetChartOfAccountQueryVariables
  >(GetChartOfAccountDocument, options);
}
export type GetChartOfAccountQueryHookResult = ReturnType<
  typeof useGetChartOfAccountQuery
>;
export type GetChartOfAccountLazyQueryHookResult = ReturnType<
  typeof useGetChartOfAccountLazyQuery
>;
export type GetChartOfAccountSuspenseQueryHookResult = ReturnType<
  typeof useGetChartOfAccountSuspenseQuery
>;
export type GetChartOfAccountQueryResult = Apollo.QueryResult<
  GetChartOfAccountQuery,
  GetChartOfAccountQueryVariables
>;
