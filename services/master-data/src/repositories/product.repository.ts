import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, In } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Product, ProductType, ProductStatus, ProductCategory, UnitOfMeasure } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    protected readonly repository: Repository<Product>
  ) {
    super(repository);
  }

  async findBySKU(tenantId: string, sku: string): Promise<Product | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        sku,
      },
    });
  }

  async findByBarcode(tenantId: string, barcode: string): Promise<Product | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        barcode,
      },
    });
  }

  async findByCategory(
    tenantId: string,
    category: ProductCategory,
    status?: ProductStatus
  ): Promise<Product[]> {
    const where: FindOptionsWhere<Product> = {
      tenant_id: tenantId,
      category,
    };

    if (status) {
      where.status = status;
    }

    return await this.repository.find({
      where,
      order: {
        name: 'ASC',
      },
    });
  }

  async findByType(
    tenantId: string,
    productType: ProductType
  ): Promise<Product[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        product_type: productType,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findByPriceRange(
    tenantId: string,
    minPrice: number,
    maxPrice: number
  ): Promise<Product[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        selling_price: Between(minPrice, maxPrice),
        status: ProductStatus.ACTIVE,
      },
      order: {
        selling_price: 'ASC',
      },
    });
  }

  async findLowStockProducts(
    tenantId: string,
    includeOutOfStock: boolean = true
  ): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('product.track_inventory = :track', { track: true });
    
    if (includeOutOfStock) {
      queryBuilder.andWhere('product.current_stock <= product.minimum_stock');
    } else {
      queryBuilder.andWhere('product.current_stock > 0');
      queryBuilder.andWhere('product.current_stock <= product.minimum_stock');
    }
    
    queryBuilder.orderBy('product.current_stock', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findProductsNeedingReorder(tenantId: string): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('product.track_inventory = :track', { track: true });
    queryBuilder.andWhere('product.current_stock <= product.reorder_level');
    queryBuilder.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });
    queryBuilder.orderBy('product.current_stock', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findExpiringProducts(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('product.is_perishable = :perishable', { perishable: true });
    queryBuilder.andWhere(`product.batch_tracking->>'expiry_tracking' = 'true'`);
    
    // This would need to be joined with batch tracking table in production
    queryBuilder.orderBy('product.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findVATExemptProducts(tenantId: string): Promise<Product[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        vat_exempt: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async searchProducts(
    tenantId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    
    if (searchTerm) {
      queryBuilder.andWhere(
        `(
          product.sku ILIKE :search OR
          product.name ILIKE :search OR
          product.name_bn ILIKE :search OR
          product.description ILIKE :search OR
          product.barcode ILIKE :search OR
          product.brand ILIKE :search OR
          product.model ILIKE :search
        )`,
        { search: `%${searchTerm}%` }
      );
    }
    
    queryBuilder.andWhere('product.status = :status', { status: ProductStatus.ACTIVE });
    queryBuilder.limit(limit);
    queryBuilder.orderBy('product.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async getTopSellingProducts(
    tenantId: string,
    limit: number = 10,
    dateFrom?: Date
  ): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('product.total_sold > 0');
    
    if (dateFrom) {
      queryBuilder.andWhere('product.last_sale_date >= :dateFrom', { dateFrom });
    }
    
    queryBuilder.orderBy('product.total_sold', 'DESC');
    queryBuilder.limit(limit);
    
    return await queryBuilder.getMany();
  }

  async getProductsByVendor(
    tenantId: string,
    vendorId: string
  ): Promise<Product[]> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere(':vendorId = ANY(product.preferred_vendors)', { vendorId });
    queryBuilder.orderBy('product.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async updateStock(
    tenantId: string,
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<boolean> {
    const product = await this.findOne(tenantId, productId);
    if (!product) {
      return false;
    }

    let newStock: number;
    switch (operation) {
      case 'add':
        newStock = product.current_stock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, product.current_stock - quantity);
        break;
      case 'set':
        newStock = quantity;
        break;
    }

    // Update status based on stock
    const status = newStock === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE;

    const result = await this.repository.update(
      { id: productId, tenant_id: tenantId },
      { 
        current_stock: newStock,
        status,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async updatePricing(
    tenantId: string,
    productId: string,
    pricing: {
      unitCost?: number;
      sellingPrice?: number;
      mrp?: number;
      wholesalePrice?: number;
      minimumPrice?: number;
    }
  ): Promise<boolean> {
    const updateData: any = { updated_at: new Date() };

    if (pricing.unitCost !== undefined) {
      updateData.unit_cost = pricing.unitCost;
    }
    if (pricing.sellingPrice !== undefined) {
      updateData.selling_price = pricing.sellingPrice;
    }
    if (pricing.mrp !== undefined) {
      updateData.mrp = pricing.mrp;
    }
    if (pricing.wholesalePrice !== undefined) {
      updateData.wholesale_price = pricing.wholesalePrice;
    }
    if (pricing.minimumPrice !== undefined) {
      updateData.minimum_price = pricing.minimumPrice;
    }

    const result = await this.repository.update(
      { id: productId, tenant_id: tenantId },
      updateData
    );

    return result.affected ? result.affected > 0 : false;
  }

  async updateSalesMetrics(
    tenantId: string,
    productId: string,
    quantitySold: number,
    saleDate: Date = new Date()
  ): Promise<boolean> {
    const product = await this.findOne(tenantId, productId);
    if (!product) {
      return false;
    }

    const result = await this.repository.update(
      { id: productId, tenant_id: tenantId },
      {
        total_sold: product.total_sold + quantitySold,
        last_sale_date: saleDate,
        current_stock: Math.max(0, product.current_stock - quantitySold),
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async updatePurchaseMetrics(
    tenantId: string,
    productId: string,
    quantityPurchased: number,
    purchaseDate: Date = new Date()
  ): Promise<boolean> {
    const product = await this.findOne(tenantId, productId);
    if (!product) {
      return false;
    }

    const result = await this.repository.update(
      { id: productId, tenant_id: tenantId },
      {
        total_purchased: product.total_purchased + quantityPurchased,
        last_purchase_date: purchaseDate,
        current_stock: product.current_stock + quantityPurchased,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async getProductStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    lowStock: number;
    byCategory: Record<ProductCategory, number>;
    byType: Record<ProductType, number>;
    totalValue: number;
    avgPrice: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });

    // Get counts by status
    const statusCounts = await queryBuilder
      .select('product.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.status')
      .getRawMany();

    // Get counts by category
    const categoryCounts = await queryBuilder
      .select('product.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.category')
      .getRawMany();

    // Get counts by type
    const typeCounts = await queryBuilder
      .select('product.product_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.product_type')
      .getRawMany();

    // Get low stock count
    const lowStockCount = await queryBuilder
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.current_stock <= product.minimum_stock')
      .andWhere('product.current_stock > 0')
      .andWhere('product.track_inventory = true')
      .getCount();

    // Get inventory value and average price
    const valueStats = await queryBuilder
      .select('SUM(product.current_stock * product.unit_cost)', 'totalValue')
      .addSelect('AVG(product.selling_price)', 'avgPrice')
      .where('product.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      outOfStock: 0,
      lowStock: lowStockCount,
      byCategory: {} as Record<ProductCategory, number>,
      byType: {} as Record<ProductType, number>,
      totalValue: parseFloat(valueStats?.totalValue || '0'),
      avgPrice: parseFloat(valueStats?.avgPrice || '0'),
    };

    statusCounts.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;
      
      switch (row.status) {
        case ProductStatus.ACTIVE:
          stats.active = count;
          break;
        case ProductStatus.INACTIVE:
          stats.inactive = count;
          break;
        case ProductStatus.OUT_OF_STOCK:
          stats.outOfStock = count;
          break;
      }
    });

    categoryCounts.forEach(row => {
      stats.byCategory[row.category as ProductCategory] = parseInt(row.count);
    });

    typeCounts.forEach(row => {
      stats.byType[row.type as ProductType] = parseInt(row.count);
    });

    return stats;
  }

  async getInventoryValuation(
    tenantId: string,
    warehouseId?: string
  ): Promise<{
    totalQuantity: number;
    totalCostValue: number;
    totalRetailValue: number;
    byCategory: Record<ProductCategory, {
      quantity: number;
      costValue: number;
      retailValue: number;
    }>;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    
    queryBuilder.where('product.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('product.track_inventory = true');
    
    if (warehouseId) {
      queryBuilder.andWhere(`product.warehouse_locations @> '[{"warehouse_id": "${warehouseId}"}]'`);
    }

    const products = await queryBuilder.getMany();

    const valuation = {
      totalQuantity: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
      byCategory: {} as Record<ProductCategory, {
        quantity: number;
        costValue: number;
        retailValue: number;
      }>,
    };

    products.forEach(product => {
      const quantity = product.current_stock;
      const costValue = quantity * product.unit_cost;
      const retailValue = quantity * product.selling_price;

      valuation.totalQuantity += quantity;
      valuation.totalCostValue += costValue;
      valuation.totalRetailValue += retailValue;

      if (!valuation.byCategory[product.category]) {
        valuation.byCategory[product.category] = {
          quantity: 0,
          costValue: 0,
          retailValue: 0,
        };
      }

      valuation.byCategory[product.category].quantity += quantity;
      valuation.byCategory[product.category].costValue += costValue;
      valuation.byCategory[product.category].retailValue += retailValue;
    });

    return valuation;
  }
}