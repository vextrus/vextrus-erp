import { BIN } from '../bin.value-object';

describe('BIN Value Object', () => {
  describe('create', () => {
    it('should create a valid BIN with 9 digits', () => {
      const validBIN = '123456789';
      const bin = BIN.create(validBIN);

      expect(bin).toBeDefined();
      expect(bin.value).toBe(validBIN);
    });

    it('should trim whitespace from input', () => {
      const binWithSpaces = '  123456789  ';
      const bin = BIN.create(binWithSpaces);

      expect(bin.value).toBe('123456789');
    });

    it('should throw error for empty string', () => {
      expect(() => BIN.create('')).toThrow('BIN cannot be empty');
    });

    it('should throw error for null value', () => {
      expect(() => BIN.create(null as any)).toThrow('BIN cannot be empty');
    });

    it('should throw error for undefined value', () => {
      expect(() => BIN.create(undefined as any)).toThrow('BIN cannot be empty');
    });

    it('should throw error for BIN with less than 9 digits', () => {
      expect(() => BIN.create('12345678')).toThrow('BIN must be exactly 9 digits');
    });

    it('should throw error for BIN with more than 9 digits', () => {
      expect(() => BIN.create('1234567890')).toThrow('BIN must be exactly 9 digits');
    });

    it('should throw error for BIN with non-numeric characters', () => {
      expect(() => BIN.create('12345ABCD')).toThrow('BIN must contain only numeric digits');
    });

    it('should throw error for BIN with special characters', () => {
      expect(() => BIN.create('1234-5678')).toThrow('BIN must contain only numeric digits');
    });

    it('should throw error for BIN with spaces in the middle', () => {
      expect(() => BIN.create('1234 5678')).toThrow('BIN must contain only numeric digits');
    });

    it('should throw error for BIN with alphabetic characters', () => {
      expect(() => BIN.create('abcdefghi')).toThrow('BIN must contain only numeric digits');
    });
  });

  describe('isValid', () => {
    it('should return true for valid 9-digit BIN', () => {
      expect(BIN.isValid('123456789')).toBe(true);
    });

    it('should return true for valid BIN with leading zeros', () => {
      expect(BIN.isValid('000000001')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(BIN.isValid('')).toBe(false);
    });

    it('should return false for BIN with 8 digits', () => {
      expect(BIN.isValid('12345678')).toBe(false);
    });

    it('should return false for BIN with 10 digits', () => {
      expect(BIN.isValid('1234567890')).toBe(false);
    });

    it('should return false for BIN with non-numeric characters', () => {
      expect(BIN.isValid('12345678A')).toBe(false);
    });

    it('should return false for null value', () => {
      expect(BIN.isValid(null as any)).toBe(false);
    });

    it('should return false for undefined value', () => {
      expect(BIN.isValid(undefined as any)).toBe(false);
    });
  });

  describe('format', () => {
    it('should format BIN as XXX-XXX-XXX', () => {
      const bin = BIN.create('123456789');
      expect(bin.format()).toBe('123-456-789');
    });

    it('should format BIN with leading zeros correctly', () => {
      const bin = BIN.create('000000001');
      expect(bin.format()).toBe('000-000-001');
    });

    it('should format BIN with all same digits correctly', () => {
      const bin = BIN.create('999999999');
      expect(bin.format()).toBe('999-999-999');
    });
  });

  describe('toString', () => {
    it('should return the raw BIN value', () => {
      const bin = BIN.create('123456789');
      expect(bin.toString()).toBe('123456789');
    });

    it('should return unformatted BIN', () => {
      const bin = BIN.create('987654321');
      const result = bin.toString();

      expect(result).not.toContain('-');
      expect(result).toBe('987654321');
    });
  });

  describe('equals', () => {
    it('should return true for equal BINs', () => {
      const bin1 = BIN.create('123456789');
      const bin2 = BIN.create('123456789');

      expect(bin1.equals(bin2)).toBe(true);
    });

    it('should return false for different BINs', () => {
      const bin1 = BIN.create('123456789');
      const bin2 = BIN.create('987654321');

      expect(bin1.equals(bin2)).toBe(false);
    });

    it('should return false when compared to null', () => {
      const bin = BIN.create('123456789');

      expect(bin.equals(null as any)).toBe(false);
    });

    it('should return false when compared to undefined', () => {
      const bin = BIN.create('123456789');

      expect(bin.equals(undefined as any)).toBe(false);
    });

    it('should handle BINs created with trimmed input', () => {
      const bin1 = BIN.create('  123456789  ');
      const bin2 = BIN.create('123456789');

      expect(bin1.equals(bin2)).toBe(true);
    });
  });

  describe('value getter', () => {
    it('should return the BIN value', () => {
      const bin = BIN.create('123456789');
      expect(bin.value).toBe('123456789');
    });

    it('should be immutable (cannot be changed)', () => {
      const bin = BIN.create('123456789');

      // Attempt to modify (should not work due to readonly)
      expect(() => {
        (bin as any).value = '999999999';
      }).toThrow();
    });
  });

  describe('Bangladesh-specific validation', () => {
    it('should accept valid Bangladesh BIN format', () => {
      // Real-world Bangladesh BIN examples (hypothetical)
      const validBINs = [
        '123456789',
        '987654321',
        '555555555',
      ];

      validBINs.forEach(binValue => {
        expect(() => BIN.create(binValue)).not.toThrow();
      });
    });

    it('should format for display in Bangladesh format', () => {
      const bin = BIN.create('123456789');
      const formatted = bin.format();

      // Format should be: XXX-XXX-XXX
      expect(formatted).toMatch(/^\d{3}-\d{3}-\d{3}$/);
    });
  });
});
