import { ValueObject } from '../base/value-object.base';

export interface InvoiceNumberProps {
  value: string;
}

/**
 * InvoiceNumber Value Object
 *
 * Represents a unique invoice number with Bangladesh-compliant formatting.
 *
 * Format: INV-YYYY-MM-DD-NNNNNN
 * - INV: Prefix indicating invoice type
 * - YYYY: 4-digit year
 * - MM: 2-digit month (01-12)
 * - DD: 2-digit day (01-31)
 * - NNNNNN: 6-digit sequence number (000001-999999)
 *
 * Example: "INV-2025-10-14-000001"
 *
 * This format ensures:
 * - Chronological ordering
 * - Easy date-based filtering
 * - Unique identification
 * - Compliance with Bangladesh invoice numbering requirements
 */
export class InvoiceNumber extends ValueObject<InvoiceNumberProps> {
  private static readonly INVOICE_NUMBER_REGEX = /^INV-\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{6}$/;
  private static readonly PREFIX = 'INV';

  get value(): string {
    return this.props.value;
  }

  private constructor(props: InvoiceNumberProps) {
    super(props);
  }

  /**
   * Creates a new InvoiceNumber value object with validation
   * @param value The invoice number string in format INV-YYYY-MM-DD-NNNNNN
   * @returns A validated InvoiceNumber instance
   * @throws Error if validation fails
   */
  static create(value: string): InvoiceNumber {
    // Validate not null/undefined
    if (!value || value.trim().length === 0) {
      throw new Error('Invoice number cannot be empty');
    }

    // Remove whitespace
    const trimmedValue = value.trim();

    // Validate format
    if (!this.INVOICE_NUMBER_REGEX.test(trimmedValue)) {
      throw new Error(
        'Invoice number must be in format INV-YYYY-MM-DD-NNNNNN. ' +
        `Example: INV-2025-10-14-000001. Received: ${trimmedValue}`
      );
    }

    // Additional validation: check if date is valid
    const parts = trimmedValue.split('-');
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);

    // Check if date is valid
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new Error(`Invoice number contains invalid date: ${year}-${month}-${day}`);
    }

    return new InvoiceNumber({ value: trimmedValue });
  }

  /**
   * Generates a new invoice number for a given date and sequence
   * @param date The invoice date
   * @param sequence The sequence number (will be padded to 6 digits)
   * @returns A new InvoiceNumber instance
   */
  static generate(date: Date, sequence: number): InvoiceNumber {
    if (sequence < 0 || sequence > 999999) {
      throw new Error('Sequence number must be between 0 and 999999');
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const seq = String(sequence).padStart(6, '0');

    const value = `${this.PREFIX}-${year}-${month}-${day}-${seq}`;
    return new InvoiceNumber({ value });
  }

  /**
   * Checks if the provided string is a valid invoice number format
   * @param value The string to validate
   * @returns true if valid, false otherwise
   */
  static isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    const trimmedValue = value.trim();
    if (!this.INVOICE_NUMBER_REGEX.test(trimmedValue)) {
      return false;
    }

    // Validate date
    const parts = trimmedValue.split('-');
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);

    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /**
   * Extracts the date from the invoice number
   * @returns The date portion of the invoice number
   */
  getDate(): Date {
    const parts = this.value.split('-');
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const day = parseInt(parts[3], 10);

    return new Date(year, month - 1, day);
  }

  /**
   * Extracts the sequence number from the invoice number
   * @returns The sequence number
   */
  getSequence(): number {
    const parts = this.value.split('-');
    return parseInt(parts[4], 10);
  }

  /**
   * Returns the invoice number as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Formats the invoice number for display
   * Already in proper format, so just return the value
   */
  format(): string {
    return this.value;
  }

  /**
   * Checks equality with another InvoiceNumber
   */
  equals(other: InvoiceNumber): boolean {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  }
}
