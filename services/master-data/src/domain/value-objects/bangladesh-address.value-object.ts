import { BadRequestException } from '@nestjs/common';

/**
 * BangladeshAddress Value Object
 * Handles Bangladesh-specific address structure
 *
 * Business Rules:
 * - Must have valid division (8 divisions)
 * - Must have valid district (64 districts)
 * - Postal code format: 4 digits
 * - Immutable once created
 */
export class BangladeshAddress {
  private readonly line1: string;
  private readonly line2?: string;
  private readonly area: string;
  private readonly district: string;
  private readonly division: string;
  private readonly postalCode: string;
  private readonly country: string = 'Bangladesh';

  // 8 Administrative Divisions of Bangladesh
  private static readonly DIVISIONS = [
    'Dhaka',
    'Chittagong',
    'Rajshahi',
    'Khulna',
    'Barisal',
    'Sylhet',
    'Rangpur',
    'Mymensingh',
  ];

  // 64 Districts of Bangladesh (organized by division)
  private static readonly DISTRICTS: Record<string, string[]> = {
    Dhaka: [
      'Dhaka',
      'Faridpur',
      'Gazipur',
      'Gopalganj',
      'Kishoreganj',
      'Madaripur',
      'Manikganj',
      'Munshiganj',
      'Narayanganj',
      'Narsingdi',
      'Rajbari',
      'Shariatpur',
      'Tangail',
    ],
    Chittagong: [
      'Bandarban',
      'Brahmanbaria',
      'Chandpur',
      'Chittagong',
      'Comilla',
      'Cox\'s Bazar',
      'Feni',
      'Khagrachari',
      'Lakshmipur',
      'Noakhali',
      'Rangamati',
    ],
    Rajshahi: [
      'Bogra',
      'Joypurhat',
      'Naogaon',
      'Natore',
      'Nawabganj',
      'Pabna',
      'Rajshahi',
      'Sirajganj',
    ],
    Khulna: [
      'Bagerhat',
      'Chuadanga',
      'Jessore',
      'Jhenaidah',
      'Khulna',
      'Kushtia',
      'Magura',
      'Meherpur',
      'Narail',
      'Satkhira',
    ],
    Barisal: ['Barguna', 'Barisal', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
    Sylhet: ['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'],
    Rangpur: [
      'Dinajpur',
      'Gaibandha',
      'Kurigram',
      'Lalmonirhat',
      'Nilphamari',
      'Panchagarh',
      'Rangpur',
      'Thakurgaon',
    ],
    Mymensingh: ['Jamalpur', 'Mymensingh', 'Netrokona', 'Sherpur'],
  };

  private constructor(
    line1: string,
    area: string,
    district: string,
    division: string,
    postalCode: string,
    line2?: string
  ) {
    this.line1 = line1;
    this.line2 = line2;
    this.area = area;
    this.district = district;
    this.division = division;
    this.postalCode = postalCode;
  }

  /**
   * Create a new BangladeshAddress
   */
  static create(params: {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postalCode: string;
  }): BangladeshAddress {
    // Validate required fields
    if (!params.line1?.trim()) {
      throw new BadRequestException('Address line 1 is required');
    }
    if (!params.area?.trim()) {
      throw new BadRequestException('Area/City is required');
    }
    if (!params.district?.trim()) {
      throw new BadRequestException('District is required');
    }
    if (!params.division?.trim()) {
      throw new BadRequestException('Division is required');
    }
    if (!params.postalCode?.trim()) {
      throw new BadRequestException('Postal code is required');
    }

    // Normalize values
    const division = this.normalizeDivision(params.division);
    const district = this.normalizeDistrict(params.district);

    // Validate division
    this.validateDivision(division);

    // Validate district
    this.validateDistrict(district, division);

    // Validate postal code
    this.validatePostalCode(params.postalCode);

    return new BangladeshAddress(
      params.line1.trim(),
      params.area.trim(),
      district,
      division,
      params.postalCode.trim(),
      params.line2?.trim()
    );
  }

  /**
   * Normalize division name (handle case variations)
   */
  private static normalizeDivision(division: string): string {
    const normalized = division.trim();
    const found = this.DIVISIONS.find(
      (d) => d.toLowerCase() === normalized.toLowerCase()
    );
    return found || normalized;
  }

  /**
   * Normalize district name
   */
  private static normalizeDistrict(district: string): string {
    const normalized = district.trim();
    const allDistricts = Object.values(this.DISTRICTS).flat();
    const found = allDistricts.find(
      (d) => d.toLowerCase() === normalized.toLowerCase()
    );
    return found || normalized;
  }

  /**
   * Validate division
   */
  private static validateDivision(division: string): void {
    if (!this.DIVISIONS.includes(division)) {
      throw new BadRequestException(
        `Invalid division: ${division}. Valid divisions: ${this.DIVISIONS.join(', ')}`
      );
    }
  }

  /**
   * Validate district belongs to division
   */
  private static validateDistrict(district: string, division: string): void {
    const validDistricts = this.DISTRICTS[division];
    if (!validDistricts) {
      throw new BadRequestException(`No districts found for division: ${division}`);
    }

    if (!validDistricts.includes(district)) {
      throw new BadRequestException(
        `District ${district} does not belong to ${division} division. Valid districts: ${validDistricts.join(', ')}`
      );
    }
  }

  /**
   * Validate postal code (4 digits)
   */
  private static validatePostalCode(postalCode: string): void {
    const normalized = postalCode.trim();
    if (!/^\d{4}$/.test(normalized)) {
      throw new BadRequestException('Postal code must be 4 digits');
    }
  }

  /**
   * Get address line 1
   */
  getLine1(): string {
    return this.line1;
  }

  /**
   * Get address line 2
   */
  getLine2(): string | undefined {
    return this.line2;
  }

  /**
   * Get area/city
   */
  getArea(): string {
    return this.area;
  }

  /**
   * Get district
   */
  getDistrict(): string {
    return this.district;
  }

  /**
   * Get division
   */
  getDivision(): string {
    return this.division;
  }

  /**
   * Get postal code
   */
  getPostalCode(): string {
    return this.postalCode;
  }

  /**
   * Get country
   */
  getCountry(): string {
    return this.country;
  }

  /**
   * Format address for display
   */
  format(): string {
    const parts = [
      this.line1,
      this.line2,
      this.area,
      this.district,
      this.division,
      this.postalCode,
      this.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Format for mailing label (multi-line)
   */
  formatMultiLine(): string {
    const lines = [
      this.line1,
      this.line2,
      `${this.area}, ${this.district}`,
      `${this.division} - ${this.postalCode}`,
      this.country,
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Compare with another address
   */
  equals(other: BangladeshAddress): boolean {
    if (!other) return false;
    return (
      this.line1 === other.line1 &&
      this.line2 === other.line2 &&
      this.area === other.area &&
      this.district === other.district &&
      this.division === other.division &&
      this.postalCode === other.postalCode
    );
  }

  /**
   * Check if address is in same district
   */
  isSameDistrict(other: BangladeshAddress): boolean {
    return this.district === other.district;
  }

  /**
   * Check if address is in same division
   */
  isSameDivision(other: BangladeshAddress): boolean {
    return this.division === other.division;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.format();
  }

  /**
   * JSON serialization
   */
  toJSON(): {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postalCode: string;
    country: string;
  } {
    return {
      line1: this.line1,
      line2: this.line2,
      area: this.area,
      district: this.district,
      division: this.division,
      postalCode: this.postalCode,
      country: this.country,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: {
    line1: string;
    line2?: string;
    area: string;
    district: string;
    division: string;
    postalCode: string;
  }): BangladeshAddress {
    return BangladeshAddress.create(json);
  }

  /**
   * Create from database value (can be null)
   */
  static fromNullable(
    address: {
      line1?: string;
      line2?: string;
      area?: string;
      district?: string;
      division?: string;
      postalCode?: string;
    } | null | undefined
  ): BangladeshAddress | null {
    if (!address?.line1) return null;
    return BangladeshAddress.create({
      line1: address.line1,
      line2: address.line2,
      area: address.area || '',
      district: address.district || '',
      division: address.division || '',
      postalCode: address.postalCode || '',
    });
  }

  /**
   * Get all valid divisions
   */
  static getAllDivisions(): string[] {
    return [...this.DIVISIONS];
  }

  /**
   * Get all districts for a division
   */
  static getDistrictsByDivision(division: string): string[] {
    const normalized = this.normalizeDivision(division);
    return this.DISTRICTS[normalized] || [];
  }

  /**
   * Get all districts
   */
  static getAllDistricts(): string[] {
    return Object.values(this.DISTRICTS).flat();
  }

  /**
   * Validate without creating object
   */
  static isValid(params: {
    line1: string;
    area: string;
    district: string;
    division: string;
    postalCode: string;
  }): boolean {
    try {
      BangladeshAddress.create(params);
      return true;
    } catch {
      return false;
    }
  }
}
