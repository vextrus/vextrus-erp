import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Configuration } from '../entities/configuration.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { CreateConfigurationInput } from '../dto/create-configuration.input';
import { UpdateConfigurationInput } from '../dto/update-configuration.input';
import { CreateFeatureFlagInput } from '../dto/create-feature-flag.input';
import { UpdateFeatureFlagInput } from '../dto/update-feature-flag.input';
import { ConfigurationConnection } from '../dto/configuration-connection.dto';
import { FeatureFlagConnection } from '../dto/feature-flag-connection.dto';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    @InjectRepository(Configuration)
    private readonly configurationRepository: Repository<Configuration>,
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {}

  // Configuration Methods
  async findById(id: string): Promise<Configuration> {
    const configuration = await this.configurationRepository.findOne({ where: { id } });
    if (!configuration) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }
    return configuration;
  }

  async findByTenant(tenantId?: string): Promise<Configuration[]> {
    const where: FindOptionsWhere<Configuration> = {};
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.configurationRepository.find({ where });
  }

  async findByKey(key: string, tenantId?: string): Promise<Configuration> {
    const where: FindOptionsWhere<Configuration> = { key };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    const configuration = await this.configurationRepository.findOne({ where });
    if (!configuration) {
      throw new NotFoundException(`Configuration with key ${key} not found`);
    }
    return configuration;
  }

  async findByCategory(category: string, tenantId?: string): Promise<Configuration[]> {
    const where: FindOptionsWhere<Configuration> = { category };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.configurationRepository.find({ where });
  }

  async findPaginated(params: {
    first: number;
    after?: string;
    tenantId?: string;
  }): Promise<ConfigurationConnection> {
    const { first, after, tenantId } = params;
    const where: FindOptionsWhere<Configuration> = {};

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    const query = this.configurationRepository.createQueryBuilder('configuration')
      .where(where);

    if (after) {
      query.andWhere('configuration.id > :after', { after });
    }

    const [configurations, totalCount] = await query
      .take(first + 1)
      .orderBy('configuration.id', 'ASC')
      .getManyAndCount();

    const hasNextPage = configurations.length > first;
    const edges = configurations.slice(0, first).map(node => ({
      cursor: node.id,
      node,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }

  async createConfiguration(input: CreateConfigurationInput): Promise<Configuration> {
    const configuration = this.configurationRepository.create(input);
    return this.configurationRepository.save(configuration);
  }

  async updateConfiguration(id: string, input: UpdateConfigurationInput): Promise<Configuration> {
    const configuration = await this.findById(id);
    Object.assign(configuration, input);
    return this.configurationRepository.save(configuration);
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    const result = await this.configurationRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async bulkUpdateConfigurations(
    configurations: UpdateConfigurationInput[],
  ): Promise<Configuration[]> {
    const results: Configuration[] = [];

    for (const config of configurations) {
      if ('id' in config) {
        const updated = await this.updateConfiguration((config as any).id, config);
        results.push(updated);
      }
    }

    return results;
  }

  // Feature Flag Methods
  async findFeatureFlagById(id: string): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagRepository.findOne({ where: { id } });
    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    return featureFlag;
  }

  async findFeatureFlagsByTenant(tenantId?: string): Promise<FeatureFlag[]> {
    const where: FindOptionsWhere<FeatureFlag> = {};
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.featureFlagRepository.find({ where });
  }

  async findFeatureFlagByKey(key: string, tenantId?: string): Promise<FeatureFlag> {
    const where: FindOptionsWhere<FeatureFlag> = { key };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    const featureFlag = await this.featureFlagRepository.findOne({ where });
    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with key ${key} not found`);
    }
    return featureFlag;
  }

  async isFeatureEnabled(
    key: string,
    tenantId?: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      const featureFlag = await this.findFeatureFlagByKey(key, tenantId);

      // Base enabled check
      if (!featureFlag.enabled) {
        return false;
      }

      // Check user-specific flag
      if (userId && featureFlag.user_id === userId) {
        return true;
      }

      // Check rules if they exist
      if (featureFlag.rules) {
        const now = new Date();

        // Date range check
        if (featureFlag.rules.startDate && new Date(featureFlag.rules.startDate) > now) {
          return false;
        }
        if (featureFlag.rules.endDate && new Date(featureFlag.rules.endDate) < now) {
          return false;
        }

        // Percentage rollout
        if (featureFlag.rules.percentage !== undefined) {
          const hash = this.hashString(userId || tenantId || '');
          const percentage = Math.abs(hash) % 100;
          return percentage < featureFlag.rules.percentage;
        }
      }

      return featureFlag.enabled;
    } catch (error) {
      this.logger.warn(`Feature flag ${key} not found, defaulting to disabled`);
      return false;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  async findFeatureFlagsPaginated(params: {
    first: number;
    after?: string;
    tenantId?: string;
  }): Promise<FeatureFlagConnection> {
    const { first, after, tenantId } = params;
    const where: FindOptionsWhere<FeatureFlag> = {};

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    const query = this.featureFlagRepository.createQueryBuilder('feature_flag')
      .where(where);

    if (after) {
      query.andWhere('feature_flag.id > :after', { after });
    }

    const [featureFlags, totalCount] = await query
      .take(first + 1)
      .orderBy('feature_flag.id', 'ASC')
      .getManyAndCount();

    const hasNextPage = featureFlags.length > first;
    const edges = featureFlags.slice(0, first).map(node => ({
      cursor: node.id,
      node,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: !!after,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor,
      },
      totalCount,
    };
  }

  async createFeatureFlag(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    const featureFlag = this.featureFlagRepository.create({
      ...input,
      enabled: input.enabled ?? false,
    });
    return this.featureFlagRepository.save(featureFlag);
  }

  async updateFeatureFlag(id: string, input: UpdateFeatureFlagInput): Promise<FeatureFlag> {
    const featureFlag = await this.findFeatureFlagById(id);
    Object.assign(featureFlag, input);
    return this.featureFlagRepository.save(featureFlag);
  }

  async toggleFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
    const featureFlag = await this.findFeatureFlagById(id);
    featureFlag.enabled = enabled;
    return this.featureFlagRepository.save(featureFlag);
  }

  async deleteFeatureFlag(id: string): Promise<boolean> {
    const result = await this.featureFlagRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Cache invalidation helpers
  async invalidateConfigurationCache(key: string, tenantId?: string): Promise<void> {
    // Implement cache invalidation logic here
    this.logger.log(`Invalidating cache for config key: ${key}, tenant: ${tenantId}`);
  }

  async invalidateFeatureFlagCache(key: string, tenantId?: string): Promise<void> {
    // Implement cache invalidation logic here
    this.logger.log(`Invalidating cache for feature flag: ${key}, tenant: ${tenantId}`);
  }

  // Bulk operations
  async exportConfigurations(tenantId?: string): Promise<Configuration[]> {
    const where: FindOptionsWhere<Configuration> = {};
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return this.configurationRepository.find({ where });
  }

  async importConfigurations(
    configurations: CreateConfigurationInput[],
    tenantId?: string,
  ): Promise<Configuration[]> {
    const results: Configuration[] = [];

    for (const config of configurations) {
      if (tenantId) {
        config.tenant_id = tenantId;
      }
      const created = await this.createConfiguration(config);
      results.push(created);
    }

    return results;
  }
}