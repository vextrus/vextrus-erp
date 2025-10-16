import { InvoiceNumber } from '../invoice-number.value-object';

describe('InvoiceNumber Value Object', () => {
  describe('create', () => {
    it('should create a valid invoice number', () => {
      const validInvoiceNumber = 'INV-2025-10-14-000001';
      const invoiceNumber = InvoiceNumber.create(validInvoiceNumber);

      expect(invoiceNumber).toBeDefined();
      expect(invoiceNumber.value).toBe(validInvoiceNumber);
    });

    it('should trim whitespace from input', () => {
      const invoiceNumberWithSpaces = '  INV-2025-10-14-000001  ';
      const invoiceNumber = InvoiceNumber.create(invoiceNumberWithSpaces);

      expect(invoiceNumber.value).toBe('INV-2025-10-14-000001');
    });

    it('should throw error for empty string', () => {
      expect(() => InvoiceNumber.create('')).toThrow('Invoice number cannot be empty');
    });

    it('should throw error for null value', () => {
      expect(() => InvoiceNumber.create(null as any)).toThrow('Invoice number cannot be empty');
    });

    it('should throw error for undefined value', () => {
      expect(() => InvoiceNumber.create(undefined as any)).toThrow('Invoice number cannot be empty');
    });

    it('should throw error for invalid format (missing prefix)', () => {
      expect(() => InvoiceNumber.create('2025-10-14-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid format (wrong separator)', () => {
      expect(() => InvoiceNumber.create('INV_2025_10_14_000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid year format (3 digits)', () => {
      expect(() => InvoiceNumber.create('INV-202-10-14-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid month (00)', () => {
      expect(() => InvoiceNumber.create('INV-2025-00-14-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid month (13)', () => {
      expect(() => InvoiceNumber.create('INV-2025-13-14-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid day (00)', () => {
      expect(() => InvoiceNumber.create('INV-2025-10-00-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid day (32)', () => {
      expect(() => InvoiceNumber.create('INV-2025-10-32-000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid date (February 30)', () => {
      expect(() => InvoiceNumber.create('INV-2025-02-30-000001')).toThrow('contains invalid date');
    });

    it('should throw error for invalid sequence (5 digits)', () => {
      expect(() => InvoiceNumber.create('INV-2025-10-14-00001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should throw error for invalid sequence (7 digits)', () => {
      expect(() => InvoiceNumber.create('INV-2025-10-14-0000001')).toThrow('must be in format INV-YYYY-MM-DD-NNNNNN');
    });

    it('should accept valid date with single-digit month', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-01-15-000001');
      expect(invoiceNumber.value).toBe('INV-2025-01-15-000001');
    });

    it('should accept valid date with single-digit day', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-12-01-000001');
      expect(invoiceNumber.value).toBe('INV-2025-12-01-000001');
    });

    it('should accept leap year date (February 29)', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2024-02-29-000001');
      expect(invoiceNumber.value).toBe('INV-2024-02-29-000001');
    });

    it('should throw error for non-leap year February 29', () => {
      expect(() => InvoiceNumber.create('INV-2025-02-29-000001')).toThrow('contains invalid date');
    });
  });

  describe('generate', () => {
    it('should generate invoice number from date and sequence', () => {
      const date = new Date(2025, 9, 14); // October 14, 2025
      const sequence = 1;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-10-14-000001');
    });

    it('should pad sequence to 6 digits', () => {
      const date = new Date(2025, 9, 14);
      const sequence = 42;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-10-14-000042');
    });

    it('should handle maximum sequence (999999)', () => {
      const date = new Date(2025, 9, 14);
      const sequence = 999999;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-10-14-999999');
    });

    it('should handle minimum sequence (0)', () => {
      const date = new Date(2025, 9, 14);
      const sequence = 0;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-10-14-000000');
    });

    it('should throw error for negative sequence', () => {
      const date = new Date(2025, 9, 14);
      const sequence = -1;

      expect(() => InvoiceNumber.generate(date, sequence)).toThrow('Sequence number must be between 0 and 999999');
    });

    it('should throw error for sequence greater than 999999', () => {
      const date = new Date(2025, 9, 14);
      const sequence = 1000000;

      expect(() => InvoiceNumber.generate(date, sequence)).toThrow('Sequence number must be between 0 and 999999');
    });

    it('should pad month to 2 digits', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      const sequence = 1;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-01-05-000001');
    });

    it('should pad day to 2 digits', () => {
      const date = new Date(2025, 11, 3); // December 3, 2025
      const sequence = 1;

      const invoiceNumber = InvoiceNumber.generate(date, sequence);

      expect(invoiceNumber.value).toBe('INV-2025-12-03-000001');
    });
  });

  describe('isValid', () => {
    it('should return true for valid invoice number', () => {
      expect(InvoiceNumber.isValid('INV-2025-10-14-000001')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(InvoiceNumber.isValid('')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(InvoiceNumber.isValid('INVALID')).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(InvoiceNumber.isValid('INV-2025-02-30-000001')).toBe(false);
    });

    it('should return false for null value', () => {
      expect(InvoiceNumber.isValid(null as any)).toBe(false);
    });

    it('should return false for undefined value', () => {
      expect(InvoiceNumber.isValid(undefined as any)).toBe(false);
    });

    it('should return true for leap year date', () => {
      expect(InvoiceNumber.isValid('INV-2024-02-29-000001')).toBe(true);
    });

    it('should return false for non-leap year February 29', () => {
      expect(InvoiceNumber.isValid('INV-2025-02-29-000001')).toBe(false);
    });
  });

  describe('getDate', () => {
    it('should extract correct date from invoice number', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      const date = invoiceNumber.getDate();

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October is month 9 (0-indexed)
      expect(date.getDate()).toBe(14);
    });

    it('should extract date with single-digit month', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-01-05-000001');
      const date = invoiceNumber.getDate();

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January is month 0
      expect(date.getDate()).toBe(5);
    });

    it('should extract date at year boundary', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2024-12-31-000001');
      const date = invoiceNumber.getDate();

      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11); // December is month 11
      expect(date.getDate()).toBe(31);
    });
  });

  describe('getSequence', () => {
    it('should extract correct sequence from invoice number', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      const sequence = invoiceNumber.getSequence();

      expect(sequence).toBe(1);
    });

    it('should extract sequence with leading zeros removed', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000042');
      const sequence = invoiceNumber.getSequence();

      expect(sequence).toBe(42);
    });

    it('should extract zero sequence', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000000');
      const sequence = invoiceNumber.getSequence();

      expect(sequence).toBe(0);
    });

    it('should extract maximum sequence', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-999999');
      const sequence = invoiceNumber.getSequence();

      expect(sequence).toBe(999999);
    });
  });

  describe('toString', () => {
    it('should return the invoice number value', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      expect(invoiceNumber.toString()).toBe('INV-2025-10-14-000001');
    });
  });

  describe('format', () => {
    it('should return the invoice number in proper format', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      expect(invoiceNumber.format()).toBe('INV-2025-10-14-000001');
    });
  });

  describe('equals', () => {
    it('should return true for equal invoice numbers', () => {
      const invoiceNumber1 = InvoiceNumber.create('INV-2025-10-14-000001');
      const invoiceNumber2 = InvoiceNumber.create('INV-2025-10-14-000001');

      expect(invoiceNumber1.equals(invoiceNumber2)).toBe(true);
    });

    it('should return false for different invoice numbers', () => {
      const invoiceNumber1 = InvoiceNumber.create('INV-2025-10-14-000001');
      const invoiceNumber2 = InvoiceNumber.create('INV-2025-10-14-000002');

      expect(invoiceNumber1.equals(invoiceNumber2)).toBe(false);
    });

    it('should return false when compared to null', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');

      expect(invoiceNumber.equals(null as any)).toBe(false);
    });

    it('should return false when compared to undefined', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');

      expect(invoiceNumber.equals(undefined as any)).toBe(false);
    });
  });

  describe('value getter', () => {
    it('should return the invoice number value', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      expect(invoiceNumber.value).toBe('INV-2025-10-14-000001');
    });

    it('should be immutable (cannot be changed)', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');

      // Attempt to modify (should not work due to readonly)
      expect(() => {
        (invoiceNumber as any).value = 'INV-2025-10-14-999999';
      }).toThrow();
    });
  });

  describe('Bangladesh-specific format', () => {
    it('should follow Bangladesh invoice numbering requirements', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');

      // Should have INV prefix
      expect(invoiceNumber.value).toMatch(/^INV-/);

      // Should be chronologically sortable
      expect(invoiceNumber.value).toMatch(/INV-\d{4}-\d{2}-\d{2}-\d{6}/);
    });

    it('should support date-based filtering', () => {
      const invoiceNumber = InvoiceNumber.create('INV-2025-10-14-000001');
      const date = invoiceNumber.getDate();

      // Date should be extractable for filtering
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October
    });

    it('should support sequence-based ordering', () => {
      const invoiceNumbers = [
        InvoiceNumber.create('INV-2025-10-14-000003'),
        InvoiceNumber.create('INV-2025-10-14-000001'),
        InvoiceNumber.create('INV-2025-10-14-000002'),
      ];

      const sorted = invoiceNumbers.sort((a, b) =>
        a.getSequence() - b.getSequence()
      );

      expect(sorted[0].getSequence()).toBe(1);
      expect(sorted[1].getSequence()).toBe(2);
      expect(sorted[2].getSequence()).toBe(3);
    });
  });
});
