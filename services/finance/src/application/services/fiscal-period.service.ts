import { Injectable, Logger } from '@nestjs/common';

/**
 * Fiscal Period Service
 *
 * Provides Bangladesh fiscal year calculation utilities.
 * Bangladesh fiscal year runs from July 1 to June 30.
 *
 * Fiscal Year Format: "YYYY-YYYY+1" (e.g., "2024-2025")
 * Quarters:
 *   Q1: July-September
 *   Q2: October-December
 *   Q3: January-March
 *   Q4: April-June
 *
 * Fiscal Months (1-12):
 *   July = 1, August = 2, ..., June = 12
 *
 * Bangladesh Compliance:
 * - All financial reporting follows July-June fiscal year
 * - VAT returns filed by fiscal period
 * - Annual financial statements prepared for fiscal year
 * - Weekend: Friday-Saturday (Sunday is working day)
 */

export interface FiscalYear {
  year: string;              // Format: "2024-2025"
  startDate: Date;           // July 1
  endDate: Date;             // June 30
  currentQuarter: number;    // 1-4
  currentMonth: number;      // 1-12 (July = 1)
}

export interface FiscalPeriod {
  fiscalYear: string;
  quarter: number;
  month: number;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class FiscalPeriodService {
  private readonly logger = new Logger(FiscalPeriodService.name);

  /**
   * Get current fiscal year information
   * Bangladesh fiscal year: July 1 - June 30
   */
  getCurrentFiscalYear(date?: Date): FiscalYear {
    const currentDate = date || new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (0=January)

    let fiscalYear: string;
    let startDate: Date;
    let endDate: Date;

    // Fiscal year starts July 1 (month = 6 in JavaScript, 0-based)
    if (currentMonth >= 6) { // July-December
      fiscalYear = `${currentYear}-${currentYear + 1}`;
      startDate = new Date(currentYear, 6, 1, 0, 0, 0, 0); // July 1
      endDate = new Date(currentYear + 1, 5, 30, 23, 59, 59, 999); // June 30
    } else { // January-June
      fiscalYear = `${currentYear - 1}-${currentYear}`;
      startDate = new Date(currentYear - 1, 6, 1, 0, 0, 0, 0); // July 1 of previous year
      endDate = new Date(currentYear, 5, 30, 23, 59, 59, 999); // June 30 of current year
    }

    // Calculate quarter (Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun)
    const currentQuarter = this.getFiscalQuarter(currentDate);

    // Calculate fiscal month (1-12, July = 1)
    const fiscalMonth = this.getFiscalMonth(currentDate);

    return {
      year: fiscalYear,
      startDate,
      endDate,
      currentQuarter,
      currentMonth: fiscalMonth
    };
  }

  /**
   * Get fiscal quarter for a given date
   * Q1: July-September, Q2: October-December, Q3: January-March, Q4: April-June
   */
  getFiscalQuarter(date?: Date): number {
    const currentDate = date || new Date();
    const month = currentDate.getMonth(); // 0-11

    if (month >= 6 && month <= 8) return 1;      // Jul-Sep
    else if (month >= 9 && month <= 11) return 2; // Oct-Dec
    else if (month >= 0 && month <= 2) return 3;  // Jan-Mar
    else return 4;                                 // Apr-Jun
  }

  /**
   * Get fiscal month for a given date
   * Returns 1-12 where July = 1, August = 2, ..., June = 12
   */
  getFiscalMonth(date?: Date): number {
    const currentDate = date || new Date();
    const month = currentDate.getMonth(); // 0-11 (0=January)

    if (month >= 6) {
      return month - 5; // July(6) = 1, Aug(7) = 2, ..., Dec(11) = 6
    } else {
      return month + 7; // Jan(0) = 7, Feb(1) = 8, ..., Jun(5) = 12
    }
  }

  /**
   * Check if a date is within a specific fiscal year
   */
  isInFiscalYear(date: Date, fiscalYear: string): boolean {
    const fiscalYearInfo = this.parseFiscalYear(fiscalYear);
    return date >= fiscalYearInfo.startDate && date <= fiscalYearInfo.endDate;
  }

  /**
   * Get fiscal year dates from fiscal year string
   * Input: "2024-2025" -> Output: { startDate: July 1 2024, endDate: June 30 2025 }
   */
  parseFiscalYear(fiscalYear: string): { startDate: Date; endDate: Date } {
    const [startYear, endYear] = fiscalYear.split('-').map(Number);

    if (!startYear || !endYear || endYear !== startYear + 1) {
      throw new Error(`Invalid fiscal year format: ${fiscalYear}. Expected format: YYYY-YYYY+1`);
    }

    return {
      startDate: new Date(startYear, 6, 1, 0, 0, 0, 0), // July 1
      endDate: new Date(endYear, 5, 30, 23, 59, 59, 999) // June 30
    };
  }

  /**
   * Get fiscal period (year + quarter) for a date
   */
  getFiscalPeriod(date?: Date): FiscalPeriod {
    const currentDate = date || new Date();
    const fiscalYear = this.getCurrentFiscalYear(currentDate);
    const quarter = this.getFiscalQuarter(currentDate);
    const month = this.getFiscalMonth(currentDate);

    // Calculate quarter start and end dates
    const quarterMonths = this.getQuarterMonths(quarter);
    const { periodStart, periodEnd } = this.getQuarterDates(fiscalYear.year, quarter);

    return {
      fiscalYear: fiscalYear.year,
      quarter,
      month,
      periodStart,
      periodEnd
    };
  }

  /**
   * Get calendar months for a fiscal quarter
   */
  private getQuarterMonths(quarter: number): number[] {
    switch (quarter) {
      case 1: return [6, 7, 8];   // Jul, Aug, Sep
      case 2: return [9, 10, 11]; // Oct, Nov, Dec
      case 3: return [0, 1, 2];   // Jan, Feb, Mar
      case 4: return [3, 4, 5];   // Apr, May, Jun
      default: throw new Error(`Invalid quarter: ${quarter}`);
    }
  }

  /**
   * Get start and end dates for a fiscal quarter
   */
  private getQuarterDates(fiscalYear: string, quarter: number): { periodStart: Date; periodEnd: Date } {
    const [startYear] = fiscalYear.split('-').map(Number);
    const year = quarter <= 2 ? startYear : startYear + 1;

    let periodStart: Date;
    let periodEnd: Date;

    switch (quarter) {
      case 1: // Jul-Sep
        periodStart = new Date(year, 6, 1);
        periodEnd = new Date(year, 8, 30, 23, 59, 59, 999);
        break;
      case 2: // Oct-Dec
        periodStart = new Date(year, 9, 1);
        periodEnd = new Date(year, 11, 31, 23, 59, 59, 999);
        break;
      case 3: // Jan-Mar
        periodStart = new Date(year, 0, 1);
        periodEnd = new Date(year, 2, 31, 23, 59, 59, 999);
        break;
      case 4: // Apr-Jun
        periodStart = new Date(year, 3, 1);
        periodEnd = new Date(year, 5, 30, 23, 59, 59, 999);
        break;
      default:
        throw new Error(`Invalid quarter: ${quarter}`);
    }

    return { periodStart, periodEnd };
  }

  /**
   * Get all fiscal quarters for a fiscal year
   */
  getAllQuarters(fiscalYear: string): FiscalPeriod[] {
    return [1, 2, 3, 4].map(quarter => {
      const { periodStart, periodEnd } = this.getQuarterDates(fiscalYear, quarter);
      const month = this.getFiscalMonth(periodStart);

      return {
        fiscalYear,
        quarter,
        month,
        periodStart,
        periodEnd
      };
    });
  }

  /**
   * Get previous fiscal year
   */
  getPreviousFiscalYear(fiscalYear: string): string {
    const [startYear] = fiscalYear.split('-').map(Number);
    return `${startYear - 1}-${startYear}`;
  }

  /**
   * Get next fiscal year
   */
  getNextFiscalYear(fiscalYear: string): string {
    const [startYear] = fiscalYear.split('-').map(Number);
    return `${startYear + 1}-${startYear + 2}`;
  }

  /**
   * Check if date is a weekend in Bangladesh (Friday-Saturday)
   */
  isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
    return dayOfWeek === 5 || dayOfWeek === 6;
  }

  /**
   * Get next working day (skip Friday-Saturday weekends)
   */
  getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    while (this.isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  /**
   * Format fiscal year for display
   */
  formatFiscalYear(fiscalYear: string, locale: 'en' | 'bn' = 'en'): string {
    if (locale === 'bn') {
      // Bengali numerals conversion (০-৯)
      const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return fiscalYear.split('').map(char => {
        const digit = parseInt(char, 10);
        return isNaN(digit) ? char : bengaliNumerals[digit];
      }).join('');
    }
    return fiscalYear;
  }

  /**
   * Get fiscal year summary
   */
  getFiscalYearSummary(fiscalYear?: string): {
    fiscalYear: string;
    startDate: Date;
    endDate: Date;
    quarters: FiscalPeriod[];
    daysRemaining: number;
    isCurrentFiscalYear: boolean;
  } {
    const targetFiscalYear = fiscalYear || this.getCurrentFiscalYear().year;
    const { startDate, endDate } = this.parseFiscalYear(targetFiscalYear);
    const quarters = this.getAllQuarters(targetFiscalYear);
    const currentFiscalYear = this.getCurrentFiscalYear().year;
    const isCurrentFiscalYear = targetFiscalYear === currentFiscalYear;

    const today = new Date();
    const daysRemaining = isCurrentFiscalYear
      ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      fiscalYear: targetFiscalYear,
      startDate,
      endDate,
      quarters,
      daysRemaining,
      isCurrentFiscalYear
    };
  }
}
