import { CreateInvoiceCommand } from '../create-invoice.command';
import { LineItemDto } from '../../../domain/aggregates/invoice/invoice.aggregate';
import { Money } from '../../../domain/value-objects/money.value-object';

describe('CreateInvoiceCommand', () => {
  const validLineItem: LineItemDto = {
    description: 'Test Item',
    quantity: 2,
    unitPrice: Money.create(1000, 'BDT'),
  };

  const validCommandParams = {
    customerId: 'customer-123',
    vendorId: 'vendor-456',
    invoiceDate: new Date('2025-01-15'),
    dueDate: new Date('2025-02-15'),
    lineItems: [validLineItem],
    tenantId: 'tenant-789',
    userId: 'user-101',
  };

  describe('successful creation', () => {
    it('should create command with valid required fields', () => {
      const command = new CreateInvoiceCommand(
        validCommandParams.customerId,
        validCommandParams.vendorId,
        validCommandParams.invoiceDate,
        validCommandParams.dueDate,
        validCommandParams.lineItems,
        validCommandParams.tenantId,
        validCommandParams.userId,
      );

      expect(command.customerId).toBe(validCommandParams.customerId);
      expect(command.vendorId).toBe(validCommandParams.vendorId);
      expect(command.invoiceDate).toBe(validCommandParams.invoiceDate);
      expect(command.dueDate).toBe(validCommandParams.dueDate);
      expect(command.lineItems).toBe(validCommandParams.lineItems);
      expect(command.tenantId).toBe(validCommandParams.tenantId);
      expect(command.userId).toBe(validCommandParams.userId);
    });

    it('should create command with optional TIN/BIN fields', () => {
      const command = new CreateInvoiceCommand(
        validCommandParams.customerId,
        validCommandParams.vendorId,
        validCommandParams.invoiceDate,
        validCommandParams.dueDate,
        validCommandParams.lineItems,
        validCommandParams.tenantId,
        validCommandParams.userId,
        '1234567890', // vendorTIN
        '123456789', // vendorBIN
        '0987654321', // customerTIN
        '987654321', // customerBIN
      );

      expect(command.vendorTIN).toBe('1234567890');
      expect(command.vendorBIN).toBe('123456789');
      expect(command.customerTIN).toBe('0987654321');
      expect(command.customerBIN).toBe('987654321');
    });

    it('should allow undefined optional fields', () => {
      const command = new CreateInvoiceCommand(
        validCommandParams.customerId,
        validCommandParams.vendorId,
        validCommandParams.invoiceDate,
        validCommandParams.dueDate,
        validCommandParams.lineItems,
        validCommandParams.tenantId,
        validCommandParams.userId,
      );

      expect(command.vendorTIN).toBeUndefined();
      expect(command.vendorBIN).toBeUndefined();
      expect(command.customerTIN).toBeUndefined();
      expect(command.customerBIN).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    describe('customerId validation', () => {
      it('should throw error when customerId is empty string', () => {
        expect(() => {
          new CreateInvoiceCommand(
            '',
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('customerId is required');
      });

      it('should throw error when customerId is null', () => {
        expect(() => {
          new CreateInvoiceCommand(
            null as any,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('customerId is required');
      });

      it('should throw error when customerId is undefined', () => {
        expect(() => {
          new CreateInvoiceCommand(
            undefined as any,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('customerId is required');
      });
    });

    describe('vendorId validation', () => {
      it('should throw error when vendorId is empty string', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            '',
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('vendorId is required');
      });

      it('should throw error when vendorId is null', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            null as any,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('vendorId is required');
      });
    });

    describe('tenantId validation', () => {
      it('should throw error when tenantId is empty string', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            '',
            validCommandParams.userId,
          );
        }).toThrow('tenantId is required');
      });
    });

    describe('userId validation', () => {
      it('should throw error when userId is empty string', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            '',
          );
        }).toThrow('userId is required');
      });
    });

    describe('date validation', () => {
      it('should throw error when invoiceDate is null', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            null as any,
            validCommandParams.dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('invoiceDate is required');
      });

      it('should throw error when dueDate is null', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            null as any,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('dueDate is required');
      });

      it('should throw error when dueDate is before invoiceDate', () => {
        const invoiceDate = new Date('2025-02-15');
        const dueDate = new Date('2025-01-15');

        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            invoiceDate,
            dueDate,
            validCommandParams.lineItems,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('Due date cannot be before invoice date');
      });

      it('should allow dueDate equal to invoiceDate', () => {
        const date = new Date('2025-01-15');

        const command = new CreateInvoiceCommand(
          validCommandParams.customerId,
          validCommandParams.vendorId,
          date,
          date,
          validCommandParams.lineItems,
          validCommandParams.tenantId,
          validCommandParams.userId,
        );

        expect(command.invoiceDate).toBe(date);
        expect(command.dueDate).toBe(date);
      });
    });

    describe('lineItems validation', () => {
      it('should throw error when lineItems is null', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            null as any,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('At least one line item is required');
      });

      it('should throw error when lineItems is undefined', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            undefined as any,
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('At least one line item is required');
      });

      it('should throw error when lineItems is empty array', () => {
        expect(() => {
          new CreateInvoiceCommand(
            validCommandParams.customerId,
            validCommandParams.vendorId,
            validCommandParams.invoiceDate,
            validCommandParams.dueDate,
            [],
            validCommandParams.tenantId,
            validCommandParams.userId,
          );
        }).toThrow('At least one line item is required');
      });

      it('should allow multiple line items', () => {
        const multipleItems: LineItemDto[] = [
          validLineItem,
          {
            description: 'Second Item',
            quantity: 1,
            unitPrice: Money.create(500, 'BDT'),
          },
        ];

        const command = new CreateInvoiceCommand(
          validCommandParams.customerId,
          validCommandParams.vendorId,
          validCommandParams.invoiceDate,
          validCommandParams.dueDate,
          multipleItems,
          validCommandParams.tenantId,
          validCommandParams.userId,
        );

        expect(command.lineItems).toHaveLength(2);
        expect(command.lineItems).toBe(multipleItems);
      });
    });
  });
});
