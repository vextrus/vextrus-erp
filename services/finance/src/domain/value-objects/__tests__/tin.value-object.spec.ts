import { TIN } from '../tin.value-object';

describe('TIN Value Object', () => {
  describe('create', () => {
    it('should create a valid TIN with 10 digits', () => {
      const validTIN = '1234567890';
      const tin = TIN.create(validTIN);

      expect(tin).toBeDefined();
      expect(tin.value).toBe(validTIN);
    });

    it('should trim whitespace from input', () => {
      const tinWithSpaces = '  1234567890  ';
      const tin = TIN.create(tinWithSpaces);

      expect(tin.value).toBe('1234567890');
    });

    it('should throw error for empty string', () => {
      expect(() => TIN.create('')).toThrow('TIN cannot be empty');
    });

    it('should throw error for null value', () => {
      expect(() => TIN.create(null as any)).toThrow('TIN cannot be empty');
    });

    it('should throw error for undefined value', () => {
      expect(() => TIN.create(undefined as any)).toThrow('TIN cannot be empty');
    });

    it('should throw error for TIN with less than 10 digits', () => {
      expect(() => TIN.create('123456789')).toThrow('TIN must be exactly 10 digits');
    });

    it('should throw error for TIN with more than 10 digits', () => {
      expect(() => TIN.create('12345678901')).toThrow('TIN must be exactly 10 digits');
    });

    it('should throw error for TIN with non-numeric characters', () => {
      expect(() => TIN.create('12345ABCDE')).toThrow('TIN must contain only numeric digits');
    });

    it('should throw error for TIN with special characters', () => {
      expect(() => TIN.create('1234-56789')).toThrow('TIN must contain only numeric digits');
    });

    it('should throw error for TIN with spaces in the middle', () => {
      expect(() => TIN.create('1234 56789')).toThrow('TIN must contain only numeric digits');
    });

    it('should throw error for TIN with alphabetic characters', () => {
      expect(() => TIN.create('abcdefghij')).toThrow('TIN must contain only numeric digits');
    });
  });

  describe('isValid', () => {
    it('should return true for valid 10-digit TIN', () => {
      expect(TIN.isValid('1234567890')).toBe(true);
    });

    it('should return true for valid TIN with leading zeros', () => {
      expect(TIN.isValid('0000000001')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(TIN.isValid('')).toBe(false);
    });

    it('should return false for TIN with 9 digits', () => {
      expect(TIN.isValid('123456789')).toBe(false);
    });

    it('should return false for TIN with 11 digits', () => {
      expect(TIN.isValid('12345678901')).toBe(false);
    });

    it('should return false for TIN with non-numeric characters', () => {
      expect(TIN.isValid('123456789A')).toBe(false);
    });

    it('should return false for null value', () => {
      expect(TIN.isValid(null as any)).toBe(false);
    });

    it('should return false for undefined value', () => {
      expect(TIN.isValid(undefined as any)).toBe(false);
    });
  });

  describe('format', () => {
    it('should format TIN as XXXX-XXX-XXX', () => {
      const tin = TIN.create('1234567890');
      expect(tin.format()).toBe('1234-567-890');
    });

    it('should format TIN with leading zeros correctly', () => {
      const tin = TIN.create('0000000001');
      expect(tin.format()).toBe('0000-000-001');
    });

    it('should format TIN with all same digits correctly', () => {
      const tin = TIN.create('9999999999');
      expect(tin.format()).toBe('9999-999-999');
    });
  });

  describe('toString', () => {
    it('should return the raw TIN value', () => {
      const tin = TIN.create('1234567890');
      expect(tin.toString()).toBe('1234567890');
    });

    it('should return unformatted TIN', () => {
      const tin = TIN.create('0987654321');
      const result = tin.toString();

      expect(result).not.toContain('-');
      expect(result).toBe('0987654321');
    });
  });

  describe('equals', () => {
    it('should return true for equal TINs', () => {
      const tin1 = TIN.create('1234567890');
      const tin2 = TIN.create('1234567890');

      expect(tin1.equals(tin2)).toBe(true);
    });

    it('should return false for different TINs', () => {
      const tin1 = TIN.create('1234567890');
      const tin2 = TIN.create('0987654321');

      expect(tin1.equals(tin2)).toBe(false);
    });

    it('should return false when compared to null', () => {
      const tin = TIN.create('1234567890');

      expect(tin.equals(null as any)).toBe(false);
    });

    it('should return false when compared to undefined', () => {
      const tin = TIN.create('1234567890');

      expect(tin.equals(undefined as any)).toBe(false);
    });

    it('should handle TINs created with trimmed input', () => {
      const tin1 = TIN.create('  1234567890  ');
      const tin2 = TIN.create('1234567890');

      expect(tin1.equals(tin2)).toBe(true);
    });
  });

  describe('value getter', () => {
    it('should return the TIN value', () => {
      const tin = TIN.create('1234567890');
      expect(tin.value).toBe('1234567890');
    });

    it('should be immutable (cannot be changed)', () => {
      const tin = TIN.create('1234567890');

      // Attempt to modify (should not work due to readonly)
      expect(() => {
        (tin as any).value = '9999999999';
      }).toThrow();
    });
  });

  describe('Bangladesh-specific validation', () => {
    it('should accept valid Bangladesh TIN format', () => {
      // Real-world Bangladesh TIN examples (hypothetical)
      const validTINs = [
        '1234567890',
        '9876543210',
        '5555555555',
      ];

      validTINs.forEach(tinValue => {
        expect(() => TIN.create(tinValue)).not.toThrow();
      });
    });

    it('should format for display in Bangladesh format', () => {
      const tin = TIN.create('1234567890');
      const formatted = tin.format();

      // Format should be: XXXX-XXX-XXX
      expect(formatted).toMatch(/^\d{4}-\d{3}-\d{3}$/);
    });
  });
});
