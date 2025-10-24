# Input Validation Patterns

Reference for Security First Skill - DTO and GraphQL Input Validation

---

## DTO Validation with Class-Validator

### Complete DTO Example
```typescript
import {
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsEmail,
  IsOptional,
  Min,
  Max,
  Length,
  Matches,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  customerId: string;

  @IsString()
  @Length(1, 20)
  @Matches(/^INV-\d{4}-\d{3}$/)
  invoiceNumber: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsEmail()
  customerEmail: string;

  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  items: InvoiceItemDto[];

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

export class InvoiceItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  @Max(10000)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
```

### Common Validators

**String Validation**:
- `@IsString()` - Must be string
- `@Length(min, max)` - Length constraints
- `@Matches(/regex/)` - Pattern matching
- `@IsEmail()` - Valid email format
- `@IsUrl()` - Valid URL format

**Number Validation**:
- `@IsNumber()` - Must be number
- `@Min(value)` - Minimum value
- `@Max(value)` - Maximum value
- `@IsInt()` - Must be integer
- `@IsPositive()` - Must be positive

**Type Validation**:
- `@IsUUID()` - Valid UUID
- `@IsEnum(enum)` - Must be enum value
- `@IsBoolean()` - Must be boolean
- `@IsDate()` - Must be date

**Object/Array Validation**:
- `@ValidateNested()` - Validate nested object
- `@Type(() => Class)` - Transform to class
- `@ArrayMinSize(n)` - Min array length
- `@ArrayMaxSize(n)` - Max array length

---

## GraphQL Input Validation

### Input Type with Validation
```typescript
@InputType()
export class CreateInvoiceInput {
  @Field()
  @IsUUID()
  customerId: string;

  @Field()
  @IsString()
  @Length(1, 20)
  @Matches(/^INV-\d{4}-\d{3}$/)
  invoiceNumber: string;

  @Field(() => [InvoiceItemInput])
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemInput)
  @ArrayMinSize(1)
  items: InvoiceItemInput[];
}

@InputType()
export class InvoiceItemInput {
  @Field()
  @IsUUID()
  productId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
```

### Automatic Validation in Resolver
```typescript
@Mutation(() => InvoicePayload)
async createInvoice(
  @Args('input') input: CreateInvoiceInput, // Auto-validated by NestJS
) {
  // Input is already validated here
  // If validation fails, BadRequestException thrown automatically
  return this.commandBus.execute(new CreateInvoiceCommand(input));
}
```

---

## Sanitization

### XSS Prevention
```typescript
import { escape } from 'validator';
import { Transform } from 'class-transformer';

export class SanitizedDto {
  @IsString()
  @Transform(({ value }) => escape(value)) // Escape HTML entities
  notes: string;

  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @Length(1, 100)
  name: string;
}
```

### Bangladesh-Specific Validation
```typescript
export class BangladeshTaxDto {
  @IsString()
  @Length(13, 13)
  @Matches(/^\d{13}$/) // 13-digit TIN
  tin: string;

  @IsString()
  @Length(12, 12)
  @Matches(/^\d{12}$/) // 12-digit BIN
  bin: string;

  @IsNumber()
  @IsIn([15, 7.5, 5, 0]) // Valid VAT rates in Bangladesh
  vatRate: number;
}
```

---

## Custom Validators

### Unique Value Validator
```typescript
@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments) {
    const [entity, property] = args.constraints;
    const repository = this.dataSource.getRepository(entity);

    const count = await repository.count({
      where: { [property]: value },
    });

    return count === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} already exists`;
  }
}

// Usage
export function IsUnique(entity: any, property: string) {
  return ValidatorDecorator(IsUniqueConstraint, [entity, property]);
}

export class CreateCustomerDto {
  @IsEmail()
  @IsUnique(Customer, 'email')
  email: string;
}
```

---

## Error Handling

### Validation Error Response
```typescript
{
  "statusCode": 400,
  "message": [
    "customerId must be a UUID",
    "amount must not be less than 0",
    "items must contain at least 1 elements"
  ],
  "error": "Bad Request"
}
```

### Custom Error Messages
```typescript
export class CreateInvoiceDto {
  @IsUUID({ message: 'Customer ID must be a valid UUID' })
  customerId: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0, { message: 'Amount cannot be negative' })
  amount: number;
}
```

---

## Best Practices

1. **Validate ALL inputs** - Never trust user input
2. **Use whitelist** - Enable `forbidNonWhitelisted: true` in ValidationPipe
3. **Transform types** - Enable `transform: true` for automatic type conversion
4. **Custom validators** - For complex business rules
5. **Sanitize strings** - Prevent XSS attacks
6. **Validate arrays** - Check min/max size
7. **Nested validation** - Use `@ValidateNested()` for nested objects
