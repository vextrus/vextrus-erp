import { Injectable } from '@nestjs/common';

@Injectable()
export class BangladeshValidator {
  /**
   * Validate Bangladesh TIN (Tax Identification Number)
   * TIN should be 10-12 digits
   */
  validateTIN(tin: string): boolean {
    if (!tin) return false;
    const cleanTin = tin.replace(/[\s-]/g, '');
    return /^\d{10,12}$/.test(cleanTin);
  }

  /**
   * Validate Bangladesh BIN (Business Identification Number)
   * BIN should be exactly 9 digits
   */
  validateBIN(bin: string): boolean {
    if (!bin) return false;
    const cleanBin = bin.replace(/[\s-]/g, '');
    return /^\d{9}$/.test(cleanBin);
  }

  /**
   * Validate Bangladesh NID (National ID)
   * NID can be 10 digits (old format) or 13-17 digits (new format)
   */
  validateNID(nid: string): boolean {
    if (!nid) return false;
    const cleanNid = nid.replace(/[\s-]/g, '');
    return /^(\d{10}|\d{13}|\d{17})$/.test(cleanNid);
  }

  /**
   * Validate Bangladesh phone number
   * Format: +880 or 0 followed by 1[3-9] and then 8 digits
   */
  validatePhoneNumber(phone: string): boolean {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    return /^(\+?880|0)?1[3-9]\d{8}$/.test(cleanPhone);
  }

  /**
   * Normalize Bangladesh phone number to international format
   */
  normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (normalized.startsWith('880')) {
      // Already has country code
      normalized = normalized;
    } else if (normalized.startsWith('0')) {
      // Local format with leading 0
      normalized = '880' + normalized.substring(1);
    } else if (normalized.startsWith('1')) {
      // Without any prefix
      normalized = '880' + normalized;
    }
    
    return '+' + normalized;
  }

  /**
   * Validate Bangladesh postal code
   * Should be 4 digits
   */
  validatePostalCode(postalCode: string): boolean {
    if (!postalCode) return false;
    return /^\d{4}$/.test(postalCode);
  }

  /**
   * Validate VAT registration number
   * Format varies but typically includes TIN
   */
  validateVATRegistration(vatNo: string): boolean {
    if (!vatNo) return false;
    const cleanVat = vatNo.replace(/[\s-]/g, '');
    // VAT registration typically includes TIN
    return this.validateTIN(cleanVat);
  }

  /**
   * Format currency in BDT with Bengali formatting
   */
  formatBDT(amount: number, locale: 'en' | 'bn' = 'en'): string {
    const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  }

  /**
   * Format number in Lakh/Crore system
   */
  formatInLakhCrore(amount: number): string {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)} Crore`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)} Lakh`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} Thousand`;
    }
    return amount.toString();
  }

  /**
   * Convert number to Bengali numerals
   */
  toBengaliNumerals(num: number | string): string {
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (digit) => bengaliNumerals[parseInt(digit)]);
  }

  /**
   * Convert Bengali numerals to English
   */
  fromBengaliNumerals(bengaliNum: string): string {
    const bengaliToEnglish: { [key: string]: string } = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return bengaliNum.replace(/[০-৯]/g, (digit) => bengaliToEnglish[digit] || digit);
  }

  /**
   * Validate district name against Bangladesh districts
   */
  validateDistrict(district: string): boolean {
    const districts = [
      // Dhaka Division
      'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj',
      'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi',
      'Rajbari', 'Shariatpur', 'Tangail',
      // Chattogram Division
      'Bandarban', 'Brahmanbaria', 'Chandpur', 'Chattogram', 'Comilla',
      'Cox\'s Bazar', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
      // Rajshahi Division
      'Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapainawabganj',
      'Pabna', 'Rajshahi', 'Sirajganj',
      // Khulna Division
      'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Khulna',
      'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
      // Barishal Division
      'Barguna', 'Barishal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
      // Sylhet Division
      'Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet',
      // Rangpur Division
      'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari',
      'Panchagarh', 'Rangpur', 'Thakurgaon',
      // Mymensingh Division
      'Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'
    ];
    
    return districts.some(d => d.toLowerCase() === district.toLowerCase());
  }

  /**
   * Validate division name
   */
  validateDivision(division: string): boolean {
    const divisions = [
      'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna',
      'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'
    ];
    
    return divisions.some(d => d.toLowerCase() === division.toLowerCase());
  }

  /**
   * Validate bank routing number
   * Bangladesh bank routing numbers are typically 9 digits
   */
  validateBankRoutingNumber(routingNumber: string): boolean {
    if (!routingNumber) return false;
    const cleanNumber = routingNumber.replace(/[\s-]/g, '');
    return /^\d{9}$/.test(cleanNumber);
  }

  /**
   * Calculate VAT amount (standard 15% in Bangladesh)
   */
  calculateVAT(amount: number, vatRate: number = 15): {
    baseAmount: number;
    vatAmount: number;
    totalAmount: number;
  } {
    const vatAmount = amount * (vatRate / 100);
    return {
      baseAmount: amount,
      vatAmount: vatAmount,
      totalAmount: amount + vatAmount,
    };
  }

  /**
   * Calculate AIT (Advance Income Tax)
   */
  calculateAIT(amount: number, aitRate: number): {
    baseAmount: number;
    aitAmount: number;
    netAmount: number;
  } {
    const aitAmount = amount * (aitRate / 100);
    return {
      baseAmount: amount,
      aitAmount: aitAmount,
      netAmount: amount - aitAmount,
    };
  }

  /**
   * Validate trade license number format
   */
  validateTradeLicense(licenseNo: string): boolean {
    if (!licenseNo) return false;
    // Trade license format varies by city corporation/municipality
    // Basic validation: alphanumeric with possible dashes
    return /^[A-Z0-9\-\/]{5,20}$/.test(licenseNo.toUpperCase());
  }

  /**
   * Get fiscal year for Bangladesh (July to June)
   */
  getFiscalYear(date: Date = new Date()): {
    year: string;
    startDate: Date;
    endDate: Date;
    quarter: number;
  } {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    let fiscalYear: string;
    let startYear: number;
    
    if (month >= 6) { // July (6) to December (11)
      startYear = year;
      fiscalYear = `${year}-${year + 1}`;
    } else { // January (0) to June (5)
      startYear = year - 1;
      fiscalYear = `${year - 1}-${year}`;
    }
    
    const startDate = new Date(startYear, 6, 1); // July 1
    const endDate = new Date(startYear + 1, 5, 30); // June 30
    
    // Determine quarter
    let quarter: number;
    if (month >= 6 && month <= 8) quarter = 1; // Jul-Sep
    else if (month >= 9 && month <= 11) quarter = 2; // Oct-Dec
    else if (month >= 0 && month <= 2) quarter = 3; // Jan-Mar
    else quarter = 4; // Apr-Jun
    
    return {
      year: fiscalYear,
      startDate,
      endDate,
      quarter,
    };
  }

  /**
   * Validate HS Code (Harmonized System Code for customs)
   */
  validateHSCode(hsCode: string): boolean {
    if (!hsCode) return false;
    // HS codes are typically 6-10 digits
    return /^\d{6,10}$/.test(hsCode.replace(/[.\s-]/g, ''));
  }

  /**
   * Format address in Bengali style
   */
  formatAddress(address: {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postalCode: string;
  }, locale: 'en' | 'bn' = 'en'): string {
    const parts = [
      address.line1,
      address.line2,
      address.area,
      `${address.district}-${address.postalCode}`,
      address.division,
      locale === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}