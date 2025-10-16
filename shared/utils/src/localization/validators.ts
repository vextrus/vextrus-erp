import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates Bangladeshi phone numbers
 * Formats: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
 * Valid operators: 013, 014, 015, 016, 017, 018, 019
 */
export function IsBangladeshiPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBangladeshiPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Bangladesh phone: +8801XXXXXXXXX or 8801XXXXXXXXX or 01XXXXXXXXX
          return /^(\+8801|8801|01)[3-9]\d{8}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Bangladeshi phone number`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh National ID (NID)
 * Valid formats: 10 digits (old), 13 digits, or 17 digits (new smart card)
 */
export function IsNID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNID',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // NID can be 10, 13, or 17 digits
          return /^(\d{10}|\d{13}|\d{17})$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid National ID (10, 13, or 17 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh Tax Identification Number (TIN)
 * Format: 12 digits
 */
export function IsTIN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTIN',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // TIN is typically 12 digits
          return /^\d{12}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid TIN (12 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh Business Identification Number (BIN)
 * Format: 9 digits
 */
export function IsBIN(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBIN',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // BIN is 9 digits
          return /^\d{9}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid BIN (9 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh bank account numbers
 * Different banks have different formats, but most are 13-17 digits
 */
export function IsBangladeshBankAccount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBangladeshBankAccount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Most Bangladesh bank accounts are 13-17 digits
          return /^\d{13,17}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid bank account number (13-17 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh postal codes
 * Format: 4 digits
 */
export function IsBangladeshPostalCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBangladeshPostalCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Bangladesh postal codes are 4 digits
          return /^\d{4}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Bangladesh postal code (4 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh VAT registration number
 * Format: 11 or 17 digits
 */
export function IsVATRegistration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isVATRegistration',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // VAT registration can be 11 or 17 digits
          return /^(\d{11}|\d{17})$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid VAT registration number (11 or 17 digits)`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh trade license number
 * Format varies by city corporation/municipality
 */
export function IsTradeLicense(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTradeLicense',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Trade license format: alphanumeric, typically 6-20 characters
          return /^[A-Z0-9]{6,20}$/.test(value.toUpperCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid trade license number`;
        }
      }
    });
  };
}

/**
 * Validates Bangladesh driving license number
 */
export function IsDrivingLicense(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDrivingLicense',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Driving license format: District code (2-3 chars) + digits
          return /^[A-Z]{2,3}-\d{6,12}$/.test(value.toUpperCase());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid driving license number`;
        }
      }
    });
  };
}

/**
 * Validates BDT amount format
 */
export function IsBDTAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBDTAmount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === 'number') {
            // Check if it's a valid monetary amount (2 decimal places max)
            return /^\d+(\.\d{1,2})?$/.test(value.toString());
          }
          if (typeof value === 'string') {
            // Allow currency symbol and commas
            return /^[৳]?\s*[\d,]+(\.\d{1,2})?$/.test(value);
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid BDT amount`;
        }
      }
    });
  };
}

// Utility validation functions (not decorators)

/**
 * Validate Bangladeshi phone number
 */
export function validateBangladeshiPhone(phone: string): boolean {
  return /^(\+8801|8801|01)[3-9]\d{8}$/.test(phone);
}

/**
 * Format Bangladeshi phone number to international format
 */
export function formatBangladeshiPhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return `+88${cleaned}`;
  }
  
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return `+880${cleaned}`;
  }
  
  return null;
}

/**
 * Validate NID
 */
export function validateNID(nid: string): boolean {
  return /^(\d{10}|\d{13}|\d{17})$/.test(nid);
}

/**
 * Validate TIN
 */
export function validateTIN(tin: string): boolean {
  return /^\d{12}$/.test(tin);
}

/**
 * Validate BIN
 */
export function validateBIN(bin: string): boolean {
  return /^\d{9}$/.test(bin);
}

/**
 * Validate bank account
 */
export function validateBankAccount(account: string): boolean {
  return /^\d{13,17}$/.test(account);
}

/**
 * Validate postal code
 */
export function validatePostalCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/**
 * District codes for validation
 */
export const BANGLADESH_DISTRICTS = [
  'DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'KHULNA', 'BARISAL', 'SYLHET',
  'RANGPUR', 'MYMENSINGH', 'COMILLA', 'NARAYANGANJ', 'GAZIPUR', 'BOGRA',
  'DINAJPUR', 'JESSORE', 'PABNA', 'TANGAIL', 'JAMALPUR', 'NARSINGDI',
  'FARIDPUR', 'GOPALGANJ', 'KISHOREGANJ', 'MADARIPUR', 'MANIKGANJ',
  'MUNSHIGANJ', 'RAJBARI', 'SHARIATPUR', 'BANDARBAN', 'BRAHMANBARIA',
  'CHANDPUR', 'COXSBAZAR', 'FENI', 'KHAGRACHHARI', 'LAKSHMIPUR',
  'NOAKHALI', 'RANGAMATI', 'HABIGANJ', 'MOULVIBAZAR', 'SUNAMGANJ',
  'BAGERHAT', 'CHUADANGA', 'JHENAIDAH', 'KUSHTIA', 'MAGURA', 'MEHERPUR',
  'NARAIL', 'SATKHIRA', 'BARGUNA', 'BHOLA', 'JHALOKATI', 'PATUAKHALI',
  'PIROJPUR', 'KURIGRAM', 'LALMONIRHAT', 'NILPHAMARI', 'PANCHAGARH',
  'THAKURGAON', 'NATORE', 'CHAPAINAWABGANJ', 'NAOGAON', 'SIRAJGANJ',
  'NETROKONA', 'SHERPUR'
];

/**
 * Validate if a district name is valid
 */
export function isValidDistrict(district: string): boolean {
  return BANGLADESH_DISTRICTS.includes(district.toUpperCase());
}

/**
 * Mobile operator prefixes in Bangladesh
 */
export const MOBILE_OPERATORS = {
  GRAMEENPHONE: ['013', '017'],
  ROBI: ['018', '016'],
  BANGLALINK: ['019', '014'],
  TELETALK: ['015']
};

/**
 * Get mobile operator from phone number
 */
export function getMobileOperator(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');
  let prefix = '';
  
  if (cleaned.startsWith('8801')) {
    prefix = cleaned.substring(2, 5);
  } else if (cleaned.startsWith('01')) {
    prefix = cleaned.substring(0, 3);
  } else {
    return null;
  }
  
  for (const [operator, prefixes] of Object.entries(MOBILE_OPERATORS)) {
    if (prefixes.includes(prefix)) {
      return operator;
    }
  }
  
  return null;
}