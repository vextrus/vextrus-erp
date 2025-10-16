import { PaymentMethod, MobileWalletProvider } from '../../domain/aggregates/payment/payment.aggregate';

/**
 * Create Payment Command
 *
 * Command to create a new payment in the system.
 * Contains all necessary data for payment creation including
 * payment method, amount, and Bangladesh-specific fields for mobile wallets.
 *
 * Bangladesh Compliance:
 * - Mobile wallet providers: bKash, Nagad, Rocket, Upay, SureCash, mCash, tCash
 * - Mobile number validation: 01[3-9]\d{8} or +8801[3-9]\d{8}
 * - Payment number format: PMT-YYYY-MM-DD-NNNNNN
 */
export class CreatePaymentCommand {
  constructor(
    public readonly invoiceId: string,
    public readonly amount: number, // Will convert to Money in handler
    public readonly currency: string,
    public readonly paymentMethod: PaymentMethod,
    public readonly paymentDate: Date,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly reference?: string,
    // Bank payment fields
    public readonly bankAccountId?: string,
    public readonly checkNumber?: string,
    // Mobile wallet fields
    public readonly walletProvider?: MobileWalletProvider,
    public readonly mobileNumber?: string,
    public readonly walletTransactionId?: string,
    public readonly merchantCode?: string,
  ) {
    // Validate required fields
    if (!invoiceId) throw new Error('invoiceId is required');
    if (!amount || amount <= 0) throw new Error('amount must be positive');
    if (!currency) throw new Error('currency is required');
    if (!paymentMethod) throw new Error('paymentMethod is required');
    if (!paymentDate) throw new Error('paymentDate is required');
    if (!tenantId) throw new Error('tenantId is required');
    if (!userId) throw new Error('userId is required');

    // Validate mobile wallet requirements
    if (paymentMethod === PaymentMethod.MOBILE_WALLET) {
      if (!walletProvider) throw new Error('walletProvider required for mobile wallet');
      if (!mobileNumber) throw new Error('mobileNumber required for mobile wallet');

      // Validate Bangladesh mobile number format
      const mobileRegex = /^(01[3-9]\d{8}|\+8801[3-9]\d{8})$/;
      if (!mobileRegex.test(mobileNumber)) {
        throw new Error('Invalid Bangladesh mobile number format. Expected: 01[3-9]XXXXXXXX or +8801[3-9]XXXXXXXX');
      }
    }

    // Validate bank transfer requirements
    if (paymentMethod === PaymentMethod.BANK_TRANSFER && !bankAccountId) {
      throw new Error('bankAccountId required for bank transfer');
    }

    // Validate check requirements
    if (paymentMethod === PaymentMethod.CHECK) {
      if (!checkNumber) throw new Error('checkNumber required for check payment');
      if (checkNumber.length < 3) throw new Error('checkNumber must be at least 3 characters');
    }
  }
}
