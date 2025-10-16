import {
  Payment,
  PaymentId,
  BankAccountId,
  PaymentMethod,
  MobileWalletProvider,
  PaymentStatus,
  MobileWallet,
  BankStatement,
  BankTransaction,
  CreatePaymentCommand,
  PaymentCreatedEvent,
  MobileWalletPaymentInitiatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentReconciledEvent,
  PaymentReversedEvent,
  InvalidPaymentMethodException,
  PaymentAlreadyReconciledException,
  NoMatchingTransactionException,
  InvalidMobileNumberException,
  PaymentAlreadyCompletedException,
} from './payment.aggregate';
import { Money } from '../../value-objects/money.value-object';
import { InvoiceId, UserId } from '../invoice/invoice.aggregate';
import { TenantId } from '../chart-of-account/chart-of-account.aggregate';

describe('Payment Aggregate', () => {
  describe('Payment Creation', () => {
    it('should create payment with valid data', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        reference: 'REF-001',
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment).toBeDefined();
      expect(payment.getId()).toBeInstanceOf(PaymentId);
      expect(payment.getStatus()).toBe(PaymentStatus.PENDING);
      expect(payment.getPaymentMethod()).toBe(PaymentMethod.BANK_TRANSFER);
      expect(payment.getAmount().getAmount()).toBe(10000);
      expect(payment.getInvoiceId().value).toBe('invoice-123');

      // Verify event
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);

      const createdEvent = events[0] as PaymentCreatedEvent;
      expect(createdEvent.eventType).toBe('PaymentCreated');
      expect(createdEvent.tenantId).toBe('tenant-789');
    });

    it('should generate payment number in correct format', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      const paymentNumber = payment.getPaymentNumber();
      expect(paymentNumber).toMatch(/^PMT-\d{4}-\d{2}-\d{2}-\d{6}$/);
      expect(paymentNumber).toContain('PMT-2024-10-15');
    });

    it('should create payment with bank account details', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(50000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        reference: 'BANK-REF-123',
        tenantId: new TenantId('tenant-789'),
        bankAccountId: new BankAccountId('bank-account-456'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment).toBeDefined();
      expect(payment.getPaymentMethod()).toBe(PaymentMethod.BANK_TRANSFER);
    });

    it('should create payment with check details', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(25000, 'BDT'),
        paymentMethod: PaymentMethod.CHECK,
        paymentDate: new Date('2024-10-15'),
        reference: 'CHECK-001',
        tenantId: new TenantId('tenant-789'),
        checkNumber: 'CHK-123456',
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment).toBeDefined();
      expect(payment.getPaymentMethod()).toBe(PaymentMethod.CHECK);
    });

    it('should throw error for invalid payment method', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: 'INVALID_METHOD' as PaymentMethod,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };

      // Act & Assert
      expect(() => {
        Payment.create(command);
      }).toThrow(InvalidPaymentMethodException);
    });
  });

  describe('Mobile Wallet Payment', () => {
    it('should create mobile wallet payment with bKash', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(5000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.BKASH,
        mobileNumber: '01712345678',
        walletTransactionId: 'BKASH-TXN-001',
        merchantCode: 'MERCHANT-001',
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.PROCESSING);
      const mobileWallet = payment.getMobileWallet();
      expect(mobileWallet).toBeDefined();
      expect(mobileWallet?.provider).toBe(MobileWalletProvider.BKASH);
      expect(mobileWallet?.mobileNumber).toBe('01712345678');
      expect(mobileWallet?.transactionId).toBe('BKASH-TXN-001');
      expect(mobileWallet?.merchantCode).toBe('MERCHANT-001');

      // Verify events
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);
      expect(events[1]).toBeInstanceOf(MobileWalletPaymentInitiatedEvent);
    });

    it('should create mobile wallet payment with Nagad', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(3000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.NAGAD,
        mobileNumber: '01812345678',
        walletTransactionId: 'NAGAD-TXN-001',
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      const mobileWallet = payment.getMobileWallet();
      expect(mobileWallet?.provider).toBe(MobileWalletProvider.NAGAD);
    });

    it('should create mobile wallet payment with Rocket', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(2000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.ROCKET,
        mobileNumber: '01912345678',
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      const mobileWallet = payment.getMobileWallet();
      expect(mobileWallet?.provider).toBe(MobileWalletProvider.ROCKET);
    });

    it('should support all Bangladesh mobile wallet providers', () => {
      // Test all 7 providers
      const providers = [
        MobileWalletProvider.BKASH,
        MobileWalletProvider.NAGAD,
        MobileWalletProvider.ROCKET,
        MobileWalletProvider.UPAY,
        MobileWalletProvider.SURECASH,
        MobileWalletProvider.MCASH,
        MobileWalletProvider.TCASH,
      ];

      providers.forEach((provider, index) => {
        const command: CreatePaymentCommand = {
          invoiceId: new InvoiceId('invoice-123'),
          amount: Money.create(1000, 'BDT'),
          paymentMethod: PaymentMethod.MOBILE_WALLET,
          paymentDate: new Date('2024-10-15'),
          tenantId: new TenantId('tenant-789'),
          walletProvider: provider,
          mobileNumber: `0171234567${index}`,
        };

        const payment = Payment.create(command);
        const wallet = payment.getMobileWallet();

        expect(wallet?.provider).toBe(provider);
      });
    });

    it('should validate Bangladesh mobile number format (01XXXXXXXXX)', () => {
      // Valid formats: 013-019 followed by 8 digits
      const validNumbers = [
        '01312345678', // Grameenphone
        '01712345678', // Grameenphone
        '01812345678', // Robi
        '01912345678', // Banglalink
        '01412345678', // Banglalink
        '01612345678', // Airtel
        '01512345678', // Teletalk
      ];

      validNumbers.forEach(mobileNumber => {
        const command: CreatePaymentCommand = {
          invoiceId: new InvoiceId('invoice-123'),
          amount: Money.create(1000, 'BDT'),
          paymentMethod: PaymentMethod.MOBILE_WALLET,
          paymentDate: new Date('2024-10-15'),
          tenantId: new TenantId('tenant-789'),
          walletProvider: MobileWalletProvider.BKASH,
          mobileNumber,
        };

        expect(() => Payment.create(command)).not.toThrow();
      });
    });

    it('should validate Bangladesh mobile number with country code', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(1000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.BKASH,
        mobileNumber: '+8801712345678',
      };

      // Act & Assert
      expect(() => Payment.create(command)).not.toThrow();
    });

    it('should throw error for invalid mobile number format', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(1000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.BKASH,
        mobileNumber: '0123456789', // Invalid: starts with 012
      };

      // Act & Assert
      expect(() => {
        Payment.create(command);
      }).toThrow(InvalidMobileNumberException);
    });

    it('should throw error for missing wallet provider', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(1000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        mobileNumber: '01712345678',
        // Missing walletProvider
      };

      // Act & Assert
      expect(() => {
        Payment.create(command);
      }).toThrow('Mobile wallet provider and number are required');
    });

    it('should auto-generate transaction ID if not provided', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(1000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.BKASH,
        mobileNumber: '01712345678',
        // No walletTransactionId provided
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      const wallet = payment.getMobileWallet();
      expect(wallet?.transactionId).toBeDefined();
      expect(wallet?.transactionId).toMatch(/^TXN-\d+-[a-z0-9]+$/);
    });
  });

  describe('Payment Completion', () => {
    let payment: Payment;

    beforeEach(() => {
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };
      payment = Payment.create(command);
      payment.clearEvents();
    });

    it('should complete payment in PENDING status', () => {
      // Arrange
      const transactionRef = 'TXN-BANK-001';

      // Act
      payment.complete(transactionRef);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.COMPLETED);
      expect(payment.getTransactionReference()).toBe('TXN-BANK-001');

      // Verify event
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentCompletedEvent);

      const completedEvent = events[0] as PaymentCompletedEvent;
      expect(completedEvent.transactionReference).toBe('TXN-BANK-001');
    });

    it('should complete payment in PROCESSING status', () => {
      // Arrange - Create mobile wallet payment (starts in PROCESSING)
      const walletCommand: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(5000, 'BDT'),
        paymentMethod: PaymentMethod.MOBILE_WALLET,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        walletProvider: MobileWalletProvider.BKASH,
        mobileNumber: '01712345678',
      };
      const walletPayment = Payment.create(walletCommand);
      walletPayment.clearEvents();

      // Act
      walletPayment.complete('BKASH-TXN-COMPLETE-001');

      // Assert
      expect(walletPayment.getStatus()).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw error when completing already completed payment', () => {
      // Arrange
      payment.complete('TXN-001');
      payment.clearEvents();

      // Act & Assert
      expect(() => {
        payment.complete('TXN-002');
      }).toThrow(PaymentAlreadyCompletedException);
    });

    it('should throw error when completing failed payment', () => {
      // Arrange
      payment.fail('Insufficient funds');
      payment.clearEvents();

      // Act & Assert
      expect(() => {
        payment.complete('TXN-001');
      }).toThrow('Cannot complete payment in FAILED status');
    });

    it('should include completion timestamp in event', () => {
      // Arrange
      const beforeCompletion = new Date();

      // Act
      payment.complete('TXN-001');

      // Assert
      const events = payment.getUncommittedEvents();
      const completedEvent = events[0] as PaymentCompletedEvent;
      const afterCompletion = new Date();

      expect(completedEvent.completedAt).toBeDefined();
      expect(completedEvent.completedAt.getTime()).toBeGreaterThanOrEqual(beforeCompletion.getTime());
      expect(completedEvent.completedAt.getTime()).toBeLessThanOrEqual(afterCompletion.getTime());
    });
  });

  describe('Payment Failure', () => {
    let payment: Payment;

    beforeEach(() => {
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };
      payment = Payment.create(command);
      payment.clearEvents();
    });

    it('should mark payment as failed with reason', () => {
      // Arrange
      const reason = 'Insufficient funds';

      // Act
      payment.fail(reason);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.FAILED);

      // Verify event
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentFailedEvent);

      const failedEvent = events[0] as PaymentFailedEvent;
      expect(failedEvent.reason).toBe('Insufficient funds');
    });

    it('should fail payment with various reasons', () => {
      const reasons = [
        'Insufficient funds',
        'Invalid account',
        'Transaction timeout',
        'Bank system error',
        'User cancelled',
      ];

      reasons.forEach(reason => {
        const command: CreatePaymentCommand = {
          invoiceId: new InvoiceId('invoice-123'),
          amount: Money.create(1000, 'BDT'),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentDate: new Date('2024-10-15'),
          tenantId: new TenantId('tenant-789'),
        };
        const testPayment = Payment.create(command);
        testPayment.clearEvents();

        testPayment.fail(reason);

        const events = testPayment.getUncommittedEvents();
        const failedEvent = events[0] as PaymentFailedEvent;
        expect(failedEvent.reason).toBe(reason);
      });
    });

    it('should throw error when failing completed payment', () => {
      // Arrange
      payment.complete('TXN-001');
      payment.clearEvents();

      // Act & Assert
      expect(() => {
        payment.fail('Too late');
      }).toThrow('Cannot fail payment in COMPLETED status');
    });

    it('should include failure timestamp in event', () => {
      // Arrange
      const beforeFailure = new Date();

      // Act
      payment.fail('Test failure');

      // Assert
      const events = payment.getUncommittedEvents();
      const failedEvent = events[0] as PaymentFailedEvent;
      const afterFailure = new Date();

      expect(failedEvent.failedAt).toBeDefined();
      expect(failedEvent.failedAt.getTime()).toBeGreaterThanOrEqual(beforeFailure.getTime());
      expect(failedEvent.failedAt.getTime()).toBeLessThanOrEqual(afterFailure.getTime());
    });
  });

  describe('Bank Reconciliation', () => {
    let payment: Payment;
    let bankStatement: BankStatement;

    beforeEach(() => {
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        reference: 'REF-001',
        tenantId: new TenantId('tenant-789'),
      };
      payment = Payment.create(command);
      payment.complete('TXN-001');
      payment.clearEvents();

      bankStatement = {
        bankAccountId: 'bank-account-123',
        transactions: [
          {
            transactionId: 'BANK-TXN-001',
            date: new Date('2024-10-15'),
            description: 'Payment received',
            reference: 'REF-001',
            amount: Money.create(10000, 'BDT'),
            type: 'CREDIT',
            balance: Money.create(50000, 'BDT'),
          },
        ],
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-31'),
        openingBalance: Money.create(40000, 'BDT'),
        closingBalance: Money.create(50000, 'BDT'),
      };
    });

    it('should reconcile payment with matching bank transaction', () => {
      // Arrange
      const reconciledBy = new UserId('user-123');

      // Act
      payment.reconcile(bankStatement, reconciledBy);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.RECONCILED);
      expect(payment.isReconciled()).toBe(true);

      // Verify event
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentReconciledEvent);

      const reconciledEvent = events[0] as PaymentReconciledEvent;
      expect(reconciledEvent.bankTransactionId).toBe('BANK-TXN-001');
      expect(reconciledEvent.reconciledBy.value).toBe('user-123');
    });

    it('should match transaction by amount and date', () => {
      // Arrange
      bankStatement.transactions[0].reference = 'DIFFERENT-REF';
      const reconciledBy = new UserId('user-123');

      // Act
      payment.reconcile(bankStatement, reconciledBy);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.RECONCILED);
    });

    it('should match transaction within 3-day window', () => {
      // Arrange - Transaction 2 days after payment
      bankStatement.transactions[0].date = new Date('2024-10-17');
      const reconciledBy = new UserId('user-123');

      // Act
      payment.reconcile(bankStatement, reconciledBy);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.RECONCILED);
    });

    it('should match transaction by reference when multiple amount matches', () => {
      // Arrange - Add multiple transactions with same amount
      bankStatement.transactions.push({
        transactionId: 'BANK-TXN-002',
        date: new Date('2024-10-15'),
        description: 'Another payment',
        reference: 'DIFFERENT-REF',
        amount: Money.create(10000, 'BDT'),
        type: 'CREDIT',
        balance: Money.create(60000, 'BDT'),
      });

      const reconciledBy = new UserId('user-123');

      // Act
      payment.reconcile(bankStatement, reconciledBy);

      // Assert
      // Should match first transaction by reference
      const events = payment.getUncommittedEvents();
      const reconciledEvent = events[0] as PaymentReconciledEvent;
      expect(reconciledEvent.bankTransactionId).toBe('BANK-TXN-001');
    });

    it('should throw error when no matching transaction found', () => {
      // Arrange - Different amount
      bankStatement.transactions[0].amount = Money.create(5000, 'BDT');
      const reconciledBy = new UserId('user-123');

      // Act & Assert
      expect(() => {
        payment.reconcile(bankStatement, reconciledBy);
      }).toThrow(NoMatchingTransactionException);
    });

    it('should throw error when reconciling already reconciled payment', () => {
      // Arrange
      const reconciledBy = new UserId('user-123');
      payment.reconcile(bankStatement, reconciledBy);
      payment.clearEvents();

      // Act & Assert
      expect(() => {
        payment.reconcile(bankStatement, new UserId('user-456'));
      }).toThrow(PaymentAlreadyReconciledException);
    });

    it('should throw error when reconciling non-completed payment', () => {
      // Arrange - Create new pending payment
      const pendingPayment = Payment.create({
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      });
      const reconciledBy = new UserId('user-123');

      // Act & Assert
      expect(() => {
        pendingPayment.reconcile(bankStatement, reconciledBy);
      }).toThrow('Cannot reconcile payment in PENDING status');
    });

    it('should include reconciliation timestamp in event', () => {
      // Arrange
      const reconciledBy = new UserId('user-123');
      const beforeReconciliation = new Date();

      // Act
      payment.reconcile(bankStatement, reconciledBy);

      // Assert
      const events = payment.getUncommittedEvents();
      const reconciledEvent = events[0] as PaymentReconciledEvent;
      const afterReconciliation = new Date();

      expect(reconciledEvent.reconciledAt).toBeDefined();
      expect(reconciledEvent.reconciledAt.getTime()).toBeGreaterThanOrEqual(beforeReconciliation.getTime());
      expect(reconciledEvent.reconciledAt.getTime()).toBeLessThanOrEqual(afterReconciliation.getTime());
    });
  });

  describe('Payment Reversal', () => {
    let payment: Payment;

    beforeEach(() => {
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };
      payment = Payment.create(command);
      payment.complete('TXN-001');
      payment.clearEvents();
    });

    it('should reverse completed payment', () => {
      // Arrange
      const reversedBy = new UserId('user-123');
      const reason = 'Customer request for refund';

      // Act
      payment.reverse(reversedBy, reason);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.REVERSED);

      // Verify event
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentReversedEvent);

      const reversedEvent = events[0] as PaymentReversedEvent;
      expect(reversedEvent.reversedBy.value).toBe('user-123');
      expect(reversedEvent.reason).toBe('Customer request for refund');
    });

    it('should reverse reconciled payment', () => {
      // Arrange
      const bankStatement: BankStatement = {
        bankAccountId: 'bank-account-123',
        transactions: [
          {
            transactionId: 'BANK-TXN-001',
            date: new Date('2024-10-15'),
            description: 'Payment',
            reference: 'REF-001',
            amount: Money.create(10000, 'BDT'),
            type: 'CREDIT',
            balance: Money.create(50000, 'BDT'),
          },
        ],
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-10-31'),
        openingBalance: Money.create(40000, 'BDT'),
        closingBalance: Money.create(50000, 'BDT'),
      };

      payment.reconcile(bankStatement, new UserId('reconciler-123'));
      payment.clearEvents();

      const reversedBy = new UserId('user-456');
      const reason = 'Incorrect payment';

      // Act
      payment.reverse(reversedBy, reason);

      // Assert
      expect(payment.getStatus()).toBe(PaymentStatus.REVERSED);
    });

    it('should reverse payment with various reasons', () => {
      const reasons = [
        'Customer request for refund',
        'Duplicate payment',
        'Incorrect amount',
        'Wrong invoice',
        'Chargeback from bank',
      ];

      reasons.forEach(reason => {
        const command: CreatePaymentCommand = {
          invoiceId: new InvoiceId('invoice-123'),
          amount: Money.create(1000, 'BDT'),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentDate: new Date('2024-10-15'),
          tenantId: new TenantId('tenant-789'),
        };
        const testPayment = Payment.create(command);
        testPayment.complete('TXN-001');
        testPayment.clearEvents();

        testPayment.reverse(new UserId('user-123'), reason);

        const events = testPayment.getUncommittedEvents();
        const reversedEvent = events[0] as PaymentReversedEvent;
        expect(reversedEvent.reason).toBe(reason);
      });
    });

    it('should throw error when reversing pending payment', () => {
      // Arrange
      const pendingPayment = Payment.create({
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      });

      // Act & Assert
      expect(() => {
        pendingPayment.reverse(new UserId('user-123'), 'Cannot reverse');
      }).toThrow('Cannot reverse payment in PENDING status');
    });

    it('should throw error when reversing failed payment', () => {
      // Arrange
      payment.fail('Payment failed');
      payment.clearEvents();

      // Act & Assert
      expect(() => {
        payment.reverse(new UserId('user-123'), 'Cannot reverse');
      }).toThrow('Cannot reverse payment in FAILED status');
    });

    it('should include reversal timestamp in event', () => {
      // Arrange
      const reversedBy = new UserId('user-123');
      const reason = 'Test reversal';
      const beforeReversal = new Date();

      // Act
      payment.reverse(reversedBy, reason);

      // Assert
      const events = payment.getUncommittedEvents();
      const reversedEvent = events[0] as PaymentReversedEvent;
      const afterReversal = new Date();

      expect(reversedEvent.reversedAt).toBeDefined();
      expect(reversedEvent.reversedAt.getTime()).toBeGreaterThanOrEqual(beforeReversal.getTime());
      expect(reversedEvent.reversedAt.getTime()).toBeLessThanOrEqual(afterReversal.getTime());
    });
  });

  describe('Event Sourcing', () => {
    it('should track uncommitted events', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      const events = payment.getUncommittedEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };
      const payment = Payment.create(command);

      // Act
      payment.markEventsAsCommitted();

      // Assert
      expect(payment.getUncommittedEvents()).toHaveLength(0);
    });

    it('should reconstruct from history', () => {
      // Arrange
      const paymentId = PaymentId.generate();
      const events = [
        new PaymentCreatedEvent(
          paymentId,
          'PMT-2024-10-15-000001',
          new InvoiceId('invoice-123'),
          Money.create(10000, 'BDT'),
          PaymentMethod.BANK_TRANSFER,
          new Date('2024-10-15'),
          'REF-001',
          'tenant-789'
        ),
      ];

      // Act
      const payment = new Payment();
      payment.loadFromHistory(events);

      // Assert
      expect(payment.getId().value).toBe(paymentId.value);
      expect(payment.getStatus()).toBe(PaymentStatus.PENDING);
      expect(payment.getAmount().getAmount()).toBe(10000);
      expect(payment.version).toBe(1);
    });

    it('should increment version for each event', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };
      const payment = Payment.create(command);
      const initialVersion = payment.version;
      payment.clearEvents();

      // Act
      payment.complete('TXN-001');

      // Assert
      expect(payment.version).toBeGreaterThan(initialVersion);
    });
  });

  describe('Multi-Tenancy', () => {
    it('should include tenant ID in all events', () => {
      // Arrange
      const tenantId = 'tenant-special-456';
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(10000, 'BDT'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId(tenantId),
      };

      // Act
      const payment = Payment.create(command);
      payment.complete('TXN-001');
      payment.fail('Test failure');

      // Assert
      const events = payment.getUncommittedEvents();
      events.forEach(event => {
        expect(event.tenantId).toBe(tenantId);
      });
    });
  });

  describe('Payment Methods', () => {
    it('should support all payment methods', () => {
      const methods = [
        PaymentMethod.CASH,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.CHECK,
        PaymentMethod.MOBILE_WALLET,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.ONLINE_BANKING,
      ];

      methods.forEach(method => {
        const command: CreatePaymentCommand = {
          invoiceId: new InvoiceId('invoice-123'),
          amount: Money.create(1000, 'BDT'),
          paymentMethod: method,
          paymentDate: new Date('2024-10-15'),
          tenantId: new TenantId('tenant-789'),
          // Add mobile wallet details if needed
          ...(method === PaymentMethod.MOBILE_WALLET && {
            walletProvider: MobileWalletProvider.BKASH,
            mobileNumber: '01712345678',
          }),
        };

        const payment = Payment.create(command);
        expect(payment.getPaymentMethod()).toBe(method);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount payment', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(0, 'BDT'),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment.getAmount().getAmount()).toBe(0);
    });

    it('should handle very large payment amounts', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(100000000, 'BDT'), // 100 million
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
      };

      // Act
      const payment = Payment.create(command);

      // Assert
      expect(payment.getAmount().getAmount()).toBe(100000000);
    });

    it('should handle empty reference', () => {
      // Arrange
      const command: CreatePaymentCommand = {
        invoiceId: new InvoiceId('invoice-123'),
        amount: Money.create(1000, 'BDT'),
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date('2024-10-15'),
        tenantId: new TenantId('tenant-789'),
        // No reference provided
      };

      // Act
      const payment = Payment.create(command);

      // Assert - Should create successfully
      expect(payment).toBeDefined();
    });
  });
});
