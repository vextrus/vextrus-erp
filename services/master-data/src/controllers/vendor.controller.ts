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
import { VendorService } from '../services/vendor.service';
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { VendorQueryDto } from '../dto/vendor-query.dto';
import { Vendor } from '../entities/vendor.entity';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully', type: Vendor })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) createVendorDto: CreateVendorDto,
  ): Promise<Vendor> {
    return this.vendorService.create({ ...createVendorDto, tenant_id: tenant.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of vendors', type: [Vendor] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query(ValidationPipe) query: VendorQueryDto,
  ): Promise<{ data: Vendor[]; total: number; page: number; limit: number }> {
    return this.vendorService.findAll(tenant.id, query);
  }

  @Get('approved')
  @ApiOperation({ summary: 'Get all approved vendors' })
  @ApiResponse({ status: 200, description: 'List of approved vendors', type: [Vendor] })
  async findApproved(
    @CurrentTenant() tenant: TenantContext,
  ): Promise<Vendor[]> {
    return this.vendorService.findApproved(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by ID' })
  @ApiResponse({ status: 200, description: 'Vendor found', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Vendor> {
    return this.vendorService.findOne(tenant.id, id);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get vendor by code' })
  @ApiResponse({ status: 200, description: 'Vendor found', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findByCode(
    @CurrentTenant() tenant: TenantContext,
    @Param('code') code: string,
  ): Promise<Vendor> {
    return this.vendorService.findByCode(tenant.id, code);
  }

  @Get('by-tin/:tin')
  @ApiOperation({ summary: 'Get vendor by TIN' })
  @ApiResponse({ status: 200, description: 'Vendor found', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findByTin(
    @CurrentTenant() tenant: TenantContext,
    @Param('tin') tin: string,
  ): Promise<Vendor> {
    return this.vendorService.findByTIN(tenant.id, tin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body(ValidationPipe) updateVendorDto: UpdateVendorDto,
  ): Promise<Vendor> {
    return this.vendorService.update(tenant.id, id, updateVendorDto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve vendor' })
  @ApiResponse({ status: 200, description: 'Vendor approved successfully', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async approve(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Vendor> {
    return this.vendorService.approve(tenant.id, id);
  }

  @Put(':id/blacklist')
  @ApiOperation({ summary: 'Blacklist vendor' })
  @ApiResponse({ status: 200, description: 'Vendor blacklisted successfully', type: Vendor })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async blacklist(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() data: { reason: string },
  ): Promise<Vendor> {
    return this.vendorService.blacklist(tenant.id, id, data.reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete vendor' })
  @ApiResponse({ status: 204, description: 'Vendor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    await this.vendorService.remove(tenant.id, id);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk import vendors' })
  @ApiResponse({ status: 202, description: 'Import job started' })
  async bulkImport(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: { vendors: CreateVendorDto[] },
  ): Promise<{ jobId: string; message: string }> {
    return this.vendorService.bulkImport(tenant.id, data.vendors);
  }
}