import { BadRequestException } from '@nestjs/common';

/**
 * TIN (Tax Identification Number) Value Object
 * Bangladesh TIN format: 10-12 digits
 *
 * Business Rules:
 * - Must be 10-12 digits
 * - Cannot start with 0
 * - Must be numeric only
 * - Immutable once created
 */
export class TIN {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Create a new TIN value object
   * @param value - The TIN string to validate and wrap
   * @returns TIN value object
   * @throws BadRequestException if validation fails
   */
  static create(value: string): TIN {
    if (!value) {
      throw new BadRequestException('TIN cannot be empty');
    }

    const normalized = this.normalize(value);
    this.validate(normalized);

    return new TIN(normalized);
  }

  /**
   * Normalize TIN by removing spaces and hyphens
   */
  private static normalize(value: string): string {
    return value.replace(/[\s-]/g, '');
  }

  /**
   * Validate TIN against Bangladesh NBR rules
   */
  private static validate(value: string): void {
    // Rule 1: Must be numeric only
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('TIN must contain only digits');
    }

    // Rule 2: Must be 10-12 digits
    if (value.length < 10 || value.length > 12) {
      throw new BadRequestException('TIN must be 10-12 digits long');
    }

    // Rule 3: Cannot start with 0
    if (value.startsWith('0')) {
      throw new BadRequestException('TIN cannot start with 0');
    }

    // Rule 4: Check for obviously invalid patterns (all same digit)
    if (/^(\d)\1+$/.test(value)) {
      throw new BadRequestException('TIN cannot be all the same digit');
    }
  }

  /**
   * Get the raw TIN value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get formatted TIN for display (XXX-XXXX-XXXX)
   */
  getFormatted(): string {
    if (this.value.length === 10) {
      return `${this.value.slice(0, 3)}-${this.value.slice(3, 7)}-${this.value.slice(7)}`;
    }
    if (this.value.length === 12) {
      return `${this.value.slice(0, 4)}-${this.value.slice(4, 8)}-${this.value.slice(8)}`;
    }
    return this.value;
  }

  /**
   * Compare with another TIN
   */
  equals(other: TIN): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * JSON serialization
   */
  toJSON(): string {
    return this.value;
  }

  /**
   * Create from database value (can be null)
   */
  static fromNullable(value: string | null | undefined): TIN | null {
    if (!value) return null;
    return TIN.create(value);
  }

  /**
   * Validate without creating object (for quick checks)
   */
  static isValid(value: string): boolean {
    try {
      const normalized = this.normalize(value);
      this.validate(normalized);
      return true;
    } catch {
      return false;
    }
  }
}
