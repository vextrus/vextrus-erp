import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial, FindOptionsOrder } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(tenantId: string, options?: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find({
      ...options,
      where: {
        ...options?.where,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
    });
  }

  async findOne(tenantId: string, id: string): Promise<T | null> {
    return await this.repository.findOne({
      where: {
        id,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
    });
  }

  /**
   * Find entity by ID without tenant check
   * Used for GraphQL federation __resolveReference
   */
  async findById(id: string): Promise<T | null> {
    return await this.repository.findOne({
      where: {
        id,
      } as FindOptionsWhere<T>,
    });
  }

  async findByCode(tenantId: string, code: string): Promise<T | null> {
    return await this.repository.findOne({
      where: {
        code,
        tenant_id: tenantId,
      } as unknown as FindOptionsWhere<T>,
    });
  }

  async findMany(options: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  async update(tenantId: string, id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOne(tenantId, id);
    if (!entity) {
      return null;
    }
    
    const updated = await this.repository.save({
      ...entity,
      ...data,
      id,
      tenant_id: tenantId,
      updated_at: new Date(),
    });
    
    return updated;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await this.repository.delete({
      id,
      tenant_id: tenantId,
    } as FindOptionsWhere<T>);
    
    return result.affected ? result.affected > 0 : false;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const result = await this.repository.update(
      { id, tenant_id: tenantId } as FindOptionsWhere<T>,
      { is_active: false, updated_at: new Date() } as any
    );
    
    return result.affected ? result.affected > 0 : false;
  }

  async count(tenantId: string, where?: FindOptionsWhere<T>): Promise<number> {
    return await this.repository.count({
      where: {
        ...where,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
    });
  }

  async exists(tenantId: string, where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        ...where,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
    });
    return count > 0;
  }

  async paginate(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    where?: FindOptionsWhere<T>,
    order?: Record<string, 'ASC' | 'DESC'>
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.repository.findAndCount({
      where: {
        ...where,
        tenant_id: tenantId,
      } as FindOptionsWhere<T>,
      order: order as FindOptionsOrder<T>,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async bulkCreate(tenantId: string, data: DeepPartial<T>[]): Promise<T[]> {
    const entities = data.map(item => 
      this.repository.create({
        ...item,
        tenant_id: tenantId,
      })
    );
    return await this.repository.save(entities);
  }

  async search(
    tenantId: string,
    searchTerm: string,
    fields: string[],
    limit: number = 10
  ): Promise<T[]> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    queryBuilder.where('entity.tenant_id = :tenantId', { tenantId });
    
    if (searchTerm && fields.length > 0) {
      const searchConditions = fields
        .map(field => `entity.${field} ILIKE :searchTerm`)
        .join(' OR ');
      
      queryBuilder.andWhere(`(${searchConditions})`, { 
        searchTerm: `%${searchTerm}%` 
      });
    }
    
    queryBuilder.limit(limit);
    
    return await queryBuilder.getMany();
  }
}