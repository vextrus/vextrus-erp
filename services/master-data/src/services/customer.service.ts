import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CustomerRepository } from '../repositories/customer.repository';
import { EventPublisherService, EventType } from './event-publisher.service';
import { CacheService } from './cache.service';
import { BangladeshValidator } from '../validators/bangladesh.validator';
import { Customer, CustomerType, CustomerStatus } from '../entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly eventPublisher: EventPublisherService,
    private readonly cacheService: CacheService,
    private readonly validator: BangladeshValidator,
  ) {}

  async create(tenantId: string, data: Partial<Customer>, userId?: string): Promise<Customer> {
    // Validate Bangladesh-specific fields
    if (data.tin && !this.validator.validateTIN(data.tin)) {
      throw new BadRequestException('Invalid TIN format');
    }
    if (data.nid && !this.validator.validateNID(data.nid)) {
      throw new BadRequestException('Invalid NID format');
    }
    if (data.phone && !this.validator.validatePhoneNumber(data.phone)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check for duplicates
    if (data.code) {
      const existing = await this.customerRepository.findByCode(tenantId, data.code);
      if (existing) {
        throw new ConflictException(`Customer with code ${data.code} already exists`);
      }
    }

    if (data.tin) {
      const existing = await this.customerRepository.findByTIN(tenantId, data.tin);
      if (existing) {
        throw new ConflictException(`Customer with TIN ${data.tin} already exists`);
      }
    }

    // Normalize phone numbers
    if (data.phone) {
      data.phone = this.validator.normalizePhoneNumber(data.phone);
    }
    if (data.phone_secondary) {
      data.phone_secondary = this.validator.normalizePhoneNumber(data.phone_secondary);
    }

    // Create customer
    const customer = await this.customerRepository.create({
      ...data,
      tenant_id: tenantId,
      created_by: userId,
      status: CustomerStatus.ACTIVE,
    });

    // Publish event
    await this.eventPublisher.publishCustomerEvent(
      EventType.CUSTOMER_CREATED,
      customer.id,
      tenantId,
      customer,
      userId
    );

    // Cache the customer
    const cacheKey = this.cacheService.generateCustomerKey(tenantId, customer.id);
    await this.cacheService.set(cacheKey, customer, 300); // 5 minutes

    return customer;
  }

  async findAll(
    tenantId: string,
    query: {
      page?: number;
      limit?: number;
      name?: string;
      code?: string;
      tin?: string;
      phone?: string;
      email?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }
  ): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const { page = 1, limit = 20, name, code, tin, phone, email, sortBy = 'created_at', sortOrder = 'DESC' } = query;
    
    // Build search filters
    const searchFilters: any = {};
    if (name) searchFilters.name = name;
    if (code) searchFilters.code = code;
    if (tin) searchFilters.tin = tin;
    if (phone) searchFilters.phone = phone;
    if (email) searchFilters.email = email;

    // If there's any search term, use search functionality
    const searchTerm = name || code || tin || phone || email;
    if (searchTerm) {
      const customers = await this.customerRepository.searchCustomers(
        tenantId,
        searchTerm,
        limit
      );
      const total = customers.length;
      return {
        data: customers,
        total,
        page: 1,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: false,
        hasPrevious: false,
      };
    }

    return await this.customerRepository.paginate(tenantId, page, limit, {}, { [sortBy]: sortOrder });
  }

  async findOne(tenantId: string, id: string): Promise<Customer> {
    // Check cache first
    const cacheKey = this.cacheService.generateCustomerKey(tenantId, id);
    const cached = await this.cacheService.get<Customer>(cacheKey);
    if (cached) {
      return cached;
    }

    const customer = await this.customerRepository.findOne(tenantId, id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Cache the customer
    await this.cacheService.set(cacheKey, customer, 300);

    return customer;
  }

  /**
   * Federation-specific method that bypasses tenant check
   * Used by GraphQL federation __resolveReference resolver
   */
  async findOneForFederation(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return customer;
  }

  async findByCode(tenantId: string, code: string): Promise<Customer> {
    const customer = await this.customerRepository.findByCode(tenantId, code);
    if (!customer) {
      throw new NotFoundException(`Customer with code ${code} not found`);
    }
    return customer;
  }

  async findByTin(tenantId: string, tin: string): Promise<Customer> {
    const customer = await this.customerRepository.findByTIN(tenantId, tin);
    if (!customer) {
      throw new NotFoundException(`Customer with TIN ${tin} not found`);
    }
    return customer;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Customer>,
    userId?: string
  ): Promise<Customer> {
    const existing = await this.findOne(tenantId, id);

    // Validate Bangladesh-specific fields if provided
    if (data.tin && !this.validator.validateTIN(data.tin)) {
      throw new BadRequestException('Invalid TIN format');
    }
    if (data.nid && !this.validator.validateNID(data.nid)) {
      throw new BadRequestException('Invalid NID format');
    }
    if (data.phone && !this.validator.validatePhoneNumber(data.phone)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Check for duplicates if changing unique fields
    if (data.tin && data.tin !== existing.tin) {
      const duplicate = await this.customerRepository.findByTIN(tenantId, data.tin);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Customer with TIN ${data.tin} already exists`);
      }
    }

    // Normalize phone numbers
    if (data.phone) {
      data.phone = this.validator.normalizePhoneNumber(data.phone);
    }
    if (data.phone_secondary) {
      data.phone_secondary = this.validator.normalizePhoneNumber(data.phone_secondary);
    }

    // Update customer
    const updated = await this.customerRepository.update(tenantId, id, {
      ...data,
      updated_by: userId,
    });

    if (!updated) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Publish event
    await this.eventPublisher.publishCustomerEvent(
      EventType.CUSTOMER_UPDATED,
      id,
      tenantId,
      { old: existing, new: updated },
      userId
    );

    // Invalidate cache
    const cacheKey = this.cacheService.generateCustomerKey(tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async remove(tenantId: string, id: string, userId?: string): Promise<void> {
    const customer = await this.findOne(tenantId, id);

    // Check if customer has outstanding balance
    if (customer.outstanding_balance > 0) {
      throw new BadRequestException(
        `Cannot delete customer with outstanding balance of ${customer.outstanding_balance}`
      );
    }

    // Soft delete
    await this.customerRepository.softDelete(tenantId, id);

    // Publish event
    await this.eventPublisher.publishCustomerEvent(
      EventType.CUSTOMER_DELETED,
      id,
      tenantId,
      customer,
      userId
    );

    // Invalidate cache
    const cacheKey = this.cacheService.generateCustomerKey(tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: CustomerStatus,
    userId?: string
  ): Promise<Customer> {
    const customer = await this.findOne(tenantId, id);
    const oldStatus = customer.status;

    const updated = await this.customerRepository.update(tenantId, id, {
      status,
      updated_by: userId,
    });

    if (!updated) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Publish event
    await this.eventPublisher.publishCustomerEvent(
      EventType.CUSTOMER_STATUS_CHANGED,
      id,
      tenantId,
      { oldStatus, newStatus: status },
      userId
    );

    // Invalidate cache
    const cacheKey = this.cacheService.generateCustomerKey(tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async updateOutstandingBalance(
    tenantId: string,
    customerId: string,
    amount: number,
    operation: 'add' | 'subtract',
    userId?: string
  ): Promise<boolean> {
    const result = await this.customerRepository.updateOutstandingBalance(
      tenantId,
      customerId,
      amount,
      operation
    );

    if (result) {
      // Invalidate cache
      const cacheKey = this.cacheService.generateCustomerKey(tenantId, customerId);
      await this.cacheService.del(cacheKey);

      // Publish event
      await this.eventPublisher.publishCustomerEvent(
        EventType.CUSTOMER_UPDATED,
        customerId,
        tenantId,
        { balanceUpdate: { amount, operation } },
        userId
      );
    }

    return result;
  }

  async updateLoyaltyPoints(
    tenantId: string,
    customerId: string,
    points: number,
    operation: 'add' | 'subtract' | 'set',
    userId?: string
  ): Promise<boolean> {
    const result = await this.customerRepository.updateLoyaltyPoints(
      tenantId,
      customerId,
      points,
      operation
    );

    if (result) {
      // Invalidate cache
      const cacheKey = this.cacheService.generateCustomerKey(tenantId, customerId);
      await this.cacheService.del(cacheKey);

      // Publish event
      await this.eventPublisher.publishCustomerEvent(
        EventType.CUSTOMER_UPDATED,
        customerId,
        tenantId,
        { loyaltyPointsUpdate: { points, operation } },
        userId
      );
    }

    return result;
  }

  async getCustomersByDistrict(tenantId: string, district: string): Promise<Customer[]> {
    if (!this.validator.validateDistrict(district)) {
      throw new BadRequestException(`Invalid district: ${district}`);
    }
    return await this.customerRepository.getCustomersByDistrict(tenantId, district);
  }

  async getCustomersByDivision(tenantId: string, division: string): Promise<Customer[]> {
    if (!this.validator.validateDivision(division)) {
      throw new BadRequestException(`Invalid division: ${division}`);
    }
    return await this.customerRepository.getCustomersByDivision(tenantId, division);
  }

  async getTopCustomersByRevenue(tenantId: string, limit: number = 10): Promise<Customer[]> {
    return await this.customerRepository.getTopCustomersByRevenue(tenantId, limit);
  }

  async getCustomerStats(tenantId: string): Promise<any> {
    return await this.customerRepository.getCustomerStats(tenantId);
  }

  async validateCustomerCredit(
    tenantId: string,
    customerId: string,
    orderAmount: number
  ): Promise<{
    approved: boolean;
    availableCredit: number;
    reason?: string;
  }> {
    const customer = await this.findOne(tenantId, customerId);

    if (customer.status === CustomerStatus.BLACKLISTED) {
      return {
        approved: false,
        availableCredit: 0,
        reason: 'Customer is blacklisted',
      };
    }

    if (customer.status !== CustomerStatus.ACTIVE) {
      return {
        approved: false,
        availableCredit: 0,
        reason: 'Customer is not active',
      };
    }

    const availableCredit = customer.credit_limit - customer.outstanding_balance;

    if (orderAmount > availableCredit) {
      return {
        approved: false,
        availableCredit,
        reason: `Order amount exceeds available credit limit`,
      };
    }

    return {
      approved: true,
      availableCredit,
    };
  }

  async validateTin(tin: string): Promise<{ valid: boolean; message?: string }> {
    if (!this.validator.validateTIN(tin)) {
      return {
        valid: false,
        message: 'Invalid TIN format. TIN must be 10-12 digits.',
      };
    }
    return { valid: true };
  }

  async validateNid(nid: string): Promise<{ valid: boolean; message?: string }> {
    if (!this.validator.validateNID(nid)) {
      return {
        valid: false,
        message: 'Invalid NID format. NID must be 10-17 digits.',
      };
    }
    return { valid: true };
  }

  async bulkImport(
    tenantId: string,
    customers: Array<Partial<Customer>>
  ): Promise<{ jobId: string; message: string }> {
    // For now, return a placeholder response
    // This would typically start a background job
    const jobId = `bulk-import-${Date.now()}`;
    
    // TODO: Implement actual bulk import logic
    // This should validate each customer and import them in batches
    
    return {
      jobId,
      message: `Bulk import job ${jobId} started for ${customers.length} customers`,
    };
  }
}