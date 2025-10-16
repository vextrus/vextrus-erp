export class Email {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    
    const normalizedEmail = value.toLowerCase().trim();
    
    if (!Email.EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error('Invalid email format');
    }
    
    this.value = normalizedEmail;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1]!;
  }

  getLocalPart(): string {
    return this.value.split('@')[0]!;
  }

  toString(): string {
    return this.value;
  }
}