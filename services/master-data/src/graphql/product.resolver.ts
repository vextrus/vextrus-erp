import { Resolver, Query, Mutation, Args, ID, ResolveReference } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { ProductService } from '../services/product.service';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.input';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { PaginatedProductResponse } from './dto/product.response';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @ResolveReference()
  async __resolveReference(reference: { __typename: string; id: string }): Promise<Product> {
    // For federation, we need to bypass tenant context
    // The reference.id should be sufficient to identify the entity uniquely
    return this.productService.findOneForFederation(reference.id);
  }

  @Query(() => PaginatedProductResponse, { name: 'products' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Args('filter', { nullable: true }) filter?: ProductFilterInput,
    @Args('page', { type: () => Number, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit?: number,
  ): Promise<PaginatedProductResponse> {
    return this.productService.findAll(tenant.id, {
      ...filter,
      page,
      limit,
    });
  }

  @Query(() => Product, { name: 'product' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Product> {
    return this.productService.findOne(tenant.id, id);
  }

  @Query(() => Product, { name: 'productBySku', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findBySku(
    @CurrentTenant() tenant: TenantContext,
    @Args('sku') sku: string,
  ): Promise<Product> {
    return this.productService.findBySku(tenant.id, sku);
  }

  @Query(() => [Product], { name: 'productsByCategory' })
  @UseGuards(JwtAuthGuard)
  async findByCategory(
    @CurrentTenant() tenant: TenantContext,
    @Args('category') category: string,
  ): Promise<Product[]> {
    return this.productService.findByCategory(tenant.id, category);
  }

  @Mutation(() => Product, { name: 'createProduct' })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Args('input') input: CreateProductInput,
  ): Promise<Product> {
    const productData: any = {
      ...input,
      product_type: input.type,
      name_bn: input.nameBn,
      sub_category: input.subCategory,
      unit_cost: input.costPrice,
      selling_price: input.salePrice || input.unitPrice,
      vat_rate: input.vatRate || 15, // Default to 15% Bangladesh VAT
    };
    return this.productService.create(tenant.id, productData);
  }

  @Mutation(() => Product, { name: 'updateProduct' })
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProductInput,
  ): Promise<Product> {
    return this.productService.update(tenant.id, id, input);
  }

  @Mutation(() => Boolean, { name: 'deleteProduct' })
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.productService.remove(tenant.id, id);
    return true;
  }

  @Mutation(() => Product, { name: 'updateProductInventory' })
  @UseGuards(JwtAuthGuard)
  async updateInventory(
    @CurrentTenant() tenant: TenantContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('quantity', { type: () => Number }) quantity: number,
    @Args('operation', { type: () => String }) operation: 'add' | 'subtract' | 'set',
  ): Promise<Product> {
    const mappedOperation = operation === 'add' ? 'increase' : operation === 'subtract' ? 'decrease' : 'set';
    return this.productService.updateInventory(tenant.id, id, quantity, mappedOperation);
  }

  @Query(() => Number, { name: 'calculateProductVat' })
  @UseGuards(JwtAuthGuard)
  async calculateVat(
    @Args('price', { type: () => Number }) price: number,
    @Args('vatRate', { type: () => Number, nullable: true, defaultValue: 15 }) vatRate?: number,
  ): Promise<number> {
    return this.productService.calculateVat(price, vatRate);
  }
}