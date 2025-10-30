import { InputType, Field, Float, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, IsUUID } from 'class-validator';
import { ProductCategory, ProductType, UnitOfMeasure } from '../../entities/product.entity';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  sku: string;

  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  nameBn?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ defaultValue: 'goods' })
  @IsEnum(ProductType)
  type: ProductType;

  @Field()
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @Field()
  @IsEnum(UnitOfMeasure)
  unit: UnitOfMeasure;

  @Field()
  @IsString()
  uom: string; // Unit of Measure (deprecated, kept for compatibility)

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  costPrice: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  salePrice: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0)
  mrp?: number;

  @Field(() => Float, { defaultValue: 15 })
  @IsNumber()
  @Min(0)
  vatRate?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  hsCode?: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  minStock?: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @Field(() => Float, { defaultValue: 1 })
  @IsNumber()
  @Min(1)
  reorderQuantity?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  brand?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  model?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  preferredVendorId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  barcode?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isActive?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isTaxable?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isInventoryItem?: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  isServiceItem?: boolean;
}

@InputType()
export class UpdateProductInput extends PartialType(CreateProductInput) {}

@InputType()
export class ProductFilterInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  subCategory?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  brand?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isInventoryItem?: boolean;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isServiceItem?: boolean;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;
}