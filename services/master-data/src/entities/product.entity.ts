import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';
import { BaseEntity } from './base.entity';
import { IsOptional, Min, Max } from 'class-validator';

export enum ProductType {
  GOODS = 'goods',
  SERVICE = 'service',
  BUNDLE = 'bundle',
  RAW_MATERIAL = 'raw_material',
  FINISHED_GOODS = 'finished_goods',
  CONSUMABLE = 'consumable',
  ASSET = 'asset'
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock'
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
  BOX = 'box',
  CARTON = 'carton',
  BAG = 'bag',
  ROLL = 'roll',
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
  TRIP = 'trip'
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
  
  // Office
  STATIONERY = 'stationery',
  IT_EQUIPMENT = 'it_equipment',
  FURNITURE = 'furniture',
  
  // Others
  CONSUMABLES = 'consumables',
  CHEMICALS = 'chemicals',
  FUEL = 'fuel',
  OTHER = 'other'
}

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('products')
@Index(['tenant_id', 'sku'], { unique: true })
@Index(['tenant_id', 'barcode'])
@Index(['tenant_id', 'category'])
@Index(['tenant_id', 'status'])
@Index(['tenant_id', 'hs_code'])
export class Product extends BaseEntity {
  @Field(() => ID)
  id: string;

  @Field()
  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string; // Stock Keeping Unit

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  name_bn: string; // Name in Bengali

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description_bn: string; // Description in Bengali

  @Field()
  @Column({ type: 'enum', enum: ProductType, default: ProductType.GOODS })
  product_type: ProductType;

  @Field()
  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sub_category: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Field()
  @Column({ type: 'enum', enum: UnitOfMeasure })
  unit: UnitOfMeasure;

  @Field({ nullable: true })
  @Column({ type: 'enum', enum: UnitOfMeasure, nullable: true })
  secondary_unit: UnitOfMeasure;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  unit_conversion_factor: number; // How many primary units in secondary unit

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode: string;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 20, nullable: true })
  hs_code: string; // Harmonized System Code for customs

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.00 })
  @Min(0)
  @Max(100)
  vat_rate: number; // VAT rate percentage (default 15% for Bangladesh)

  @Field()
  @Column({ type: 'boolean', default: false })
  vat_exempt: boolean;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  vat_exemption_reason: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Min(0)
  @Max(100)
  ait_rate: number; // Advance Income Tax rate

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Min(0)
  @Max(100)
  customs_duty_rate: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  unit_cost: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  selling_price: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  mrp: number; // Maximum Retail Price

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  wholesale_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  minimum_price: number;

  @Column({ type: 'jsonb', nullable: true })
  pricing_tiers: Array<{
    quantity_min: number;
    quantity_max?: number;
    price: number;
    discount_percentage?: number;
  }>;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  current_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  minimum_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  maximum_stock: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  reorder_level: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  reorder_quantity: number;

  @Column({ type: 'int', default: 0 })
  lead_time_days: number; // Procurement lead time

  @Column({ type: 'jsonb', nullable: true })
  specifications: Record<string, any>; // Technical specifications

  @Column({ type: 'jsonb', nullable: true })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    volume?: number;
    unit?: string;
  };

  @Column({ type: 'varchar', array: true, default: '{}' })
  preferred_vendors: string[]; // Array of vendor IDs

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country_of_origin: string;

  @Column({ type: 'boolean', default: true })
  is_purchasable: boolean;

  @Column({ type: 'boolean', default: true })
  is_saleable: boolean;

  @Column({ type: 'boolean', default: false })
  is_manufactured: boolean; // Produced in-house

  @Column({ type: 'boolean', default: true })
  track_inventory: boolean;

  @Column({ type: 'boolean', default: false })
  is_perishable: boolean;

  @Column({ type: 'int', nullable: true })
  shelf_life_days: number;

  @Column({ type: 'jsonb', nullable: true })
  batch_tracking: {
    enabled: boolean;
    expiry_tracking: boolean;
    serial_tracking: boolean;
  };

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ type: 'jsonb', nullable: true })
  warehouse_locations: Array<{
    warehouse_id: string;
    location: string;
    quantity: number;
  }>;

  @Column({ type: 'varchar', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'varchar', array: true, default: '{}' })
  images: string[]; // Array of image URLs

  @Column({ type: 'jsonb', nullable: true })
  certifications: Array<{
    name: string;
    number: string;
    issuer: string;
    issue_date: Date;
    expiry_date?: Date;
  }>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accounting_code: string; // Link to Chart of Accounts

  @Column({ type: 'varchar', length: 100, nullable: true })
  revenue_account: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  expense_account: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  custom_fields: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  total_sold: number;

  @Column({ type: 'int', default: 0 })
  total_purchased: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @Min(0)
  @Max(5)
  quality_rating: number;

  @Column({ type: 'date', nullable: true })
  last_purchase_date: Date;

  @Column({ type: 'date', nullable: true })
  last_sale_date: Date;
}