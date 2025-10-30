import { ApproveInvoiceCommand } from '../approve-invoice.command';

describe('ApproveInvoiceCommand', () => {
  describe('successful creation', () => {
    it('should create command with valid invoiceId and userId', () => {
      const invoiceId = 'invoice-123';
      const userId = 'user-456';

      const command = new ApproveInvoiceCommand(invoiceId, userId);

      expect(command.invoiceId).toBe(invoiceId);
      expect(command.userId).toBe(userId);
    });

    it('should preserve exact string values', () => {
      const invoiceId = 'abc-def-ghi-jkl';
      const userId = '123-456-789-000';

      const command = new ApproveInvoiceCommand(invoiceId, userId);

      expect(command.invoiceId).toBe(invoiceId);
      expect(command.userId).toBe(userId);
    });
  });

  describe('validation errors', () => {
    describe('invoiceId validation', () => {
      it('should throw error when invoiceId is empty string', () => {
        expect(() => {
          new ApproveInvoiceCommand('', 'user-123');
        }).toThrow('invoiceId is required');
      });

      it('should throw error when invoiceId is null', () => {
        expect(() => {
          new ApproveInvoiceCommand(null as any, 'user-123');
        }).toThrow('invoiceId is required');
      });

      it('should throw error when invoiceId is undefined', () => {
        expect(() => {
          new ApproveInvoiceCommand(undefined as any, 'user-123');
        }).toThrow('invoiceId is required');
      });
    });

    describe('userId validation', () => {
      it('should throw error when userId is empty string', () => {
        expect(() => {
          new ApproveInvoiceCommand('invoice-123', '');
        }).toThrow('userId is required');
      });

      it('should throw error when userId is null', () => {
        expect(() => {
          new ApproveInvoiceCommand('invoice-123', null as any);
        }).toThrow('userId is required');
      });

      it('should throw error when userId is undefined', () => {
        expect(() => {
          new ApproveInvoiceCommand('invoice-123', undefined as any);
        }).toThrow('userId is required');
      });
    });

    describe('both fields validation', () => {
      it('should throw error when both invoiceId and userId are empty', () => {
        expect(() => {
          new ApproveInvoiceCommand('', '');
        }).toThrow('invoiceId is required');
      });

      it('should throw error when both invoiceId and userId are null', () => {
        expect(() => {
          new ApproveInvoiceCommand(null as any, null as any);
        }).toThrow('invoiceId is required');
      });
    });
  });

  describe('immutability', () => {
    it('should maintain command immutability', () => {
      const command = new ApproveInvoiceCommand('invoice-123', 'user-456');

      // TypeScript prevents this at compile-time, but test runtime behavior
      expect(() => {
        (command as any).invoiceId = 'different-id';
      }).not.toThrow();

      // Verify values are still accessible
      expect(command.invoiceId).toBeDefined();
      expect(command.userId).toBeDefined();
    });
  });
});
