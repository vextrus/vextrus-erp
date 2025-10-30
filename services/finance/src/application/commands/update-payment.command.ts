import { PaymentMethod } from '../../domain/aggregates/payment/payment.aggregate';

/**
 * Update Payment Command
 *
 * Updates an existing payment (PENDING status only).
 * Follows CQRS pattern - command is executed by UpdatePaymentHandler.
 *
 * Business Rules:
 * - Only PENDING payments can be updated
 * - Event sourcing: Updates are recorded as events, not destructive changes
 * - All fields are optional (partial updates supported)
 * - Cannot update after payment is PROCESSING, COMPLETED, or RECONCILED
 *
 * Bangladesh Compliance:
 * - Mobile number validation for wallet payments
 * - Check number validation for check payments
 */
export class UpdatePaymentCommand {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly amount?: number,
    public readonly currency?: string,
    public readonly paymentDate?: Date,
    public readonly paymentMethod?: PaymentMethod,
    public readonly reference?: string,
    public readonly bankAccountId?: string,
    public readonly checkNumber?: string,
  ) {}
}
