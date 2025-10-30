import { describe, it, expect } from 'vitest';
import { Money } from './money.value-object';
import Decimal from 'decimal.js';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create money with default BDT currency', () => {
      const money = Money.create(100);
      expect(money.amount.toNumber()).toBe(100);
      expect(money.currency).toBe('BDT');
    });

    it('should create money with USD currency', () => {
      const money = Money.create(50, 'USD');
      expect(money.amount.toNumber()).toBe(50);
      expect(money.currency).toBe('USD');
    });

    it('should create money from string', () => {
      const money = Money.create('123.45');
      expect(money.amount.toNumber()).toBe(123.45);
    });

    it('should create money from Decimal', () => {
      const decimal = new Decimal(99.99);
      const money = Money.create(decimal);
      expect(money.amount.toNumber()).toBe(99.99);
    });

    it('should handle zero value', () => {
      const money = Money.create(0);
      expect(money.isZero()).toBe(true);
      expect(money.isPositive()).toBe(false);
      expect(money.isNegative()).toBe(false);
    });

    it('should handle negative value', () => {
      const money = Money.create(-100);
      expect(money.isNegative()).toBe(true);
      expect(money.isPositive()).toBe(false);
    });
  });

  describe('arithmetic operations', () => {
    it('should add money with same currency', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(50, 'BDT');
      const result = money1.add(money2);
      
      expect(result.amount.toNumber()).toBe(150);
      expect(result.currency).toBe('BDT');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(50, 'USD');
      
      expect(() => money1.add(money2)).toThrow('Currency mismatch');
    });

    it('should subtract money', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(30, 'BDT');
      const result = money1.subtract(money2);
      
      expect(result.amount.toNumber()).toBe(70);
    });

    it('should multiply money by scalar', () => {
      const money = Money.create(100, 'BDT');
      const result = money.multiply(1.5);
      
      expect(result.amount.toNumber()).toBe(150);
    });

    it('should divide money by scalar', () => {
      const money = Money.create(100, 'BDT');
      const result = money.divide(2);
      
      expect(result.amount.toNumber()).toBe(50);
    });

    it('should throw error when dividing by zero', () => {
      const money = Money.create(100, 'BDT');
      
      expect(() => money.divide(0)).toThrow('Cannot divide by zero');
    });

    it('should calculate percentage', () => {
      const money = Money.create(1000, 'BDT');
      const result = money.percentage(15);
      
      expect(result.amount.toNumber()).toBe(150);
    });

    it('should negate money', () => {
      const money = Money.create(100, 'BDT');
      const result = money.negate();
      
      expect(result.amount.toNumber()).toBe(-100);
    });

    it('should return absolute value', () => {
      const money = Money.create(-100, 'BDT');
      const result = money.absolute();
      
      expect(result.amount.toNumber()).toBe(100);
    });
  });

  describe('comparison', () => {
    it('should compare equal money', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(100, 'BDT');
      
      expect(money1.equals(money2)).toBe(true);
    });

    it('should compare unequal money', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(200, 'BDT');
      
      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(100, 'USD');
      
      expect(money1.equals(money2)).toBe(false);
    });

    it('should check greater than', () => {
      const money1 = Money.create(200, 'BDT');
      const money2 = Money.create(100, 'BDT');
      
      expect(money1.greaterThan(money2)).toBe(true);
      expect(money2.greaterThan(money1)).toBe(false);
    });

    it('should check less than', () => {
      const money1 = Money.create(50, 'BDT');
      const money2 = Money.create(100, 'BDT');
      
      expect(money1.lessThan(money2)).toBe(true);
      expect(money2.lessThan(money1)).toBe(false);
    });

    it('should check greater than or equal', () => {
      const money1 = Money.create(100, 'BDT');
      const money2 = Money.create(100, 'BDT');
      const money3 = Money.create(50, 'BDT');
      
      expect(money1.greaterThanOrEqual(money2)).toBe(true);
      expect(money1.greaterThanOrEqual(money3)).toBe(true);
      expect(money3.greaterThanOrEqual(money1)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format in Bengali with symbol', () => {
      const money = Money.create(1234567.89, 'BDT');
      const formatted = money.format('bn');
      
      expect(formatted).toContain('৳');
      expect(formatted).toContain('১২৩৪৫৬৭');
    });

    it('should format in English', () => {
      const money = Money.create(1234.56, 'BDT');
      const formatted = money.format('en');
      
      expect(formatted).toBe('৳1234.56');
    });

    it('should format with Indian numbering system', () => {
      const money = Money.create(1234567.89, 'BDT');
      const formatted = money.formatWithIndianNumbering('en');
      
      expect(formatted).toBe('৳12,34,567.89');
    });

    it('should format Bengali with Indian numbering', () => {
      const money = Money.create(1234567, 'BDT');
      const formatted = money.formatWithIndianNumbering('bn');
      
      expect(formatted).toContain('৳');
      expect(formatted).toContain('১২,৩৪,৫৬৭');
    });

    it('should handle zero formatting', () => {
      const money = Money.create(0, 'BDT');
      const formatted = money.format('en');
      
      expect(formatted).toBe('৳0.00');
    });

    it('should handle negative formatting', () => {
      const money = Money.create(-1000, 'BDT');
      const formatted = money.format('en');
      
      expect(formatted).toBe('৳-1000.00');
    });
  });

  describe('rounding', () => {
    it('should round to 2 decimal places by default', () => {
      const money = Money.create(100.456, 'BDT');
      const rounded = money.round();
      
      expect(rounded.amount.toNumber()).toBe(100.46);
    });

    it('should round to specified decimal places', () => {
      const money = Money.create(100.456789, 'BDT');
      const rounded = money.round(4);
      
      expect(rounded.amount.toNumber()).toBe(100.4568);
    });

    it('should round down', () => {
      const money = Money.create(100.456, 'BDT');
      const rounded = money.floor();
      
      expect(rounded.amount.toNumber()).toBe(100);
    });

    it('should round up', () => {
      const money = Money.create(100.123, 'BDT');
      const rounded = money.ceil();
      
      expect(rounded.amount.toNumber()).toBe(101);
    });
  });

  describe('allocate', () => {
    it('should allocate money into equal parts', () => {
      const money = Money.create(100, 'BDT');
      const parts = money.allocate([1, 1, 1]);
      
      expect(parts).toHaveLength(3);
      expect(parts[0].amount.toNumber()).toBeCloseTo(33.33, 2);
      expect(parts[1].amount.toNumber()).toBeCloseTo(33.33, 2);
      expect(parts[2].amount.toNumber()).toBeCloseTo(33.34, 2);
      
      const total = parts.reduce((sum, part) => sum.add(part), Money.create(0, 'BDT'));
      expect(total.getAmount().toNumber()).toBe(100);
    });

    it('should allocate money with different ratios', () => {
      const money = Money.create(100, 'BDT');
      const parts = money.allocate([3, 2, 1]);
      
      expect(parts[0].amount.toNumber()).toBeCloseTo(50, 2);
      expect(parts[1].amount.toNumber()).toBeCloseTo(33.33, 2);
      expect(parts[2].amount.toNumber()).toBeCloseTo(16.67, 2);
    });

    it('should handle single allocation', () => {
      const money = Money.create(100, 'BDT');
      const parts = money.allocate([1]);
      
      expect(parts).toHaveLength(1);
      expect(parts[0].amount.toNumber()).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const money = Money.create('999999999999999.99', 'BDT');
      expect(money.amount.toString()).toBe('999999999999999.99');
    });

    it('should maintain precision', () => {
      const money1 = Money.create(0.1, 'BDT');
      const money2 = Money.create(0.2, 'BDT');
      const result = money1.add(money2);
      
      expect(result.amount.toNumber()).toBe(0.3);
    });

    it('should handle currency conversion placeholder', () => {
      const money = Money.create(100, 'USD');
      expect(money.currency).toBe('USD');
      // Future: Add actual conversion when exchange rates are implemented
    });
  });
});