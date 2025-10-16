import { Decimal } from 'decimal.js';
import { addDays, isWeekend, nextMonday, setDay } from 'date-fns';

export class BengaliUtils {
  private static readonly BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  private static readonly ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  private static readonly BENGALI_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  
  private static readonly BENGALI_WEEKDAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  private static readonly BENGALI_NUMBERS_IN_WORDS = {
    0: 'শূন্য', 1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার',
    5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়',
    10: 'দশ', 11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ',
    15: 'পনেরো', 16: 'ষোল', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ',
    20: 'বিশ', 21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ',
    25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আটাশ', 29: 'ঊনত্রিশ',
    30: 'ত্রিশ', 31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ',
    35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'ঊনচল্লিশ',
    40: 'চল্লিশ', 41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ',
    45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'ঊনপঞ্চাশ',
    50: 'পঞ্চাশ', 60: 'ষাট', 70: 'সত্তর', 80: 'আশি', 90: 'নব্বই',
    100: 'একশো', 1000: 'হাজার', 100000: 'লক্ষ', 10000000: 'কোটি'
  };

  /**
   * Convert English numbers to Bengali digits
   */
  static toBengaliNumber(input: number | string): string {
    return String(input).replace(/\d/g, d => this.BENGALI_DIGITS[parseInt(d)] || d);
  }

  /**
   * Convert Bengali digits to English numbers
   */
  static toEnglishNumber(bengaliNumber: string): string {
    let result = bengaliNumber;
    this.BENGALI_DIGITS.forEach((bengaliDigit, index) => {
      const regex = new RegExp(bengaliDigit, 'g');
      result = result.replace(regex, this.ENGLISH_DIGITS[index] || '');
    });
    return result;
  }

  /**
   * Format BDT with Indian numbering system
   */
  static formatBDT(amount: number | Decimal, locale: 'en' | 'bn' = 'bn'): string {
    const value = amount instanceof Decimal ? amount.toNumber() : amount;
    const parts = value.toFixed(2).split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = parts[1] || '00';
    
    // Apply Indian numbering system
    let formatted = '';
    const len = integerPart.length;
    
    if (len <= 3) {
      formatted = integerPart;
    } else if (len <= 5) {
      formatted = integerPart.slice(0, len - 3) + ',' + integerPart.slice(len - 3);
    } else if (len <= 7) {
      formatted = integerPart.slice(0, len - 5) + ',' + 
                  integerPart.slice(len - 5, len - 3) + ',' + 
                  integerPart.slice(len - 3);
    } else {
      // For numbers larger than 7 digits
      let remaining = integerPart.slice(0, len - 7);
      const lastPart = integerPart.slice(len - 7);
      
      // Add commas every 2 digits for the remaining part
      const remainingFormatted = remaining.replace(/(\d)(?=(\d{2})+$)/g, '$1,');
      formatted = remainingFormatted + ',' + 
                  lastPart.slice(0, 2) + ',' + 
                  lastPart.slice(2, 4) + ',' + 
                  lastPart.slice(4);
    }
    
    const result = `${formatted}.${decimalPart}`;
    
    if (locale === 'bn') {
      const bengaliFormatted = this.toBengaliNumber(result);
      return `৳${bengaliFormatted}`;
    }
    
    return `৳${result}`;
  }

  /**
   * Convert number to Bengali words
   */
  static numberToBengaliWords(num: number): string {
    if (num === 0) return this.BENGALI_NUMBERS_IN_WORDS[0];
    if (num === 100) return this.BENGALI_NUMBERS_IN_WORDS[100]; // Special case for 100
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = Math.floor((num % 1000) / 100);
    const remainder = num % 100;
    
    let words = '';
    
    if (crore > 0) {
      words += this.convertToWords(crore) + ' কোটি ';
    }
    
    if (lakh > 0) {
      words += this.convertToWords(lakh) + ' লক্ষ ';
    }
    
    if (thousand > 0) {
      words += this.convertToWords(thousand) + ' হাজার ';
    }
    
    if (hundred > 0) {
      words += this.convertToWords(hundred) + ' শত ';
    }
    
    if (remainder > 0) {
      words += this.convertToWords(remainder);
    }
    
    return words.trim();
  }

  private static convertToWords(num: number): string {
    if (num <= 99 && this.BENGALI_NUMBERS_IN_WORDS[num]) {
      return this.BENGALI_NUMBERS_IN_WORDS[num];
    }
    
    if (num > 50 && num <= 99) {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      let word = this.BENGALI_NUMBERS_IN_WORDS[tens] || '';
      if (ones > 0) {
        word += ' ' + (this.BENGALI_NUMBERS_IN_WORDS[ones] || '');
      }
      return word;
    }
    
    return String(num); // Fallback to number string
  }

  /**
   * Check if a date is Friday or Saturday (Bangladesh weekend)
   */
  static isFridayOrSaturday(date: Date): boolean {
    const day = date.getDay();
    return day === 5 || day === 6; // Friday = 5, Saturday = 6
  }

  /**
   * Check if a date is a Bangladesh business day (Sunday-Thursday)
   */
  static isBusinessDay(date: Date): boolean {
    return !this.isFridayOrSaturday(date);
  }

  /**
   * Check if a date is a working day (alias for isBusinessDay)
   */
  static isWorkingDay(date: Date): boolean {
    return this.isBusinessDay(date);
  }

  /**
   * Get the next business day (skip Friday and Saturday)
   */
  static getNextBusinessDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    
    while (this.isFridayOrSaturday(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    
    return nextDay;
  }

  /**
   * Get the previous business day (skip Friday and Saturday)
   */
  static getPreviousBusinessDay(date: Date): Date {
    let prevDay = addDays(date, -1);
    
    while (this.isFridayOrSaturday(prevDay)) {
      prevDay = addDays(prevDay, -1);
    }
    
    return prevDay;
  }

  /**
   * Calculate business days between two dates (excluding Friday and Saturday)
   */
  static calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (this.isBusinessDay(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }

  /**
   * Add business days to a date (skip Friday and Saturday)
   */
  static addBusinessDays(date: Date, days: number): Date {
    let result = new Date(date);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      result = addDays(result, 1);
      if (this.isBusinessDay(result)) {
        daysAdded++;
      }
    }
    
    return result;
  }

  /**
   * Format date in Bengali
   */
  static formatBengaliDate(date: Date, format: 'short' | 'long' = 'long'): string {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const weekday = date.getDay();
    
    const bengaliDay = this.toBengaliNumber(day);
    const bengaliYear = this.toBengaliNumber(year);
    const bengaliMonth = this.BENGALI_MONTHS[month];
    const bengaliWeekday = this.BENGALI_WEEKDAYS[weekday];
    
    if (format === 'short') {
      return `${bengaliDay} ${bengaliMonth}, ${bengaliYear}`;
    }
    
    return `${bengaliWeekday}, ${bengaliDay} ${bengaliMonth}, ${bengaliYear}`;
  }

  /**
   * Get Bengali ordinal suffix
   */
  static getBengaliOrdinal(num: number): string {
    const bengaliNum = this.toBengaliNumber(num);
    
    // Bengali ordinals typically use 'ম' (mo), 'য়' (yo), 'ঠা' (tha), 'ই' (i)
    // Common patterns:
    // 1st = ১ম (1mo)
    // 2nd = ২য় (2yo)
    // 3rd = ৩য় (3yo)
    // 4th onwards = সংখ্যা + ঠা/ই
    
    if (num === 1) return bengaliNum + 'ম';
    if (num === 2 || num === 3) return bengaliNum + 'য়';
    if (num >= 4 && num <= 18) return bengaliNum + 'ই';
    if (num === 19) return bengaliNum + 'তম';
    if (num >= 20) return bengaliNum + 'তম';
    
    return bengaliNum + 'তম';
  }

  /**
   * Parse Bengali number string to number
   */
  static parseBengaliNumber(bengaliStr: string): number {
    const englishStr = this.toEnglishNumber(bengaliStr);
    // Remove commas and currency symbols
    const cleanStr = englishStr.replace(/[,৳$₹£€]/g, '');
    return parseFloat(cleanStr);
  }

  /**
   * Get fiscal year for Bangladesh (July to June)
   */
  static getFiscalYear(date: Date): string {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Fiscal year starts in July (month index 6)
    if (month >= 6) {
      // July to December - fiscal year is current year to next year
      return `${year}-${year + 1}`;
    } else {
      // January to June - fiscal year is previous year to current year
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Get fiscal quarter for Bangladesh
   */
  static getFiscalQuarter(date: Date): number {
    const month = date.getMonth();
    
    // Q1: July-September (months 6-8)
    if (month >= 6 && month <= 8) return 1;
    // Q2: October-December (months 9-11)
    if (month >= 9 && month <= 11) return 2;
    // Q3: January-March (months 0-2)
    if (month >= 0 && month <= 2) return 3;
    // Q4: April-June (months 3-5)
    return 4;
  }

  /**
   * Format number with Indian numbering system
   */
  static formatWithIndianNumbering(amount: number, locale: 'en' | 'bn' = 'en'): string {
    const parts = amount.toFixed(2).split('.');
    const integerPart = parts[0] || '0';
    const decimalPart = parts[1];
    
    // Apply Indian numbering system
    let formatted = '';
    const len = integerPart.length;
    const isNegative = integerPart.startsWith('-');
    const absIntegerPart = isNegative ? integerPart.slice(1) : integerPart;
    const absLen = absIntegerPart.length;
    
    if (absLen <= 3) {
      formatted = absIntegerPart;
    } else if (absLen <= 5) {
      formatted = absIntegerPart.slice(0, absLen - 3) + ',' + absIntegerPart.slice(absLen - 3);
    } else if (absLen <= 7) {
      formatted = absIntegerPart.slice(0, absLen - 5) + ',' + 
                  absIntegerPart.slice(absLen - 5, absLen - 3) + ',' + 
                  absIntegerPart.slice(absLen - 3);
    } else {
      // For numbers larger than 7 digits
      let remaining = absIntegerPart.slice(0, absLen - 7);
      const lastPart = absIntegerPart.slice(absLen - 7);
      
      // Add commas every 2 digits for the remaining part
      const remainingFormatted = remaining.replace(/(\d)(?=(\d{2})+$)/g, '$1,');
      formatted = remainingFormatted + ',' + 
                  lastPart.slice(0, 2) + ',' + 
                  lastPart.slice(2, 4) + ',' + 
                  lastPart.slice(4);
    }
    
    let result = (isNegative ? '-' : '') + formatted;
    if (decimalPart && decimalPart !== '00') {
      result += '.' + decimalPart;
    }
    
    if (locale === 'bn') {
      return this.toBengaliNumber(result);
    }
    
    return result;
  }

  /**
   * Format number in words
   */
  static formatInWords(num: number, locale: 'en' | 'bn' = 'bn'): string {
    if (locale === 'bn') {
      if (num < 0) {
        return 'ঋণাত্মক ' + this.numberToBengaliWords(Math.abs(num));
      }
      return this.numberToBengaliWords(num);
    }
    
    // English number to words
    return this.numberToEnglishWords(num);
  }

  /**
   * Convert number to English words
   */
  private static numberToEnglishWords(num: number): string {
    if (num === 0) return 'zero';
    if (num < 0) return 'negative ' + this.numberToEnglishWords(Math.abs(num));
    
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (num < 10) return ones[num] || '';
    if (num < 20) return teens[num - 10] || '';
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return (tens[ten] || '') + (one > 0 ? '-' + (ones[one] || '') : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return (ones[hundred] || '') + ' hundred' + (remainder > 0 ? ' ' + this.numberToEnglishWords(remainder) : '');
    }
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      return this.numberToEnglishWords(thousand) + ' thousand' + (remainder > 0 ? ' ' + this.numberToEnglishWords(remainder) : '');
    }
    
    return String(num); // Fallback for very large numbers
  }

  /**
   * Get day name
   */
  static getDayName(date: Date, locale: 'en' | 'bn' = 'bn'): string {
    const dayIndex = date.getDay();
    
    if (locale === 'bn') {
      return this.BENGALI_WEEKDAYS[dayIndex] || '';
    }
    
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return englishDays[dayIndex] || '';
  }

  /**
   * Get month name
   */
  static getMonthName(date: Date, locale: 'en' | 'bn' = 'bn'): string {
    const monthIndex = date.getMonth();
    
    if (locale === 'bn') {
      return this.BENGALI_MONTHS[monthIndex] || '';
    }
    
    const englishMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return englishMonths[monthIndex] || '';
  }
}