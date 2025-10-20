import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a resolver or route
 *
 * @example
 * @Permissions('invoice:create', 'invoice:update')
 * async createInvoice() { ... }
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Common permission patterns for Finance Service:
 *
 * Invoice permissions:
 * - invoice:create - Create new invoices
 * - invoice:read - View invoices
 * - invoice:update - Update invoices
 * - invoice:approve - Approve invoices
 * - invoice:cancel - Cancel invoices
 * - invoice:delete - Delete invoices
 *
 * Payment permissions:
 * - payment:create - Create payments
 * - payment:read - View payments
 * - payment:process - Process payments
 * - payment:reconcile - Reconcile payments
 * - payment:refund - Refund payments
 *
 * Journal Entry permissions:
 * - journal:create - Create journal entries
 * - journal:read - View journal entries
 * - journal:post - Post journal entries
 * - journal:reverse - Reverse journal entries
 *
 * Chart of Accounts permissions:
 * - account:create - Create accounts
 * - account:read - View accounts
 * - account:update - Update accounts
 * - account:delete - Delete accounts
 *
 * Report permissions:
 * - report:read - View reports
 * - report:export - Export reports
 */
