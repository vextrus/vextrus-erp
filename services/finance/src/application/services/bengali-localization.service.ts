import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LocalizationOptions {
  useBengaliNumerals?: boolean;
  includeCurrencySymbol?: boolean;
  useCommas?: boolean;
  showDecimalPlaces?: number;
}

export interface DateLocalizationOptions {
  format?: 'short' | 'long' | 'full';
  useBengaliNumerals?: boolean;
  includeDayName?: boolean;
}

@Injectable()
export class BengaliLocalizationService {
  private readonly logger = new Logger(BengaliLocalizationService.name);

  // Bengali numerals mapping
  private readonly BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  // Bengali month names
  private readonly BENGALI_MONTHS = [
    'জানুয়ারি',   // January
    'ফেব্রুয়ারি',  // February
    'মার্চ',       // March
    'এপ্রিল',      // April
    'মে',         // May
    'জুন',        // June
    'জুলাই',       // July
    'আগস্ট',       // August
    'সেপ্টেম্বর',   // September
    'অক্টোবর',     // October
    'নভেম্বর',     // November
    'ডিসেম্বর'      // December
  ];

  // Bengali day names
  private readonly BENGALI_DAYS = [
    'রবিবার',      // Sunday
    'সোমবার',      // Monday
    'মঙ্গলবার',     // Tuesday
    'বুধবার',      // Wednesday
    'বৃহস্পতিবার',  // Thursday
    'শুক্রবার',     // Friday
    'শনিবার'       // Saturday
  ];

  // Bengali number words for amounts
  private readonly BENGALI_NUMBERS = {
    0: 'শূন্য',
    1: 'এক',
    2: 'দুই',
    3: 'তিন',
    4: 'চার',
    5: 'পাঁচ',
    6: 'ছয়',
    7: 'সাত',
    8: 'আট',
    9: 'নয়',
    10: 'দশ',
    11: 'এগারো',
    12: 'বারো',
    13: 'তেরো',
    14: 'চৌদ্দ',
    15: 'পনেরো',
    16: 'ষোলো',
    17: 'সতেরো',
    18: 'আঠারো',
    19: 'উনিশ',
    20: 'বিশ',
    21: 'একুশ',
    22: 'বাইশ',
    23: 'তেইশ',
    24: 'চব্বিশ',
    25: 'পঁচিশ',
    26: 'ছাব্বিশ',
    27: 'সাতাশ',
    28: 'আটাশ',
    29: 'ঊনত্রিশ',
    30: 'ত্রিশ',
    40: 'চল্লিশ',
    50: 'পঞ্চাশ',
    60: 'ষাট',
    70: 'সত্তর',
    80: 'আশি',
    90: 'নব্বই',
    100: 'একশত',
    1000: 'হাজার',
    100000: 'লক্ষ',
    10000000: 'কোটি'
  };

  // Financial terms dictionary
  private readonly FINANCIAL_TERMS = {
    // Account types
    'account': 'হিসাব',
    'assets': 'সম্পদ',
    'liabilities': 'দায়',
    'equity': 'মূলধন',
    'revenue': 'আয়',
    'expense': 'ব্যয়',
    'profit': 'লাভ',
    'loss': 'লোকসান',

    // Transaction types
    'debit': 'ডেবিট',
    'credit': 'ক্রেডিট',
    'invoice': 'চালান',
    'receipt': 'রসিদ',
    'payment': 'পেমেন্ট',
    'voucher': 'ভাউচার',
    'journal': 'জার্নাল',

    // Tax terms
    'vat': 'ভ্যাট',
    'tax': 'কর',
    'tds': 'উৎসে কর',
    'ait': 'অগ্রীম আয়কর',
    'tin': 'টিআইএন',
    'bin': 'বিআইএন',
    'nid': 'জাতীয় পরিচয়পত্র',
    'supplementary_duty': 'সম্পূরক শুল্ক',
    'customs_duty': 'শুল্ক',

    // Financial statements
    'balance_sheet': 'ব্যালেন্স শীট',
    'income_statement': 'আয় বিবরণী',
    'cash_flow': 'নগদ প্রবাহ',
    'trial_balance': 'ট্রায়াল ব্যালেন্স',
    'ledger': 'খতিয়ান',

    // Banking terms
    'bank': 'ব্যাংক',
    'branch': 'শাখা',
    'cheque': 'চেক',
    'deposit': 'জমা',
    'withdrawal': 'উত্তোলন',
    'transfer': 'স্থানান্তর',
    'interest': 'সুদ',

    // Business terms
    'customer': 'গ্রাহক',
    'vendor': 'বিক্রেতা',
    'supplier': 'সরবরাহকারী',
    'contractor': 'ঠিকাদার',
    'company': 'কোম্পানি',
    'organization': 'প্রতিষ্ঠান',
    'project': 'প্রকল্প',

    // Common terms
    'amount': 'পরিমাণ',
    'total': 'মোট',
    'subtotal': 'উপ-মোট',
    'discount': 'ছাড়',
    'date': 'তারিখ',
    'from': 'থেকে',
    'to': 'পর্যন্ত',
    'description': 'বিবরণ',
    'remarks': 'মন্তব্য',
    'status': 'অবস্থা',
    'approved': 'অনুমোদিত',
    'pending': 'অপেক্ষমান',
    'rejected': 'প্রত্যাখ্যাত',
    'paid': 'পরিশোধিত',
    'unpaid': 'বকেয়া',
    'due': 'বাকি'
  };

  // Currency symbol
  private readonly TAKA_SYMBOL = '৳';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Convert English numerals to Bengali numerals
   */
  toBengaliNumerals(input: string | number): string {
    const str = input.toString();
    let result = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char >= '0' && char <= '9') {
        result += this.BENGALI_NUMERALS[parseInt(char)];
      } else {
        result += char;
      }
    }

    return result;
  }

  /**
   * Convert Bengali numerals to English numerals
   */
  toEnglishNumerals(input: string): string {
    let result = input;

    for (let i = 0; i < this.BENGALI_NUMERALS.length; i++) {
      const bengaliDigit = this.BENGALI_NUMERALS[i];
      const englishDigit = i.toString();
      result = result.replace(new RegExp(bengaliDigit, 'g'), englishDigit);
    }

    return result;
  }

  /**
   * Format currency in Bengali
   */
  formatCurrency(
    amount: number,
    options: LocalizationOptions = {}
  ): string {
    const {
      useBengaliNumerals = true,
      includeCurrencySymbol = true,
      useCommas = true,
      showDecimalPlaces = 2
    } = options;

    // Format the number with decimal places
    let formatted = amount.toFixed(showDecimalPlaces);

    // Add commas for thousands separator (Indian numbering system)
    if (useCommas) {
      formatted = this.addIndianCommas(formatted);
    }

    // Convert to Bengali numerals if requested
    if (useBengaliNumerals) {
      formatted = this.toBengaliNumerals(formatted);
    }

    // Add currency symbol
    if (includeCurrencySymbol) {
      formatted = `${this.TAKA_SYMBOL} ${formatted}`;
    }

    return formatted;
  }

  /**
   * Add Indian-style comma separators (lakh, crore system)
   */
  private addIndianCommas(num: string): string {
    const parts = num.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Indian numbering: 12,34,56,789
    const lastThree = integerPart.slice(-3);
    const otherNumbers = integerPart.slice(0, -3);

    if (otherNumbers !== '') {
      const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      integerPart = formatted + ',' + lastThree;
    } else {
      integerPart = lastThree;
    }

    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }

  /**
   * Convert number to Bengali words (for amounts in text)
   */
  numberToWords(amount: number): string {
    if (amount === 0) {
      return (this.BENGALI_NUMBERS as any)[0];
    }

    const crore = Math.floor(amount / 10000000);
    const lakh = Math.floor((amount % 10000000) / 100000);
    const thousand = Math.floor((amount % 100000) / 1000);
    const hundred = Math.floor((amount % 1000) / 100);
    const remainder = amount % 100;

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

  /**
   * Convert numbers less than 100 to Bengali words
   */
  private convertToWords(num: number): string {
    if (num <= 30 || num % 10 === 0) {
      return (this.BENGALI_NUMBERS as any)[num] || '';
    }

    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;

    if ((this.BENGALI_NUMBERS as any)[tens] && (this.BENGALI_NUMBERS as any)[ones]) {
      return (this.BENGALI_NUMBERS as any)[tens] + ' ' + (this.BENGALI_NUMBERS as any)[ones];
    }

    // For numbers like 31-39, 41-49, etc.
    const tensWord = (this.BENGALI_NUMBERS as any)[tens];
    const onesWord = (this.BENGALI_NUMBERS as any)[ones];

    if (tensWord && onesWord) {
      return tensWord + ' ' + onesWord;
    }

    return num.toString();
  }

  /**
   * Format date in Bengali
   */
  formatDate(
    date: Date,
    options: DateLocalizationOptions = {}
  ): string {
    const {
      format = 'short',
      useBengaliNumerals = true,
      includeDayName = false
    } = options;

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    let formatted = '';

    // Add day name if requested
    if (includeDayName) {
      formatted += this.BENGALI_DAYS[dayOfWeek] + ', ';
    }

    // Format based on style
    switch (format) {
      case 'short':
        // DD/MM/YYYY format
        formatted += `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;
        break;

      case 'long':
        // DD Month, YYYY format
        formatted += `${day} ${this.BENGALI_MONTHS[month]}, ${year}`;
        break;

      case 'full':
        // DD Month YYYY বঙ্গাব্দ format
        const bengaliYear = year + 593; // Bengali calendar conversion (approximate)
        formatted += `${day} ${this.BENGALI_MONTHS[month]} ${year} (${bengaliYear} বঙ্গাব্দ)`;
        break;
    }

    // Convert to Bengali numerals if requested
    if (useBengaliNumerals) {
      formatted = this.toBengaliNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Get Bengali month name
   */
  getMonthName(month: number): string {
    return this.BENGALI_MONTHS[month] || '';
  }

  /**
   * Get Bengali day name
   */
  getDayName(day: number): string {
    return this.BENGALI_DAYS[day] || '';
  }

  /**
   * Translate financial term to Bengali
   */
  translateTerm(term: string): string {
    const lowerTerm = term.toLowerCase().replace(/[_-]/g, '_');
    return (this.FINANCIAL_TERMS as any)[lowerTerm] || term;
  }

  /**
   * Translate multiple terms
   */
  translateTerms(terms: string[]): Record<string, string> {
    const translations: Record<string, string> = {};

    for (const term of terms) {
      translations[term] = this.translateTerm(term);
    }

    return translations;
  }

  /**
   * Format phone number in Bengali format
   */
  formatPhoneNumber(phone: string, useBengaliNumerals: boolean = true): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as 01XXX-XXXXXX
    let formatted = '';
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('880')) {
      // International format
      formatted = `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    } else {
      formatted = cleaned;
    }

    if (useBengaliNumerals) {
      formatted = this.toBengaliNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format NID (National ID) number
   */
  formatNID(nid: string, useBengaliNumerals: boolean = true): string {
    // Remove any non-digit characters
    const cleaned = nid.replace(/\D/g, '');

    // Format based on length (10, 13, or 17 digits)
    let formatted = '';
    if (cleaned.length === 10) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 13) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12)}`;
    } else if (cleaned.length === 17) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)} ${cleaned.slice(16)}`;
    } else {
      formatted = cleaned;
    }

    if (useBengaliNumerals) {
      formatted = this.toBengaliNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Get fiscal year in Bengali
   */
  getFiscalYearBengali(startYear: number): string {
    const endYear = startYear + 1;
    const startYearBengali = this.toBengaliNumerals(startYear.toString());
    const endYearBengali = this.toBengaliNumerals(endYear.toString());

    return `${startYearBengali}-${endYearBengali} অর্থবছর`;
  }

  /**
   * Generate Bengali invoice header
   */
  generateInvoiceHeader(companyName: string, invoiceType: string = 'invoice'): string {
    const typeTranslation = this.translateTerm(invoiceType);
    return `${companyName}\n${typeTranslation}`;
  }

  /**
   * Get all financial terms dictionary
   */
  getFinancialTermsDictionary(): Record<string, string> {
    return { ...this.FINANCIAL_TERMS };
  }

  /**
   * Validate Bengali text encoding
   */
  isValidBengaliText(text: string): boolean {
    // Check if text contains Bengali Unicode characters
    const bengaliRegex = /[\u0980-\u09FF]/;
    return bengaliRegex.test(text);
  }

  /**
   * Format percentage in Bengali
   */
  formatPercentage(value: number, useBengaliNumerals: boolean = true): string {
    const formatted = `${value.toFixed(2)}%`;
    return useBengaliNumerals ? this.toBengaliNumerals(formatted) : formatted;
  }

  /**
   * Get ordinal number in Bengali
   */
  getOrdinalNumber(num: number): string {
    const bengaliNum = this.convertToWords(num);

    // Add ordinal suffix
    const ordinalSuffixes = {
      1: 'ম',   // First
      2: 'য়',   // Second
      3: 'য়',   // Third
      default: 'তম' // th equivalent
    };

    const suffix = (ordinalSuffixes as any)[num] || ordinalSuffixes.default;
    return bengaliNum + suffix;
  }
}