import { ValueObject } from '../base/value-object.base';

export interface BINProps {
  value: string;
}

/**
 * BIN (Business Identification Number) Value Object
 *
 * Represents a Bangladesh National Board of Revenue (NBR) Business Identification Number.
 *
 * Validation Rules:
 * - Must be exactly 9 digits
 * - Cannot contain non-numeric characters
 * - Cannot be empty or null
 *
 * Example: "123456789"
 */
export class BIN extends ValueObject<BINProps> {
  private static readonly BIN_REGEX = /^\d{9}$/;
  private static readonly MIN_LENGTH = 9;
  private static readonly MAX_LENGTH = 9;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: BINProps) {
    super(props);
  }

  /**
   * Creates a new BIN value object with validation
   * @param value The 9-digit BIN string
   * @returns A validated BIN instance
   * @throws Error if validation fails
   */
  static create(value: string): BIN {
    // Validate not null/undefined
    if (!value || value.trim().length === 0) {
      throw new Error('BIN cannot be empty');
    }

    // Remove whitespace
    const trimmedValue = value.trim();

    // Validate length
    if (trimmedValue.length !== this.MIN_LENGTH) {
      throw new Error(`BIN must be exactly ${this.MIN_LENGTH} digits. Received: ${trimmedValue.length} characters`);
    }

    // Validate format (only digits)
    if (!this.BIN_REGEX.test(trimmedValue)) {
      throw new Error('BIN must contain only numeric digits (0-9)');
    }

    return new BIN({ value: trimmedValue });
  }

  /**
   * Checks if the provided string is a valid BIN format
   * @param value The string to validate
   * @returns true if valid, false otherwise
   */
  static isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    const trimmedValue = value.trim();
    return this.BIN_REGEX.test(trimmedValue);
  }

  /**
   * Returns the BIN value as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Formats the BIN for display (e.g., "123-456-789")
   * Bangladesh BIN format: XXX-XXX-XXX
   */
  format(): string {
    return `${this.value.substring(0, 3)}-${this.value.substring(3, 6)}-${this.value.substring(6, 9)}`;
  }

  /**
   * Checks equality with another BIN
   */
  equals(other: BIN): boolean {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  }
}
