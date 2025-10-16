import { Decimal } from 'decimal.js';
import { Money } from '../money.value-object';

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create money from number', () => {
      const money = Money.create(100, 'BDT');
      expect(money.amount.toString()).toBe('100');
      expect(money.currency).toBe('BDT');
    });

    it('should create money from string', () => {
      const money = Money.create('100.50', 'USD');
      expect(money.amount.toString()).toBe('100.5');
      expect(money.currency).toBe('USD');
    });

    it('should create money from Decimal', () => {
      const decimal = new Decimal('100.25');
      const money = Money.create(decimal, 'EUR');
      expect(money.amount.toString()).toBe('100.25');
      expect(money.currency).toBe('EUR');
    });

    it('should create money from cents', () => {
      const money = Money.fromCents(10050, 'BDT');
      expect(money.amount.toString()).toBe('100.5');
    });

    it('should create zero money', () => {
      const money = Money.zero('BDT');
      expect(money.isZero()).toBe(true);
      expect(money.currency).toBe('BDT');
    });

    it('should default to BDT currency', () => {
      const money = Money.create(100);
      expect(money.currency).toBe('BDT');
    });
  });

  describe('Arithmetic Operations', () => {
    it('should add money with same currency', () => {
      const money1 = Money.create('100.50', 'BDT');
      const money2 = Money.create('50.25', 'BDT');
      const result = money1.add(money2);
      expect(result.amount.toString()).toBe('150.75');
    });

    it('should subtract money with same currency', () => {
      const money1 = Money.create('100.50', 'BDT');
      const money2 = Money.create('50.25', 'BDT');
      const result = money1.subtract(money2);
      expect(result.amount.toString()).toBe('50.25');
    });

    it('should multiply money by factor', () => {
      const money = Money.create('100', 'BDT');
      const result = money.multiply(1.5);
      expect(result.amount.toString()).toBe('150');
    });

    it('should divide money by divisor', () => {
      const money = Money.create('100', 'BDT');
      const result = money.divide(4);
      expect(result.amount.toString()).toBe('25');
    });

    it('should throw error on currency mismatch for add', () => {
      const bdt = Money.create(100, 'BDT');
      const usd = Money.create(100, 'USD');
      expect(() => bdt.add(usd)).toThrow('Currency mismatch: BDT vs USD');
    });

    it('should throw error on currency mismatch for subtract', () => {
      const bdt = Money.create(100, 'BDT');
      const usd = Money.create(100, 'USD');
      expect(() => bdt.subtract(usd)).toThrow('Currency mismatch: BDT vs USD');
    });

    it('should throw error when dividing by zero', () => {
      const money = Money.create(100, 'BDT');
      expect(() => money.divide(0)).toThrow('Cannot divide by zero');
    });

    it('should maintain precision in calculations', () => {
      const money1 = Money.create('0.1', 'BDT');
      const money2 = Money.create('0.2', 'BDT');
      const result = money1.add(money2);
      expect(result.amount.toString()).toBe('0.3');
    });
  });

  describe('Rounding', () => {
    it('should round to 2 decimal places by default', () => {
      const money = Money.create('100.456', 'BDT');
      const rounded = money.round();
      expect(rounded.amount.toString()).toBe('100.46');
    });

    it('should round to specified decimal places', () => {
      const money = Money.create('100.456789', 'BDT');
      const rounded = money.round(3);
      expect(rounded.amount.toString()).toBe('100.457');
    });

    it('should use bankers rounding', () => {
      const money1 = Money.create('100.125', 'BDT');
      const money2 = Money.create('100.135', 'BDT');
      
      const rounded1 = money1.roundBankers();
      const rounded2 = money2.roundBankers();
      
      expect(rounded1.amount.toString()).toBe('100.12'); // Round half to even
      expect(rounded2.amount.toString()).toBe('100.14'); // Round half to even
    });
  });

  describe('Comparisons', () => {
    it('should check if money is positive', () => {
      const positive = Money.create(100, 'BDT');
      const negative = Money.create(-100, 'BDT');
      const zero = Money.zero('BDT');
      
      expect(positive.isPositive()).toBe(true);
      expect(negative.isPositive()).toBe(false);
      expect(zero.isPositive()).toBe(false);
    });

    it('should check if money is negative', () => {
      const positive = Money.create(100, 'BDT');
      const negative = Money.create(-100, 'BDT');
      const zero = Money.zero('BDT');
      
      expect(positive.isNegative()).toBe(false);
      expect(negative.isNegative()).toBe(true);
      expect(zero.isNegative()).toBe(false);
    });

    it('should check if money is zero', () => {
      const positive = Money.create(100, 'BDT');
      const zero = Money.zero('BDT');
      
      expect(positive.isZero()).toBe(false);
      expect(zero.isZero()).toBe(true);
    });

    it('should compare money amounts', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(50, 'BDT');
      const money3 = Money.create(100, 'BDT');
      
      expect(money1.greaterThan(money2)).toBe(true);
      expect(money2.greaterThan(money1)).toBe(false);
      
      expect(money1.greaterThanOrEqual(money2)).toBe(true);
      expect(money1.greaterThanOrEqual(money3)).toBe(true);
      
      expect(money2.lessThan(money1)).toBe(true);
      expect(money1.lessThan(money2)).toBe(false);
      
      expect(money2.lessThanOrEqual(money1)).toBe(true);
      expect(money1.lessThanOrEqual(money3)).toBe(true);
    });
  });

  describe('Transformations', () => {
    it('should negate money', () => {
      const positive = Money.create(100, 'BDT');
      const negative = positive.negate();
      
      expect(negative.amount.toString()).toBe('-100');
      expect(negative.isNegative()).toBe(true);
    });

    it('should get absolute value', () => {
      const negative = Money.create(-100, 'BDT');
      const absolute = negative.absolute();
      
      expect(absolute.amount.toString()).toBe('100');
      expect(absolute.isPositive()).toBe(true);
    });

    it('should calculate percentage', () => {
      const money = Money.create(100, 'BDT');
      const percent = money.percentage(15); // 15%
      
      expect(percent.amount.toString()).toBe('15');
    });
  });

  describe('Allocation', () => {
    it('should allocate money by ratios', () => {
      const money = Money.create(100, 'BDT');
      const allocations = money.allocate([1, 1, 1]); // Split equally 3 ways
      
      expect(allocations).toHaveLength(3);
      expect(allocations[0].amount.toString()).toBe('33.33');
      expect(allocations[1].amount.toString()).toBe('33.33');
      expect(allocations[2].amount.toString()).toBe('33.34'); // Remainder
      
      // Total should equal original
      const total = allocations.reduce((sum, m) => sum.add(m), Money.zero('BDT'));
      expect(total.equals(money)).toBe(true);
    });

    it('should allocate money by unequal ratios', () => {
      const money = Money.create(100, 'BDT');
      const allocations = money.allocate([50, 30, 20]); // 50%, 30%, 20%
      
      expect(allocations[0].amount.toString()).toBe('50');
      expect(allocations[1].amount.toString()).toBe('30');
      expect(allocations[2].amount.toString()).toBe('20');
    });
  });

  describe('Bengali Formatting', () => {
    it('should format BDT with Bengali digits', () => {
      const money = Money.create(1500.50, 'BDT');
      expect(money.format('bn')).toBe('৳১৫০০.৫০');
    });

    it('should format BDT with English digits', () => {
      const money = Money.create(1500.50, 'BDT');
      expect(money.format('en')).toBe('৳1500.50');
    });

    it('should format with Indian numbering system', () => {
      const money1 = Money.create(1500, 'BDT');
      expect(money1.formatWithIndianNumbering('en')).toBe('৳1,500.00');
      
      const money2 = Money.create(150000, 'BDT');
      expect(money2.formatWithIndianNumbering('en')).toBe('৳1,50,000.00');
      
      const money3 = Money.create(15000000, 'BDT');
      expect(money3.formatWithIndianNumbering('en')).toBe('৳1,50,00,000.00');
    });

    it('should format with Indian numbering in Bengali', () => {
      const money = Money.create(150000, 'BDT');
      expect(money.formatWithIndianNumbering('bn')).toBe('৳১,৫০,০০০.০০');
    });

    it('should use correct currency symbols', () => {
      expect(Money.create(100, 'BDT').format('en')).toContain('৳');
      expect(Money.create(100, 'USD').format('en')).toContain('$');
      expect(Money.create(100, 'EUR').format('en')).toContain('€');
      expect(Money.create(100, 'GBP').format('en')).toContain('£');
      expect(Money.create(100, 'INR').format('en')).toContain('₹');
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const money = Money.create('100.50', 'BDT');
      const json = money.toJSON();
      
      expect(json).toEqual({
        amount: '100.5',
        currency: 'BDT'
      });
    });

    it('should deserialize from JSON', () => {
      const json = { amount: '100.50', currency: 'BDT' as const };
      const money = Money.fromJSON(json);
      
      expect(money.amount.toString()).toBe('100.5');
      expect(money.currency).toBe('BDT');
    });

    it('should convert to string', () => {
      const money = Money.create('100.50', 'BDT');
      expect(money.toString()).toBe('100.5 BDT');
    });

    it('should convert to cents', () => {
      const money = Money.create('100.50', 'BDT');
      expect(money.toCents()).toBe(10050);
    });
  });

  describe('Value Object Equality', () => {
    it('should be equal when amount and currency match', () => {
      const money1 = Money.create('100.50', 'BDT');
      const money2 = Money.create('100.50', 'BDT');
      
      expect(money1.equals(money2)).toBe(true);
    });

    it('should not be equal when amounts differ', () => {
      const money1 = Money.create('100.50', 'BDT');
      const money2 = Money.create('100.51', 'BDT');
      
      expect(money1.equals(money2)).toBe(false);
    });

    it('should not be equal when currencies differ', () => {
      const money1 = Money.create('100.50', 'BDT');
      const money2 = Money.create('100.50', 'USD');
      
      expect(money1.equals(money2)).toBe(false);
    });

    it('should handle null and undefined', () => {
      const money = Money.create('100.50', 'BDT');
      
      expect(money.equals(null as any)).toBe(false);
      expect(money.equals(undefined as any)).toBe(false);
    });
  });
});