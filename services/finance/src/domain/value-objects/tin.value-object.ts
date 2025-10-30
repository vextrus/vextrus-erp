import { ValueObject } from '../base/value-object.base';

export interface TINProps {
  value: string;
}

/**
 * TIN (Tax Identification Number) Value Object
 *
 * Represents a Bangladesh National Board of Revenue (NBR) Tax Identification Number.
 *
 * Validation Rules:
 * - Must be exactly 10 digits
 * - Cannot contain non-numeric characters
 * - Cannot be empty or null
 *
 * Example: "1234567890"
 */
export class TIN extends ValueObject<TINProps> {
  private static readonly TIN_REGEX = /^\d{10}$/;
  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 10;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: TINProps) {
    super(props);
  }

  /**
   * Creates a new TIN value object with validation
   * @param value The 10-digit TIN string
   * @returns A validated TIN instance
   * @throws Error if validation fails
   */
  static create(value: string): TIN {
    // Validate not null/undefined
    if (!value || value.trim().length === 0) {
      throw new Error('TIN cannot be empty');
    }

    // Remove whitespace
    const trimmedValue = value.trim();

    // Validate length
    if (trimmedValue.length !== this.MIN_LENGTH) {
      throw new Error(`TIN must be exactly ${this.MIN_LENGTH} digits. Received: ${trimmedValue.length} characters`);
    }

    // Validate format (only digits)
    if (!this.TIN_REGEX.test(trimmedValue)) {
      throw new Error('TIN must contain only numeric digits (0-9)');
    }

    return new TIN({ value: trimmedValue });
  }

  /**
   * Checks if the provided string is a valid TIN format
   * @param value The string to validate
   * @returns true if valid, false otherwise
   */
  static isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    const trimmedValue = value.trim();
    return this.TIN_REGEX.test(trimmedValue);
  }

  /**
   * Returns the TIN value as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Formats the TIN for display (e.g., "1234-567-890")
   * Bangladesh TIN format: XXXX-XXX-XXX
   */
  format(): string {
    return `${this.value.substring(0, 4)}-${this.value.substring(4, 7)}-${this.value.substring(7, 10)}`;
  }

  /**
   * Checks equality with another TIN
   */
  equals(other: TIN): boolean {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  }
}
