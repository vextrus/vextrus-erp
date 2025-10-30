import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Matches, MinLength, MaxLength, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductType {
  GOODS = 'goods',
  SERVICE = 'service',
  BUNDLE = 'bundle',
  RAW_MATERIAL = 'raw_material',
  FINISHED_GOODS = 'finished_goods',
  CONSUMABLE = 'consumable',
  ASSET = 'asset'
}

export enum ProductCategory {
  // Construction Materials
  CEMENT = 'cement',
  STEEL = 'steel',
  BRICK = 'brick',
  SAND = 'sand',
  STONE = 'stone',
  TILES = 'tiles',
  PAINT = 'paint',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  GLASS = 'glass',
  WOOD = 'wood',
  HARDWARE = 'hardware',

  // Equipment
  MACHINERY = 'machinery',
  TOOLS = 'tools',
  SAFETY_EQUIPMENT = 'safety_equipment',

  // Services
  LABOR = 'labor',
  TRANSPORTATION = 'transportation',
  CONSULTANCY = 'consultancy',
  MAINTENANCE = 'maintenance',
  SERVICES = 'services',

  // Office
  OFFICE_SUPPLIES = 'office_supplies',
  STATIONERY = 'stationery',
  IT_EQUIPMENT = 'it_equipment',
  FURNITURE = 'furniture',

  // Others
  CONSUMABLES = 'consumables',
  CHEMICALS = 'chemicals',
  FUEL = 'fuel',
  OTHER = 'other',
}

export enum UnitOfMeasure {
  // Weight
  KG = 'kg',
  GRAM = 'gram',
  TON = 'ton',
  POUND = 'pound',

  // Volume
  LITER = 'liter',
  ML = 'ml',
  GALLON = 'gallon',
  CUBIC_METER = 'cubic_meter',
  CUBIC_FEET = 'cubic_feet',

  // Length
  METER = 'meter',
  CM = 'cm',
  FEET = 'feet',
  INCH = 'inch',

  // Area
  SQUARE_METER = 'square_meter',
  SQUARE_FEET = 'square_feet',
  ACRE = 'acre',
  HECTARE = 'hectare',

  // Count
  PIECE = 'piece',
  DOZEN = 'dozen',
  GROSS = 'gross',
  PACK = 'pack',
  CARTON = 'carton',
  BAG = 'bag',
  ROLL = 'roll',
  BOX = 'box',
  SET = 'set',

  // Time
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',

  // Construction specific
  CFT = 'cft', // Cubic feet
  SFT = 'sft', // Square feet
  RFT = 'rft', // Running feet
  BUNDLE = 'bundle',
  TRUCK = 'truck',
  TRIP = 'trip',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Stock Keeping Unit', example: 'SKU-001' })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/, { message: 'SKU must contain only uppercase letters, numbers, and hyphens' })
  sku: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Product name in Bengali' })
  @IsOptional()
  @IsString()
  nameInBengali?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ description: 'Product category', enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ description: 'Unit of measure', enum: UnitOfMeasure })
  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;

  @ApiPropertyOptional({ description: 'HS Code for customs', example: '2523.29.00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}\.\d{2}\.\d{2}$/, { message: 'HS Code must be in format XXXX.XX.XX' })
  hsCode?: string;

  @ApiProperty({ description: 'VAT rate (0.15 for 15%)', example: 0.15 })
  @IsNumber()
  @Min(0)
  @Max(1)
  vatRate: number;

  @ApiPropertyOptional({ description: 'AIT rate for Advance Income Tax', example: 0.03 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aitRate?: number;

  @ApiProperty({ description: 'Unit price in BDT' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Cost price in BDT' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Reorder level for inventory' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ description: 'Lead time in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTime?: number;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'Country of origin' })
  @IsOptional()
  @IsString()
  countryOfOrigin?: string;

  @ApiPropertyOptional({ description: 'Is product active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Is VAT exempt', default: false })
  @IsOptional()
  @IsBoolean()
  isVatExempt?: boolean = false;

  @ApiPropertyOptional({ description: 'Additional specifications' })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  // @ApiPropertyOptional({ description: 'Additional metadata' })
  // @IsOptional()
  // @IsObject()
  // metadata?: Record<string, any>;
}