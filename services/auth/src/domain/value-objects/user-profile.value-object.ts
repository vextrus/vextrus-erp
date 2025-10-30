export class UserProfile {
  constructor(
    public firstName: string,
    public lastName: string,
    public phoneNumber?: string,
    public preferredLanguage: string = 'en',
  ) {
    if (!firstName || firstName.trim().length === 0) {
      throw new Error('First name cannot be empty');
    }
    if (!lastName || lastName.trim().length === 0) {
      throw new Error('Last name cannot be empty');
    }
    
    this.firstName = firstName.trim();
    this.lastName = lastName.trim();
    
    if (phoneNumber) {
      this.phoneNumber = this.normalizePhoneNumber(phoneNumber);
    }
    
    if (!this.isValidLanguageCode(preferredLanguage)) {
      throw new Error('Invalid language code');
    }
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const normalized = phone.replace(/\D/g, '');
    
    // Validate Bangladesh phone number format (880 + 10 digits or 01 + 9 digits)
    const bdPhoneRegex = /^(880\d{10}|01\d{9})$/;
    
    if (!bdPhoneRegex.test(normalized)) {
      throw new Error('Invalid Bangladesh phone number format');
    }
    
    return normalized;
  }

  private isValidLanguageCode(code: string): boolean {
    // Support English and Bengali
    return ['en', 'bn'].includes(code);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getDisplayName(): string {
    return this.preferredLanguage === 'bn' 
      ? `${this.lastName} ${this.firstName}` // Bengali name order
      : `${this.firstName} ${this.lastName}`; // English name order
  }

  equals(other: UserProfile): boolean {
    return (
      this.firstName === other.firstName &&
      this.lastName === other.lastName &&
      this.phoneNumber === other.phoneNumber &&
      this.preferredLanguage === other.preferredLanguage
    );
  }
}