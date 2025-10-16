import { format, addDays, isWeekend, getDay, startOfYear, endOfYear } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export interface BengaliDate {
  year: number;
  month: number;
  day: number;
  formatted: string;
}

export interface Holiday {
  name: string;
  nameBn: string;
  date: Date;
  type: 'public' | 'bank' | 'optional';
}

export class DateUtils {
  private static readonly BD_TIMEZONE = 'Asia/Dhaka';
  
  private static readonly BENGALI_MONTHS = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ];
  
  private static readonly BENGALI_DAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 
    'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];
  
  private static readonly BENGALI_NUMBERS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  /**
   * Convert Gregorian date to Bengali calendar
   */
  static toBengaliCalendar(date: Date): BengaliDate {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Simplified Bengali year calculation
    // Bengali year 1430 started on 14 April 2023
    let bengaliYear = year - 593;
    if (month < 3 || (month === 3 && day < 14)) {
      bengaliYear--;
    }
    
    // Approximate month calculation
    let bengaliMonth = month - 3;
    if (bengaliMonth < 0) bengaliMonth += 12;
    
    const bengaliDay = day;
    
    const formatted = `${this.toBengaliNumber(bengaliDay)} ${this.BENGALI_MONTHS[bengaliMonth]} ${this.toBengaliNumber(bengaliYear)} বঙ্গাব্দ`;
    
    return {
      year: bengaliYear,
      month: bengaliMonth,
      day: bengaliDay,
      formatted
    };
  }

  /**
   * Convert number to Bengali numerals
   */
  static toBengaliNumber(num: number | string): string {
    return num.toString().split('').map(digit => {
      const d = parseInt(digit);
      return isNaN(d) ? digit : this.BENGALI_NUMBERS[d];
    }).join('');
  }

  /**
   * Get Bengali day name
   */
  static getBengaliDayName(date: Date): string {
    return this.BENGALI_DAYS[date.getDay()] || '';
  }

  /**
   * Format date in Bengali
   */
  static formatBengali(date: Date, formatStr: string = 'dd MMMM yyyy'): string {
    const formatted = format(date, formatStr);
    return this.toBengaliNumber(formatted);
  }

  /**
   * Check if date is Bangladesh weekend (Friday-Saturday)
   */
  static isBangladeshWeekend(date: Date): boolean {
    const day = getDay(date);
    return day === 5 || day === 6; // Friday = 5, Saturday = 6
  }

  /**
   * Get next working day in Bangladesh
   */
  static getNextWorkingDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    while (this.isBangladeshWeekend(nextDay) || this.isPublicHoliday(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    return nextDay;
  }

  /**
   * Check if date is a public holiday in Bangladesh
   */
  static isPublicHoliday(date: Date): boolean {
    const holidays = this.getBangladeshHolidays(date.getFullYear());
    return holidays.some(h => 
      h.type === 'public' && 
      h.date.toDateString() === date.toDateString()
    );
  }

  /**
   * Get Bangladesh public holidays for a year
   */
  static getBangladeshHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [
      // Fixed date holidays
      {
        name: 'International Mother Language Day',
        nameBn: 'আন্তর্জাতিক মাতৃভাষা দিবস',
        date: new Date(year, 1, 21), // February 21
        type: 'public'
      },
      {
        name: 'Independence Day',
        nameBn: 'স্বাধীনতা দিবস',
        date: new Date(year, 2, 26), // March 26
        type: 'public'
      },
      {
        name: 'Bengali New Year',
        nameBn: 'পহেলা বৈশাখ',
        date: new Date(year, 3, 14), // April 14
        type: 'public'
      },
      {
        name: 'May Day',
        nameBn: 'মে দিবস',
        date: new Date(year, 4, 1), // May 1
        type: 'public'
      },
      {
        name: 'National Mourning Day',
        nameBn: 'জাতীয় শোক দিবস',
        date: new Date(year, 7, 15), // August 15
        type: 'public'
      },
      {
        name: 'Victory Day',
        nameBn: 'বিজয় দিবস',
        date: new Date(year, 11, 16), // December 16
        type: 'public'
      }
    ];
    
    // Note: Islamic holidays (Eid) vary by lunar calendar
    // These would need to be calculated or fetched from an API
    
    return holidays;
  }

  /**
   * Convert date to Bangladesh timezone
   */
  static toBangladeshTime(date: Date): Date {
    return utcToZonedTime(date, this.BD_TIMEZONE);
  }

  /**
   * Convert from Bangladesh timezone to UTC
   */
  static fromBangladeshTime(date: Date): Date {
    return zonedTimeToUtc(date, this.BD_TIMEZONE);
  }

  /**
   * Get fiscal year for Bangladesh (July to June)
   */
  static getFiscalYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (month >= 6) { // July onwards
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }

  /**
   * Get fiscal year dates
   */
  static getFiscalYearDates(fiscalYear: string): { start: Date; end: Date } {
    const [startYear] = fiscalYear.split('-').map(Number);
    const year = startYear || new Date().getFullYear();
    return {
      start: new Date(year, 6, 1), // July 1
      end: new Date(year + 1, 5, 30, 23, 59, 59) // June 30
    };
  }

  /**
   * Calculate working days between two dates (Bangladesh)
   */
  static getWorkingDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    let current = new Date(startDate);
    
    while (current <= endDate) {
      if (!this.isBangladeshWeekend(current) && !this.isPublicHoliday(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }
}