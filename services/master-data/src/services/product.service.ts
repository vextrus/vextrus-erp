import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
  ) {}

  async create(tenantId: string, createProductDto: CreateProductDto): Promise<Product> {
    try {
      return await this.productRepository.create({
        ...createProductDto,
        tenant_id: tenantId,
      } as any);
    } catch (error) {
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        throw new BadRequestException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async findAll(tenantId: string, query: any): Promise<any> {
    // For now, return a simple implementation
    const products = await this.productRepository.findAll(tenantId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return {
      items: paginatedProducts,
      total: products.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(products.length / limit),
    };
  }

  async findOne(tenantId: string, id: string): Promise<Product> {
    const product = await this.productRepository.findOne(tenantId, id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Federation-specific method that bypasses tenant check
   * Used by GraphQL federation __resolveReference resolver
   */
  async findOneForFederation(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async findBySku(tenantId: string, sku: string): Promise<Product> {
    const product = await this.productRepository.findBySKU(tenantId, sku);
    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }
    return product;
  }

  async update(tenantId: string, id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(tenantId, id);
    
    try {
      const updated = await this.productRepository.update(tenantId, id, updateProductDto as any);
      if (!updated) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return updated;
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async activate(tenantId: string, id: string): Promise<Product> {
    const updated = await this.productRepository.update(tenantId, id, { status: ProductStatus.ACTIVE });
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updated;
  }

  async deactivate(tenantId: string, id: string): Promise<Product> {
    const updated = await this.productRepository.update(tenantId, id, { status: ProductStatus.INACTIVE });
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return updated;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const product = await this.findOne(tenantId, id);
    
    // TODO: Check if product has related transactions/orders
    
    await this.productRepository.softDelete(tenantId, id);
  }

  async findActive(tenantId: string): Promise<Product[]> {
    return this.productRepository.findAll(tenantId, {
      where: { status: ProductStatus.ACTIVE }
    });
  }

  async findByCategory(tenantId: string, category: string): Promise<Product[]> {
    return this.productRepository.findAll(tenantId, {
      where: { category: category as any }
    });
  }

  async bulkImport(
    tenantId: string,
    products: Array<Partial<Product>>
  ): Promise<{ jobId: string; message: string }> {
    // For now, return a placeholder response
    // This would typically start a background job
    const jobId = `bulk-import-${Date.now()}`;
    
    return {
      jobId,
      message: `Bulk import job ${jobId} started for ${products.length} products`,
    };
  }

  async updateInventory(
    tenantId: string,
    id: string,
    quantity: number,
    operation: 'increase' | 'decrease' | 'set'
  ): Promise<Product> {
    const product = await this.findOne(tenantId, id);

    let newQuantity = product.current_stock || 0;

    switch (operation) {
      case 'increase':
        newQuantity += quantity;
        break;
      case 'decrease':
        newQuantity -= quantity;
        if (newQuantity < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case 'set':
        newQuantity = quantity;
        break;
    }

    return this.productRepository.update(tenantId, id, {
      current_stock: newQuantity,
      status: newQuantity === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE
    } as any);
  }

  async calculateVat(price: number, vatRate?: number): Promise<number> {
    // Bangladesh VAT is typically 15%
    const rate = vatRate || 0.15;
    return price * rate;
  }
}