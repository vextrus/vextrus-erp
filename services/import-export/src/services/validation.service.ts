import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  async validateRow(
    row: any,
    rules?: any,
    rowNumber?: number,
  ): Promise<{ valid: boolean; errors: any[]; warnings: any[] }> {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!rules) {
      return { valid: true, errors, warnings };
    }

    // Check required fields
    if (rules.required_fields) {
      rules.required_fields.forEach(field => {
        if (!row[field] || row[field] === '') {
          errors.push({
            field,
            row: rowNumber,
            error: `Required field "${field}" is missing`,
          });
        }
      });
    }

    // Check field types
    if (rules.field_types) {
      Object.entries(rules.field_types).forEach(([field, type]) => {
        const value = row[field];
        if (value !== null && value !== undefined && value !== '') {
          const validation = this.validateFieldType(value, type as string);
          if (!validation.valid) {
            errors.push({
              field,
              row: rowNumber,
              value,
              error: validation.error,
            });
          }
        }
      });
    }

    // Check unique fields (would normally check against database)
    if (rules.unique_fields) {
      rules.unique_fields.forEach(field => {
        if (row[field]) {
          // This would check uniqueness against database
          // For now, just adding to warnings
          warnings.push({
            field,
            row: rowNumber,
            warning: `Uniqueness check pending for field "${field}"`,
          });
        }
      });
    }

    // Custom validators
    if (rules.custom_validators) {
      Object.entries(rules.custom_validators).forEach(([field, validator]) => {
        const value = row[field];
        const validation = this.runCustomValidator(value, validator as string);
        if (!validation.valid) {
          errors.push({
            field,
            row: rowNumber,
            value,
            error: validation.error,
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateFieldType(value: any, type: string): { valid: boolean; error?: string } {
    switch (type.toLowerCase()) {
      case 'string':
        return {
          valid: typeof value === 'string',
          error: 'Value must be a string',
        };

      case 'number':
      case 'integer':
      case 'float':
        const isNumber = !isNaN(value) && value !== '';
        const isInteger = type === 'integer' && Number.isInteger(Number(value));
        
        if (type === 'integer' && !isInteger) {
          return {
            valid: false,
            error: 'Value must be an integer',
          };
        }
        
        return {
          valid: isNumber,
          error: 'Value must be a number',
        };

      case 'boolean':
        const boolValues = ['true', 'false', '1', '0', 'yes', 'no', true, false, 1, 0];
        return {
          valid: boolValues.includes(value?.toString().toLowerCase()),
          error: 'Value must be a boolean',
        };

      case 'date':
      case 'datetime':
        const date = new Date(value);
        return {
          valid: !isNaN(date.getTime()),
          error: 'Value must be a valid date',
        };

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(value),
          error: 'Value must be a valid email address',
        };

      case 'phone':
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        return {
          valid: phoneRegex.test(value.toString().replace(/\s/g, '')),
          error: 'Value must be a valid phone number',
        };

      case 'url':
        try {
          new URL(value);
          return { valid: true };
        } catch {
          return {
            valid: false,
            error: 'Value must be a valid URL',
          };
        }

      case 'json':
        try {
          JSON.parse(value);
          return { valid: true };
        } catch {
          return {
            valid: false,
            error: 'Value must be valid JSON',
          };
        }

      case 'currency':
        const currencyRegex = /^[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?$/;
        return {
          valid: currencyRegex.test(value.toString()),
          error: 'Value must be a valid currency amount',
        };

      case 'percentage':
        const num = Number(value);
        return {
          valid: !isNaN(num) && num >= 0 && num <= 100,
          error: 'Value must be a percentage between 0 and 100',
        };

      default:
        return { valid: true };
    }
  }

  runCustomValidator(value: any, validator: string): { valid: boolean; error?: string } {
    try {
      // Parse validator as function or regex
      if (validator.startsWith('/') && validator.endsWith('/')) {
        // Regex validator
        const regex = new RegExp(validator.slice(1, -1));
        return {
          valid: regex.test(value?.toString() || ''),
          error: 'Value does not match the required pattern',
        };
      } else if (validator.startsWith('function')) {
        // Function validator
        const func = new Function('value', validator);
        const result = func(value);
        return {
          valid: result === true,
          error: typeof result === 'string' ? result : 'Custom validation failed',
        };
      } else {
        // Predefined validators
        return this.runPredefinedValidator(value, validator);
      }
    } catch (error: any) {
      return {
        valid: false,
        error: `Validator error: ${error.message}`,
      };
    }
  }

  private runPredefinedValidator(value: any, validator: string): { valid: boolean; error?: string } {
    switch (validator) {
      case 'not_empty':
        return {
          valid: value !== null && value !== undefined && value !== '',
          error: 'Value cannot be empty',
        };

      case 'alphanumeric':
        const alphaNumRegex = /^[a-zA-Z0-9]+$/;
        return {
          valid: alphaNumRegex.test(value?.toString() || ''),
          error: 'Value must be alphanumeric',
        };

      case 'alpha':
        const alphaRegex = /^[a-zA-Z]+$/;
        return {
          valid: alphaRegex.test(value?.toString() || ''),
          error: 'Value must contain only letters',
        };

      case 'numeric':
        return {
          valid: !isNaN(value) && value !== '',
          error: 'Value must be numeric',
        };

      case 'positive':
        return {
          valid: Number(value) > 0,
          error: 'Value must be positive',
        };

      case 'negative':
        return {
          valid: Number(value) < 0,
          error: 'Value must be negative',
        };

      case 'future_date':
        const date = new Date(value);
        return {
          valid: date > new Date(),
          error: 'Date must be in the future',
        };

      case 'past_date':
        const pastDate = new Date(value);
        return {
          valid: pastDate < new Date(),
          error: 'Date must be in the past',
        };

      case 'bangladeshi_phone':
        const bdPhoneRegex = /^(\+88)?01[3-9]\d{8}$/;
        return {
          valid: bdPhoneRegex.test(value?.toString().replace(/\s/g, '') || ''),
          error: 'Value must be a valid Bangladeshi phone number',
        };

      case 'tin':
        // Bangladesh TIN validation
        const tinRegex = /^\d{12}$/;
        return {
          valid: tinRegex.test(value?.toString() || ''),
          error: 'Value must be a valid 12-digit TIN',
        };

      default:
        return { valid: true };
    }
  }

  async validateBatch(
    rows: any[],
    rules?: any,
  ): Promise<{ valid: boolean; totalErrors: number; results: { valid: boolean; errors: any[]; warnings: any[] }[] }> {
    const results: { valid: boolean; errors: any[]; warnings: any[] }[] = [];
    let totalErrors = 0;

    for (let i = 0; i < rows.length; i++) {
      const validation = await this.validateRow(rows[i], rules, i + 1);
      results.push(validation);
      if (!validation.valid) {
        totalErrors++;
      }
    }

    return {
      valid: totalErrors === 0,
      totalErrors,
      results,
    };
  }

  detectDataTypes(rows: any[]): Record<string, string> {
    if (!rows.length) return {};

    const fields = Object.keys(rows[0]);
    const types = {};

    fields.forEach(field => {
      const samples = rows
        .map(row => row[field])
        .filter(v => v !== null && v !== undefined && v !== '');

      if (samples.length === 0) {
        types[field] = 'string';
        return;
      }

      // Detect type from samples
      const allNumbers = samples.every(v => !isNaN(v));
      const allIntegers = allNumbers && samples.every(v => Number.isInteger(Number(v)));
      const allBooleans = samples.every(v => ['true', 'false', '1', '0'].includes(v.toString().toLowerCase()));
      const allDates = samples.every(v => !isNaN(new Date(v).getTime()));
      const allEmails = samples.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));

      if (allBooleans) {
        types[field] = 'boolean';
      } else if (allIntegers) {
        types[field] = 'integer';
      } else if (allNumbers) {
        types[field] = 'float';
      } else if (allDates && !allNumbers) {
        types[field] = 'date';
      } else if (allEmails) {
        types[field] = 'email';
      } else {
        types[field] = 'string';
      }
    });

    return types;
  }
}