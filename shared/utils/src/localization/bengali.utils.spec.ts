import { describe, it, expect } from 'vitest';
import { BengaliUtils } from './bengali.utils';
import Decimal from 'decimal.js';

describe('BengaliUtils', () => {
  describe('toBengaliNumber', () => {
    it('should convert English numbers to Bengali', () => {
      expect(BengaliUtils.toBengaliNumber(123)).toBe('১২৩');
      expect(BengaliUtils.toBengaliNumber('456')).toBe('৪৫৬');
      expect(BengaliUtils.toBengaliNumber(0)).toBe('০');
    });

    it('should handle decimal numbers', () => {
      expect(BengaliUtils.toBengaliNumber(123.45)).toBe('১২৩.৪৫');
      expect(BengaliUtils.toBengaliNumber('99.99')).toBe('৯৯.৯৯');
    });

    it('should handle negative numbers', () => {
      expect(BengaliUtils.toBengaliNumber(-100)).toBe('-১০০');
      expect(BengaliUtils.toBengaliNumber('-50.5')).toBe('-৫০.৫');
    });

    it('should handle large numbers', () => {
      expect(BengaliUtils.toBengaliNumber(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
    });
  });

  describe('toEnglishNumber', () => {
    it('should convert Bengali numbers to English', () => {
      expect(BengaliUtils.toEnglishNumber('১২৩')).toBe('123');
      expect(BengaliUtils.toEnglishNumber('৪৫৬')).toBe('456');
      expect(BengaliUtils.toEnglishNumber('০')).toBe('0');
    });

    it('should handle mixed Bengali and English', () => {
      expect(BengaliUtils.toEnglishNumber('১২3৪৫')).toBe('12345');
    });

    it('should preserve non-numeric characters', () => {
      expect(BengaliUtils.toEnglishNumber('৳ ১,২৩৪.৫৬')).toBe('৳ 1,234.56');
    });
  });

  describe('formatBDT', () => {
    it('should format BDT in Bengali', () => {
      const formatted = BengaliUtils.formatBDT(1234.56, 'bn');
      expect(formatted).toBe('৳১,২৩৪.৫৬');
    });

    it('should format BDT in English', () => {
      const formatted = BengaliUtils.formatBDT(1234.56, 'en');
      expect(formatted).toBe('৳1,234.56');
    });

    it('should handle Decimal input', () => {
      const decimal = new Decimal(9999.99);
      const formatted = BengaliUtils.formatBDT(decimal, 'bn');
      expect(formatted).toBe('৳৯,৯৯৯.৯৯');
    });

    it('should handle zero', () => {
      expect(BengaliUtils.formatBDT(0, 'en')).toBe('৳0.00');
      expect(BengaliUtils.formatBDT(0, 'bn')).toBe('৳০.০০');
    });

    it('should handle negative amounts', () => {
      expect(BengaliUtils.formatBDT(-1000, 'en')).toBe('৳-1,000.00');
      expect(BengaliUtils.formatBDT(-1000, 'bn')).toBe('৳-১,০০০.০০');
    });
  });

  describe('formatWithIndianNumbering', () => {
    it('should format with Indian numbering (lakhs, crores)', () => {
      expect(BengaliUtils.formatWithIndianNumbering(100000, 'en'))
        .toBe('1,00,000');
      expect(BengaliUtils.formatWithIndianNumbering(10000000, 'en'))
        .toBe('1,00,00,000');
    });

    it('should format in Bengali with Indian numbering', () => {
      expect(BengaliUtils.formatWithIndianNumbering(100000, 'bn'))
        .toBe('১,০০,০০০');
      expect(BengaliUtils.formatWithIndianNumbering(10000000, 'bn'))
        .toBe('১,০০,০০,০০০');
    });

    it('should handle small numbers', () => {
      expect(BengaliUtils.formatWithIndianNumbering(999, 'en')).toBe('999');
      expect(BengaliUtils.formatWithIndianNumbering(999, 'bn')).toBe('৯৯৯');
    });

    it('should handle decimal values', () => {
      expect(BengaliUtils.formatWithIndianNumbering(12345.67, 'en'))
        .toBe('12,345.67');
      expect(BengaliUtils.formatWithIndianNumbering(12345.67, 'bn'))
        .toBe('১২,৩৪৫.৬৭');
    });
  });

  describe('isFridayOrSaturday', () => {
    it('should identify Friday correctly', () => {
      const friday = new Date('2024-01-05'); // Friday
      expect(BengaliUtils.isFridayOrSaturday(friday)).toBe(true);
    });

    it('should identify Saturday correctly', () => {
      const saturday = new Date('2024-01-06'); // Saturday
      expect(BengaliUtils.isFridayOrSaturday(saturday)).toBe(true);
    });

    it('should return false for other days', () => {
      const sunday = new Date('2024-01-07'); // Sunday
      const monday = new Date('2024-01-08'); // Monday
      
      expect(BengaliUtils.isFridayOrSaturday(sunday)).toBe(false);
      expect(BengaliUtils.isFridayOrSaturday(monday)).toBe(false);
    });
  });

  describe('isWorkingDay', () => {
    it('should return false for Friday and Saturday', () => {
      const friday = new Date('2024-01-05');
      const saturday = new Date('2024-01-06');
      
      expect(BengaliUtils.isWorkingDay(friday)).toBe(false);
      expect(BengaliUtils.isWorkingDay(saturday)).toBe(false);
    });

    it('should return true for weekdays', () => {
      const sunday = new Date('2024-01-07');
      const monday = new Date('2024-01-08');
      const thursday = new Date('2024-01-04');
      
      expect(BengaliUtils.isWorkingDay(sunday)).toBe(true);
      expect(BengaliUtils.isWorkingDay(monday)).toBe(true);
      expect(BengaliUtils.isWorkingDay(thursday)).toBe(true);
    });
  });

  describe('getFiscalYear', () => {
    it('should return correct fiscal year for July onwards', () => {
      const july = new Date('2024-07-01');
      const december = new Date('2024-12-31');
      
      expect(BengaliUtils.getFiscalYear(july)).toBe('2024-2025');
      expect(BengaliUtils.getFiscalYear(december)).toBe('2024-2025');
    });

    it('should return correct fiscal year for January to June', () => {
      const january = new Date('2024-01-01');
      const june = new Date('2024-06-30');
      
      expect(BengaliUtils.getFiscalYear(january)).toBe('2023-2024');
      expect(BengaliUtils.getFiscalYear(june)).toBe('2023-2024');
    });

    it('should handle edge cases', () => {
      const june30 = new Date('2024-06-30');
      const july1 = new Date('2024-07-01');
      
      expect(BengaliUtils.getFiscalYear(june30)).toBe('2023-2024');
      expect(BengaliUtils.getFiscalYear(july1)).toBe('2024-2025');
    });
  });

  describe('formatInWords', () => {
    it('should convert numbers to Bengali words', () => {
      expect(BengaliUtils.formatInWords(0, 'bn')).toBe('শূন্য');
      expect(BengaliUtils.formatInWords(1, 'bn')).toBe('এক');
      expect(BengaliUtils.formatInWords(10, 'bn')).toBe('দশ');
      expect(BengaliUtils.formatInWords(25, 'bn')).toBe('পঁচিশ');
      expect(BengaliUtils.formatInWords(100, 'bn')).toBe('একশো');
    });

    it('should convert numbers to English words', () => {
      expect(BengaliUtils.formatInWords(0, 'en')).toBe('zero');
      expect(BengaliUtils.formatInWords(1, 'en')).toBe('one');
      expect(BengaliUtils.formatInWords(10, 'en')).toBe('ten');
      expect(BengaliUtils.formatInWords(25, 'en')).toBe('twenty-five');
      expect(BengaliUtils.formatInWords(100, 'en')).toBe('one hundred');
    });

    it('should handle large numbers in Bengali', () => {
      expect(BengaliUtils.formatInWords(1000, 'bn')).toBe('এক হাজার');
      // Note: Full implementation would handle lakhs and crores
    });

    it('should handle negative numbers', () => {
      expect(BengaliUtils.formatInWords(-5, 'bn')).toBe('ঋণাত্মক পাঁচ');
      expect(BengaliUtils.formatInWords(-5, 'en')).toBe('negative five');
    });
  });

  describe('getDayName', () => {
    it('should return Bengali day names', () => {
      const sunday = new Date('2024-01-07');
      const monday = new Date('2024-01-08');
      const friday = new Date('2024-01-05');
      
      expect(BengaliUtils.getDayName(sunday, 'bn')).toBe('রবিবার');
      expect(BengaliUtils.getDayName(monday, 'bn')).toBe('সোমবার');
      expect(BengaliUtils.getDayName(friday, 'bn')).toBe('শুক্রবার');
    });

    it('should return English day names', () => {
      const sunday = new Date('2024-01-07');
      const monday = new Date('2024-01-08');
      const friday = new Date('2024-01-05');
      
      expect(BengaliUtils.getDayName(sunday, 'en')).toBe('Sunday');
      expect(BengaliUtils.getDayName(monday, 'en')).toBe('Monday');
      expect(BengaliUtils.getDayName(friday, 'en')).toBe('Friday');
    });
  });

  describe('getMonthName', () => {
    it('should return Bengali month names', () => {
      const january = new Date('2024-01-15');
      const december = new Date('2024-12-15');
      
      expect(BengaliUtils.getMonthName(january, 'bn')).toBe('জানুয়ারি');
      expect(BengaliUtils.getMonthName(december, 'bn')).toBe('ডিসেম্বর');
    });

    it('should return English month names', () => {
      const january = new Date('2024-01-15');
      const december = new Date('2024-12-15');
      
      expect(BengaliUtils.getMonthName(january, 'en')).toBe('January');
      expect(BengaliUtils.getMonthName(december, 'en')).toBe('December');
    });
  });
});