/**
 * Infrastructure Event Handlers - Index
 *
 * Exports all event handlers for read model projection.
 * These handlers listen to domain events from EventStore and project them
 * to the PostgreSQL read model for optimized querying (CQRS pattern).
 *
 * Registration:
 * Import this array in the module providers to register all handlers:
 *
 * @Module({
 *   providers: [
 *     ...EVENT_HANDLERS,
 *     // other providers
 *   ],
 * })
 *
 * Event Flow:
 * 1. Domain aggregate emits event → EventStore persistence
 * 2. Event bus dispatches to handlers → Read model projection
 * 3. Queries use read model → Optimized query performance
 */

export { InvoiceCreatedHandler } from './invoice-created.handler';
export { LineItemAddedHandler } from './line-item-added.handler';
export { InvoiceCalculatedHandler } from './invoice-calculated.handler';
export { InvoiceApprovedHandler } from './invoice-approved.handler';
export { InvoiceCancelledHandler } from './invoice-cancelled.handler';

import { InvoiceCreatedHandler } from './invoice-created.handler';
import { LineItemAddedHandler } from './line-item-added.handler';
import { InvoiceCalculatedHandler } from './invoice-calculated.handler';
import { InvoiceApprovedHandler } from './invoice-approved.handler';
import { InvoiceCancelledHandler } from './invoice-cancelled.handler';

/**
 * All invoice event handlers for read model projection
 */
export const INVOICE_EVENT_HANDLERS = [
  InvoiceCreatedHandler,
  LineItemAddedHandler,
  InvoiceCalculatedHandler,
  InvoiceApprovedHandler,
  InvoiceCancelledHandler,
];
