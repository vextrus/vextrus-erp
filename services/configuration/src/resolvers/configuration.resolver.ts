import { Resolver, Query, Mutation, Args, ResolveReference } from '@nestjs/graphql';
import { Configuration } from '../entities/configuration.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { ConfigurationService } from '../services/configuration.service';
import { CreateConfigurationInput } from '../dto/create-configuration.input';
import { UpdateConfigurationInput } from '../dto/update-configuration.input';
import { CreateFeatureFlagInput } from '../dto/create-feature-flag.input';
import { UpdateFeatureFlagInput } from '../dto/update-feature-flag.input';
import { ConfigurationConnection } from '../dto/configuration-connection.dto';
import { FeatureFlagConnection } from '../dto/feature-flag-connection.dto';

@Resolver(() => Configuration)
export class ConfigurationResolver {
  constructor(private readonly configService: ConfigurationService) {}

  @Query(() => Configuration, { nullable: true })
  async configuration(@Args('id') id: string): Promise<Configuration> {
    return this.configService.findById(id);
  }

  @Query(() => [Configuration])
  async configurationsByTenant(
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<Configuration[]> {
    return this.configService.findByTenant(tenantId);
  }

  @Query(() => Configuration, { nullable: true })
  async configurationByKey(
    @Args('key') key: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<Configuration> {
    return this.configService.findByKey(key, tenantId);
  }

  @Query(() => [Configuration])
  async configurationsByCategory(
    @Args('category') category: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<Configuration[]> {
    return this.configService.findByCategory(category, tenantId);
  }

  @Query(() => ConfigurationConnection)
  async configurationsConnection(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<ConfigurationConnection> {
    return this.configService.findPaginated({
      first: first || 10,
      after,
      tenantId,
    });
  }

  @Mutation(() => Configuration)
  async createConfiguration(
    @Args('input') input: CreateConfigurationInput,
  ): Promise<Configuration> {
    return this.configService.createConfiguration(input);
  }

  @Mutation(() => Configuration)
  async updateConfiguration(
    @Args('id') id: string,
    @Args('input') input: UpdateConfigurationInput,
  ): Promise<Configuration> {
    return this.configService.updateConfiguration(id, input);
  }

  @Mutation(() => Boolean)
  async deleteConfiguration(@Args('id') id: string): Promise<boolean> {
    return this.configService.deleteConfiguration(id);
  }

  @Mutation(() => [Configuration])
  async bulkUpdateConfigurations(
    @Args('configurations', { type: () => [UpdateConfigurationInput] })
    configurations: UpdateConfigurationInput[],
  ): Promise<Configuration[]> {
    return this.configService.bulkUpdateConfigurations(configurations);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<Configuration> {
    return this.configService.findById(reference.id);
  }
}

@Resolver(() => FeatureFlag)
export class FeatureFlagResolver {
  constructor(private readonly configService: ConfigurationService) {}

  @Query(() => FeatureFlag, { nullable: true })
  async featureFlag(@Args('id') id: string): Promise<FeatureFlag> {
    return this.configService.findFeatureFlagById(id);
  }

  @Query(() => [FeatureFlag])
  async featureFlagsByTenant(
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<FeatureFlag[]> {
    return this.configService.findFeatureFlagsByTenant(tenantId);
  }

  @Query(() => FeatureFlag, { nullable: true })
  async featureFlagByKey(
    @Args('key') key: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<FeatureFlag> {
    return this.configService.findFeatureFlagByKey(key, tenantId);
  }

  @Query(() => Boolean)
  async isFeatureEnabled(
    @Args('key') key: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<boolean> {
    return this.configService.isFeatureEnabled(key, tenantId, userId);
  }

  @Query(() => FeatureFlagConnection)
  async featureFlagsConnection(
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ): Promise<FeatureFlagConnection> {
    return this.configService.findFeatureFlagsPaginated({
      first: first || 10,
      after,
      tenantId,
    });
  }

  @Mutation(() => FeatureFlag)
  async createFeatureFlag(
    @Args('input') input: CreateFeatureFlagInput,
  ): Promise<FeatureFlag> {
    return this.configService.createFeatureFlag(input);
  }

  @Mutation(() => FeatureFlag)
  async updateFeatureFlag(
    @Args('id') id: string,
    @Args('input') input: UpdateFeatureFlagInput,
  ): Promise<FeatureFlag> {
    return this.configService.updateFeatureFlag(id, input);
  }

  @Mutation(() => FeatureFlag)
  async toggleFeatureFlag(
    @Args('id') id: string,
    @Args('enabled') enabled: boolean,
  ): Promise<FeatureFlag> {
    return this.configService.toggleFeatureFlag(id, enabled);
  }

  @Mutation(() => Boolean)
  async deleteFeatureFlag(@Args('id') id: string): Promise<boolean> {
    return this.configService.deleteFeatureFlag(id);
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: string }): Promise<FeatureFlag> {
    return this.configService.findFeatureFlagById(reference.id);
  }
}