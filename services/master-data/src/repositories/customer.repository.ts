import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Customer, CustomerType, CustomerStatus } from '../entities/customer.entity';

@Injectable()
export class CustomerRepository extends BaseRepository<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>
  ) {
    super(repository);
  }

  async findByTIN(tenantId: string, tin: string): Promise<Customer | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        tin,
      },
    });
  }

  async findByNID(tenantId: string, nid: string): Promise<Customer | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        nid,
      },
    });
  }

  async findByPhone(tenantId: string, phone: string): Promise<Customer | null> {
    // Normalize phone number for search
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    return await this.repository.findOne({
      where: [
        { tenant_id: tenantId, phone: normalizedPhone },
        { tenant_id: tenantId, phone_secondary: normalizedPhone },
      ],
    });
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    return await this.repository.findOne({
      where: {
        tenant_id: tenantId,
        email: email.toLowerCase(),
      },
    });
  }

  async findByType(
    tenantId: string,
    customerType: CustomerType,
    status?: CustomerStatus
  ): Promise<Customer[]> {
    const where: FindOptionsWhere<Customer> = {
      tenant_id: tenantId,
      customer_type: customerType,
    };

    if (status) {
      where.status = status;
    }

    return await this.repository.find({ where });
  }

  async findWithOutstandingBalance(
    tenantId: string,
    minBalance?: number
  ): Promise<Customer[]> {
    const queryBuilder = this.repository.createQueryBuilder('customer');
    
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('customer.outstanding_balance > :minBalance', {
      minBalance: minBalance || 0,
    });
    
    return await queryBuilder.getMany();
  }

  async findByCreditLimit(
    tenantId: string,
    minLimit: number,
    maxLimit?: number
  ): Promise<Customer[]> {
    const where: FindOptionsWhere<Customer> = {
      tenant_id: tenantId,
    };

    if (maxLimit) {
      where.credit_limit = Between(minLimit, maxLimit);
    } else {
      const queryBuilder = this.repository.createQueryBuilder('customer');
      queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
      queryBuilder.andWhere('customer.credit_limit >= :minLimit', { minLimit });
      return await queryBuilder.getMany();
    }

    return await this.repository.find({ where });
  }

  async searchCustomers(
    tenantId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<Customer[]> {
    const queryBuilder = this.repository.createQueryBuilder('customer');
    
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
    
    if (searchTerm) {
      queryBuilder.andWhere(
        `(
          customer.code ILIKE :search OR
          customer.name ILIKE :search OR
          customer.name_bn ILIKE :search OR
          customer.tin ILIKE :search OR
          customer.nid ILIKE :search OR
          customer.phone ILIKE :search OR
          customer.email ILIKE :search
        )`,
        { search: `%${searchTerm}%` }
      );
    }
    
    queryBuilder.limit(limit);
    queryBuilder.orderBy('customer.name', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async getCustomersByDistrict(
    tenantId: string,
    district: string
  ): Promise<Customer[]> {
    const queryBuilder = this.repository.createQueryBuilder('customer');
    
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere(`customer.address->>'district' = :district`, { district });
    
    return await queryBuilder.getMany();
  }

  async getCustomersByDivision(
    tenantId: string,
    division: string
  ): Promise<Customer[]> {
    const queryBuilder = this.repository.createQueryBuilder('customer');
    
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere(`customer.address->>'division' = :division`, { division });
    
    return await queryBuilder.getMany();
  }

  async getTopCustomersByRevenue(
    tenantId: string,
    limit: number = 10
  ): Promise<Customer[]> {
    return await this.repository.find({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
      order: {
        total_revenue: 'DESC',
      },
      take: limit,
    });
  }

  async getRecentCustomers(
    tenantId: string,
    days: number = 30,
    limit: number = 10
  ): Promise<Customer[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const queryBuilder = this.repository.createQueryBuilder('customer');
    
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });
    queryBuilder.andWhere('customer.created_at >= :since', { since });
    queryBuilder.orderBy('customer.created_at', 'DESC');
    queryBuilder.limit(limit);
    
    return await queryBuilder.getMany();
  }

  async updateOutstandingBalance(
    tenantId: string,
    customerId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<boolean> {
    const customer = await this.findOne(tenantId, customerId);
    if (!customer) {
      return false;
    }

    const newBalance = operation === 'add'
      ? customer.outstanding_balance + amount
      : customer.outstanding_balance - amount;

    const result = await this.repository.update(
      { id: customerId, tenant_id: tenantId },
      { 
        outstanding_balance: newBalance,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async updateLoyaltyPoints(
    tenantId: string,
    customerId: string,
    points: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<boolean> {
    const customer = await this.findOne(tenantId, customerId);
    if (!customer) {
      return false;
    }

    let newPoints: number;
    switch (operation) {
      case 'add':
        newPoints = customer.loyalty_points + points;
        break;
      case 'subtract':
        newPoints = Math.max(0, customer.loyalty_points - points);
        break;
      case 'set':
        newPoints = points;
        break;
    }

    const result = await this.repository.update(
      { id: customerId, tenant_id: tenantId },
      { 
        loyalty_points: newPoints,
        updated_at: new Date(),
      }
    );

    return result.affected ? result.affected > 0 : false;
  }

  async getCustomerStats(tenantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    blacklisted: number;
    byType: Record<CustomerType, number>;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('customer');
    queryBuilder.where('customer.tenant_id = :tenantId', { tenantId });

    // Get counts by status
    const statusCounts = await queryBuilder
      .select('customer.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.status')
      .getRawMany();

    // Get counts by type
    const typeCounts = await queryBuilder
      .select('customer.customer_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.customer_type')
      .getRawMany();

    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      blacklisted: 0,
      byType: {} as Record<CustomerType, number>,
    };

    statusCounts.forEach(row => {
      const count = parseInt(row.count);
      stats.total += count;
      
      switch (row.status) {
        case CustomerStatus.ACTIVE:
          stats.active = count;
          break;
        case CustomerStatus.INACTIVE:
          stats.inactive = count;
          break;
        case CustomerStatus.SUSPENDED:
          stats.suspended = count;
          break;
        case CustomerStatus.BLACKLISTED:
          stats.blacklisted = count;
          break;
      }
    });

    typeCounts.forEach(row => {
      stats.byType[row.type as CustomerType] = parseInt(row.count);
    });

    return stats;
  }

  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (normalized.startsWith('1')) {
      normalized = '880' + normalized;
    } else if (normalized.startsWith('01')) {
      normalized = '880' + normalized.substring(1);
    } else if (!normalized.startsWith('880')) {
      normalized = '880' + normalized;
    }
    
    return '+' + normalized;
  }
}