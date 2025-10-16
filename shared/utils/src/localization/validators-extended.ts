export class ExtendedValidators {
  /**
   * Validate Bangladesh VAT Registration (BIN) number
   * Format: 12 digits
   */
  static isValidBIN(bin: string): boolean {
    const binRegex = /^\d{12}$/;
    return binRegex.test(bin);
  }

  /**
   * Validate Bangladesh Trade License number
   * Format varies by city corporation/municipality
   */
  static isValidTradeLicense(license: string): boolean {
    // Basic validation: alphanumeric with optional dashes/slashes
    const licenseRegex = /^[A-Z0-9\/\-]{6,20}$/;
    return licenseRegex.test(license.toUpperCase());
  }

  /**
   * Validate Bangladesh bank account number
   * Format: 13-17 digits depending on bank
   */
  static isValidBankAccount(accountNumber: string): boolean {
    const accountRegex = /^\d{13,17}$/;
    return accountRegex.test(accountNumber);
  }

  /**
   * Validate Bangladesh postal code
   * Format: 4 digits
   */
  static isValidPostalCode(code: string): boolean {
    const postalRegex = /^\d{4}$/;
    if (!postalRegex.test(code)) {
      return false;
    }
    
    // Valid range: 1000-9999
    const codeNum = parseInt(code);
    return codeNum >= 1000 && codeNum <= 9999;
  }

  /**
   * Validate Bangladesh mobile number (with country code)
   * Format: +8801XXXXXXXXX or 01XXXXXXXXX
   */
  static isValidMobileNumberExtended(mobile: string): boolean {
    // Remove spaces and dashes
    const cleaned = mobile.replace(/[\s-]/g, '');
    
    // Check with or without country code
    const mobileRegex = /^(\+?880)?1[3-9]\d{8}$/;
    return mobileRegex.test(cleaned);
  }

  /**
   * Validate Bangladesh National ID (NID)
   * Old format: 13 digits, New format: 10 digits, Smart Card: 17 digits
   */
  static isValidNIDExtended(nid: string): boolean {
    const cleaned = nid.replace(/[\s-]/g, '');
    
    // Check for 10, 13, or 17 digit formats
    if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(cleaned)) {
      return false;
    }
    
    // Basic checksum validation for 17-digit smart card
    if (cleaned.length === 17) {
      return this.validateSmartCardNID(cleaned);
    }
    
    return true;
  }

  /**
   * Validate Smart Card NID checksum
   */
  private static validateSmartCardNID(nid: string): boolean {
    // Simplified validation - in production, use official algorithm
    const yearPart = nid.substring(0, 4);
    const year = parseInt(yearPart);
    
    // Birth year should be reasonable
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear;
  }

  /**
   * Validate Bangladesh passport number
   * Format: 2 letters followed by 7 digits
   */
  static isValidPassport(passport: string): boolean {
    const passportRegex = /^[A-Z]{2}\d{7}$/;
    return passportRegex.test(passport.toUpperCase());
  }

  /**
   * Validate TIN (Tax Identification Number)
   * Format: 12 digits
   */
  static isValidTIN(tin: string): boolean {
    const tinRegex = /^\d{12}$/;
    return tinRegex.test(tin);
  }

  /**
   * Validate business email with common BD domains
   */
  static isValidBusinessEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Check for common business domains in Bangladesh
    const businessDomains = [
      '.com.bd',
      '.org.bd',
      '.net.bd',
      '.edu.bd',
      '.gov.bd',
      '.com',
      '.org',
      '.net'
    ];
    
    const domain = email.toLowerCase().substring(email.indexOf('@'));
    return businessDomains.some(bd => domain.includes(bd));
  }

  /**
   * Validate vehicle registration number (Bangladesh format)
   * Format: DHAKA METRO-GA-11-1234
   */
  static isValidVehicleRegistration(registration: string): boolean {
    // Simplified regex for Bangladesh vehicle registration
    const vehicleRegex = /^[A-Z\s]+-[A-Z]{1,2}-\d{2}-\d{4}$/;
    return vehicleRegex.test(registration.toUpperCase());
  }

  /**
   * Validate Bangladesh driving license number
   */
  static isValidDrivingLicense(license: string): boolean {
    // Format varies by issuing authority
    const licenseRegex = /^[A-Z]{2,3}-\d{10,15}$/;
    return licenseRegex.test(license.toUpperCase());
  }

  /**
   * Validate BSTI certification number
   * Bangladesh Standards and Testing Institution
   */
  static isValidBSTI(bsti: string): boolean {
    const bstiRegex = /^BDS\s?\d{3,4}:\d{4}$/;
    return bstiRegex.test(bsti.toUpperCase());
  }

  /**
   * Validate IRC (Import Registration Certificate) number
   */
  static isValidIRC(irc: string): boolean {
    const ircRegex = /^[A-Z]{2,3}\d{6,10}$/;
    return ircRegex.test(irc.toUpperCase());
  }

  /**
   * Validate ERC (Export Registration Certificate) number
   */
  static isValidERC(erc: string): boolean {
    const ercRegex = /^[A-Z]{2,3}\d{6,10}$/;
    return ercRegex.test(erc.toUpperCase());
  }

  /**
   * Batch validation with field names
   */
  static validateBusinessDocuments(documents: Record<string, string>): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    
    const validators: Record<string, (value: string) => boolean> = {
      bin: this.isValidBIN,
      tin: this.isValidTIN,
      tradeLicense: this.isValidTradeLicense,
      irc: this.isValidIRC,
      erc: this.isValidERC,
      bankAccount: this.isValidBankAccount,
      nid: this.isValidNIDExtended,
      passport: this.isValidPassport
    };
    
    for (const [field, value] of Object.entries(documents)) {
      if (validators[field] && value) {
        if (!validators[field](value)) {
          errors[field] = `Invalid ${field} format`;
        }
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
}