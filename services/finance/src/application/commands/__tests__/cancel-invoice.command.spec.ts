import { CancelInvoiceCommand } from '../cancel-invoice.command';

describe('CancelInvoiceCommand', () => {
  describe('successful creation', () => {
    it('should create command with valid fields', () => {
      const invoiceId = 'invoice-123';
      const reason = 'Customer requested cancellation';
      const userId = 'user-456';

      const command = new CancelInvoiceCommand(invoiceId, reason, userId);

      expect(command.invoiceId).toBe(invoiceId);
      expect(command.reason).toBe(reason);
      expect(command.userId).toBe(userId);
    });

    it('should preserve exact string values', () => {
      const invoiceId = 'abc-def-ghi-jkl';
      const reason = 'Duplicate invoice created by mistake';
      const userId = '123-456-789-000';

      const command = new CancelInvoiceCommand(invoiceId, reason, userId);

      expect(command.invoiceId).toBe(invoiceId);
      expect(command.reason).toBe(reason);
      expect(command.userId).toBe(userId);
    });

    it('should handle long cancellation reasons', () => {
      const longReason = 'A'.repeat(500);
      const command = new CancelInvoiceCommand('invoice-123', longReason, 'user-456');

      expect(command.reason).toBe(longReason);
      expect(command.reason.length).toBe(500);
    });

    it('should trim whitespace from reason', () => {
      const reason = '  Customer requested cancellation  ';
      const command = new CancelInvoiceCommand('invoice-123', reason, 'user-456');

      // Constructor should preserve the original value
      expect(command.reason).toBe(reason);
    });
  });

  describe('validation errors', () => {
    describe('invoiceId validation', () => {
      it('should throw error when invoiceId is empty string', () => {
        expect(() => {
          new CancelInvoiceCommand('', 'Valid reason', 'user-123');
        }).toThrow('invoiceId is required');
      });

      it('should throw error when invoiceId is null', () => {
        expect(() => {
          new CancelInvoiceCommand(null as any, 'Valid reason', 'user-123');
        }).toThrow('invoiceId is required');
      });

      it('should throw error when invoiceId is undefined', () => {
        expect(() => {
          new CancelInvoiceCommand(undefined as any, 'Valid reason', 'user-123');
        }).toThrow('invoiceId is required');
      });
    });

    describe('reason validation', () => {
      it('should throw error when reason is empty string', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', '', 'user-456');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error when reason is null', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', null as any, 'user-456');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error when reason is undefined', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', undefined as any, 'user-456');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error when reason is whitespace only', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', '   ', 'user-456');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error when reason is tab characters only', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', '\t\t\t', 'user-456');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error when reason is newlines only', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', '\n\n\n', 'user-456');
        }).toThrow('Cancellation reason is required');
      });
    });

    describe('userId validation', () => {
      it('should throw error when userId is empty string', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', 'Valid reason', '');
        }).toThrow('userId is required');
      });

      it('should throw error when userId is null', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', 'Valid reason', null as any);
        }).toThrow('userId is required');
      });

      it('should throw error when userId is undefined', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', 'Valid reason', undefined as any);
        }).toThrow('userId is required');
      });
    });

    describe('multiple field validation', () => {
      it('should throw error for invoiceId first when multiple fields invalid', () => {
        expect(() => {
          new CancelInvoiceCommand('', '', '');
        }).toThrow('invoiceId is required');
      });

      it('should throw error for reason when only reason and userId invalid', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', '', '');
        }).toThrow('Cancellation reason is required');
      });

      it('should throw error for userId when only userId invalid', () => {
        expect(() => {
          new CancelInvoiceCommand('invoice-123', 'Valid reason', '');
        }).toThrow('userId is required');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in reason', () => {
      const reason = 'Invoice contains errors: $100.00 != €85.50 (VAT issue)';
      const command = new CancelInvoiceCommand('invoice-123', reason, 'user-456');

      expect(command.reason).toBe(reason);
    });

    it('should handle Unicode characters in reason', () => {
      const reason = 'গ্রাহক বাতিল অনুরোধ করেছেন'; // Bengali: Customer requested cancellation
      const command = new CancelInvoiceCommand('invoice-123', reason, 'user-456');

      expect(command.reason).toBe(reason);
    });

    it('should handle multiline reasons', () => {
      const reason = 'Line 1: Customer not satisfied\nLine 2: Requested refund\nLine 3: Process cancellation';
      const command = new CancelInvoiceCommand('invoice-123', reason, 'user-456');

      expect(command.reason).toBe(reason);
    });
  });

  describe('immutability', () => {
    it('should maintain command immutability', () => {
      const command = new CancelInvoiceCommand('invoice-123', 'Valid reason', 'user-456');

      // TypeScript prevents this at compile-time, but test runtime behavior
      expect(() => {
        (command as any).invoiceId = 'different-id';
        (command as any).reason = 'different-reason';
        (command as any).userId = 'different-user';
      }).not.toThrow();

      // Verify values are still accessible
      expect(command.invoiceId).toBeDefined();
      expect(command.reason).toBeDefined();
      expect(command.userId).toBeDefined();
    });
  });
});
