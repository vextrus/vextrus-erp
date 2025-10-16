import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { Product } from '../entities/product.entity';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: Product })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productService.create(tenant.id, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of products', type: [Product] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query(ValidationPipe) query: ProductQueryDto,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    return this.productService.findAll(tenant.id, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({ status: 200, description: 'List of active products', type: [Product] })
  async findActive(
    @CurrentTenant() tenant: TenantContext,
  ): Promise<Product[]> {
    return this.productService.findActive(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productService.findOne(tenant.id, id);
  }

  @Get('by-sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiResponse({ status: 200, description: 'Product found', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySku(
    @CurrentTenant() tenant: TenantContext,
    @Param('sku') sku: string,
  ): Promise<Product> {
    return this.productService.findBySku(tenant.id, sku);
  }

  @Get('by-category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products found', type: [Product] })
  async findByCategory(
    @CurrentTenant() tenant: TenantContext,
    @Param('category') category: string,
  ): Promise<Product[]> {
    return this.productService.findByCategory(tenant.id, category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(tenant.id, id, updateProductDto);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate product' })
  @ApiResponse({ status: 200, description: 'Product activated successfully', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async activate(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productService.activate(tenant.id, id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate product' })
  @ApiResponse({ status: 200, description: 'Product deactivated successfully', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deactivate(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Product> {
    return this.productService.deactivate(tenant.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    await this.productService.remove(tenant.id, id);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk import products' })
  @ApiResponse({ status: 202, description: 'Import job started' })
  async bulkImport(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: { products: CreateProductDto[] },
  ): Promise<{ jobId: string; message: string }> {
    return this.productService.bulkImport(tenant.id, data.products);
  }

  @Get('calculate-vat/:id')
  @ApiOperation({ summary: 'Calculate VAT for product' })
  @ApiResponse({ status: 200, description: 'VAT calculation result' })
  async calculateVat(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Query('amount') amount: number,
  ): Promise<{
    productId: string;
    amount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
  }> {
    const vatRate = 0.15; // Bangladesh VAT rate
    const vatAmount = await this.productService.calculateVat(amount, vatRate);
    return {
      productId: id,
      amount: amount,
      vatRate: vatRate,
      vatAmount: vatAmount,
      totalAmount: amount + vatAmount
    };
  }
}