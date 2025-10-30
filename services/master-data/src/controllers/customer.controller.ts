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
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { Customer } from '../entities/customer.entity';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully', type: Customer })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.create(tenant.id, createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of customers', type: [Customer] })
  async findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query(ValidationPipe) query: CustomerQueryDto,
  ): Promise<{ data: Customer[]; total: number; page: number; limit: number }> {
    return this.customerService.findAll(tenant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer found', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<Customer> {
    return this.customerService.findOne(tenant.id, id);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get customer by code' })
  @ApiResponse({ status: 200, description: 'Customer found', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByCode(
    @CurrentTenant() tenant: TenantContext,
    @Param('code') code: string,
  ): Promise<Customer> {
    return this.customerService.findByCode(tenant.id, code);
  }

  @Get('by-tin/:tin')
  @ApiOperation({ summary: 'Get customer by TIN' })
  @ApiResponse({ status: 200, description: 'Customer found', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByTin(
    @CurrentTenant() tenant: TenantContext,
    @Param('tin') tin: string,
  ): Promise<Customer> {
    return this.customerService.findByTin(tenant.id, tin);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully', type: Customer })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.update(tenant.id, id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete customer' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    await this.customerService.remove(tenant.id, id);
  }

  @Post('bulk-import')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bulk import customers' })
  @ApiResponse({ status: 202, description: 'Import job started' })
  async bulkImport(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: { customers: CreateCustomerDto[] },
  ): Promise<{ jobId: string; message: string }> {
    return this.customerService.bulkImport(tenant.id, data.customers);
  }

  @Get('validate-tin/:tin')
  @ApiOperation({ summary: 'Validate Bangladesh TIN format' })
  @ApiResponse({ status: 200, description: 'TIN validation result' })
  async validateTin(@Param('tin') tin: string): Promise<{ valid: boolean; message?: string }> {
    return this.customerService.validateTin(tin);
  }

  @Get('validate-nid/:nid')
  @ApiOperation({ summary: 'Validate Bangladesh NID format' })
  @ApiResponse({ status: 200, description: 'NID validation result' })
  async validateNid(@Param('nid') nid: string): Promise<{ valid: boolean; message?: string }> {
    return this.customerService.validateNid(nid);
  }
}