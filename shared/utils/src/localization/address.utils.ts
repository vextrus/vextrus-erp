export interface Division {
  id: string;
  name: string;
  nameBn: string;
}

export interface District {
  id: string;
  name: string;
  nameBn: string;
  divisionId: string;
}

export interface Upazila {
  id: string;
  name: string;
  nameBn: string;
  districtId: string;
}

export interface Union {
  id: string;
  name: string;
  nameBn: string;
  upazilaId: string;
}

export interface BangladeshAddress {
  houseNo?: string;
  roadNo?: string;
  block?: string;
  sector?: string;
  area?: string;
  union?: string;
  upazila: string;
  district: string;
  division: string;
  postalCode: string;
  country: string;
}

export interface FormattedAddress {
  line1: string;
  line2: string;
  line3: string;
  postalCode: string;
  country: string;
  formatted: string;
  formattedBn?: string;
}

export class AddressUtils {
  // Bangladesh administrative divisions
  private static readonly DIVISIONS: Division[] = [
    { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা' },
    { id: 'chittagong', name: 'Chittagong', nameBn: 'চট্টগ্রাম' },
    { id: 'rajshahi', name: 'Rajshahi', nameBn: 'রাজশাহী' },
    { id: 'khulna', name: 'Khulna', nameBn: 'খুলনা' },
    { id: 'barisal', name: 'Barisal', nameBn: 'বরিশাল' },
    { id: 'sylhet', name: 'Sylhet', nameBn: 'সিলেট' },
    { id: 'rangpur', name: 'Rangpur', nameBn: 'রংপুর' },
    { id: 'mymensingh', name: 'Mymensingh', nameBn: 'ময়মনসিংহ' }
  ];

  // Sample districts (in production, this would be comprehensive)
  private static readonly DISTRICTS: District[] = [
    { id: 'dhaka', name: 'Dhaka', nameBn: 'ঢাকা', divisionId: 'dhaka' },
    { id: 'gazipur', name: 'Gazipur', nameBn: 'গাজীপুর', divisionId: 'dhaka' },
    { id: 'narayanganj', name: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', divisionId: 'dhaka' },
    { id: 'cox_bazar', name: "Cox's Bazar", nameBn: 'কক্সবাজার', divisionId: 'chittagong' },
    { id: 'comilla', name: 'Comilla', nameBn: 'কুমিল্লা', divisionId: 'chittagong' },
    { id: 'jessore', name: 'Jessore', nameBn: 'যশোর', divisionId: 'khulna' },
    { id: 'bogra', name: 'Bogra', nameBn: 'বগুড়া', divisionId: 'rajshahi' }
  ];

  // Postal code mapping (sample data)
  private static readonly POSTAL_CODES: Record<string, string> = {
    'dhaka': '1000',
    'dhanmondi': '1209',
    'gulshan': '1212',
    'mirpur': '1216',
    'uttara': '1230',
    'gazipur': '1700',
    'narayanganj': '1400',
    'chittagong': '4000',
    'cox_bazar': '4700',
    'sylhet': '3100',
    'rajshahi': '6000',
    'khulna': '9000',
    'barisal': '8200',
    'rangpur': '5400',
    'mymensingh': '2200'
  };

  /**
   * Format Bangladesh address
   */
  static formatAddress(address: BangladeshAddress, locale: 'en' | 'bn' = 'en'): FormattedAddress {
    const parts: string[] = [];
    
    // Line 1: House/Road/Block details
    const line1Parts: string[] = [];
    if (address.houseNo) line1Parts.push(`House ${address.houseNo}`);
    if (address.roadNo) line1Parts.push(`Road ${address.roadNo}`);
    if (address.block) line1Parts.push(`Block ${address.block}`);
    if (address.sector) line1Parts.push(`Sector ${address.sector}`);
    
    const line1 = line1Parts.join(', ') || address.area || '';
    
    // Line 2: Area/Union, Upazila
    const line2Parts: string[] = [];
    if (address.area && line1Parts.length > 0) line2Parts.push(address.area);
    if (address.union) line2Parts.push(address.union);
    if (address.upazila) line2Parts.push(address.upazila);
    
    const line2 = line2Parts.join(', ');
    
    // Line 3: District, Division
    const line3 = `${address.district}, ${address.division}`;
    
    // Full formatted address
    const formatted = [
      line1,
      line2,
      line3,
      `${address.postalCode}, ${address.country}`
    ].filter(Boolean).join('\n');
    
    return {
      line1,
      line2,
      line3,
      postalCode: address.postalCode,
      country: address.country,
      formatted,
      formattedBn: locale === 'bn' ? this.toBengaliAddress(formatted) : undefined
    };
  }

  /**
   * Convert address to Bengali
   */
  private static toBengaliAddress(address: string): string {
    // Simple conversion - in production, use proper translation
    return address
      .replace(/House/g, 'বাড়ি')
      .replace(/Road/g, 'রোড')
      .replace(/Block/g, 'ব্লক')
      .replace(/Sector/g, 'সেক্টর')
      .replace(/Bangladesh/g, 'বাংলাদেশ');
  }

  /**
   * Validate Bangladesh address
   */
  static validateAddress(address: BangladeshAddress): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Required fields
    if (!address.upazila) errors.push('Upazila is required');
    if (!address.district) errors.push('District is required');
    if (!address.division) errors.push('Division is required');
    if (!address.postalCode) errors.push('Postal code is required');
    
    // Validate postal code format
    if (address.postalCode && !/^\d{4}$/.test(address.postalCode)) {
      errors.push('Postal code must be 4 digits');
    }
    
    // Validate division exists
    if (address.division) {
      const divisionExists = this.DIVISIONS.some(
        d => d.name.toLowerCase() === address.division.toLowerCase()
      );
      if (!divisionExists) {
        errors.push('Invalid division name');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get postal code for an area
   */
  static getPostalCode(area: string): string | null {
    const key = area.toLowerCase().replace(/[\s'-]/g, '_');
    return this.POSTAL_CODES[key] || null;
  }

  /**
   * Get all divisions
   */
  static getDivisions(locale: 'en' | 'bn' = 'en'): Array<{ id: string; name: string }> {
    return this.DIVISIONS.map(d => ({
      id: d.id,
      name: locale === 'bn' ? d.nameBn : d.name
    }));
  }

  /**
   * Get districts by division
   */
  static getDistrictsByDivision(divisionId: string, locale: 'en' | 'bn' = 'en'): Array<{ id: string; name: string }> {
    return this.DISTRICTS
      .filter(d => d.divisionId === divisionId)
      .map(d => ({
        id: d.id,
        name: locale === 'bn' ? d.nameBn : d.name
      }));
  }

  /**
   * Parse unstructured address text
   */
  static parseAddress(addressText: string): Partial<BangladeshAddress> {
    const parsed: Partial<BangladeshAddress> = {
      country: 'Bangladesh'
    };
    
    // Look for postal code (4 digits)
    const postalMatch = addressText.match(/\b\d{4}\b/);
    if (postalMatch) {
      parsed.postalCode = postalMatch[0];
    }
    
    // Look for division names
    for (const division of this.DIVISIONS) {
      if (addressText.toLowerCase().includes(division.name.toLowerCase())) {
        parsed.division = division.name;
        break;
      }
    }
    
    // Look for district names
    for (const district of this.DISTRICTS) {
      if (addressText.toLowerCase().includes(district.name.toLowerCase())) {
        parsed.district = district.name;
        
        // Set division if not already set
        if (!parsed.division) {
          const div = this.DIVISIONS.find(d => d.id === district.divisionId);
          if (div) parsed.division = div.name;
        }
        break;
      }
    }
    
    // Extract house and road numbers
    const houseMatch = addressText.match(/house[\s#-]*(\d+[\w]*)/i);
    if (houseMatch) parsed.houseNo = houseMatch[1];
    
    const roadMatch = addressText.match(/road[\s#-]*(\d+[\w]*)/i);
    if (roadMatch) parsed.roadNo = roadMatch[1];
    
    return parsed;
  }

  /**
   * Generate address label for shipping
   */
  static generateShippingLabel(address: BangladeshAddress, recipientName: string): string {
    const formatted = this.formatAddress(address);
    
    return `
╔════════════════════════════════════════╗
║ TO: ${recipientName.padEnd(34)} ║
║ ${formatted.line1.padEnd(38)} ║
║ ${formatted.line2.padEnd(38)} ║
║ ${formatted.line3.padEnd(38)} ║
║ ${address.postalCode} ${address.country.padEnd(29)} ║
╚════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Calculate approximate distance between two districts (in km)
   */
  static getApproximateDistance(district1: string, district2: string): number | null {
    // Simplified distance matrix (in production, use actual coordinates)
    const distances: Record<string, Record<string, number>> = {
      'dhaka': {
        'chittagong': 250,
        'sylhet': 240,
        'rajshahi': 260,
        'khulna': 180,
        'barisal': 180,
        'rangpur': 330,
        'mymensingh': 120
      },
      'chittagong': {
        'dhaka': 250,
        'sylhet': 280,
        'cox_bazar': 150
      }
    };
    
    const d1 = district1.toLowerCase();
    const d2 = district2.toLowerCase();
    
    if (d1 === d2) return 0;
    
    return distances[d1]?.[d2] || distances[d2]?.[d1] || null;
  }
}