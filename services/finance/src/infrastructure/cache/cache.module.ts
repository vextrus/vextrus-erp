import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheModule, CacheService } from '@vextrus/cache';
import { FinanceCacheService } from './cache.service';

/**
 * Finance Cache Module
 *
 * Configures Redis caching for finance service with:
 * - Shared cache infrastructure from @vextrus/cache
 * - Finance-specific cache service with domain methods
 * - Environment-based Redis configuration
 * - Multi-tenant key prefixing
 *
 * Redis Configuration (from environment):
 * - REDIS_HOST: Redis server host (default: 'localhost')
 * - REDIS_PORT: Redis server port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Database number (default: 0)
 * - REDIS_KEY_PREFIX: Key prefix for isolation (default: 'finance:')
 *
 * Bangladesh Compliance:
 * - All cache keys include tenantId for data isolation
 * - Financial data cached with appropriate TTLs
 * - NBR report data cached separately
 */

@Module({
  imports: [
    ConfigModule,
    // Shared Redis cache module (configured via environment variables)
    RedisCacheModule.forRootAsync({ isGlobal: true }),
  ],
  providers: [CacheService, FinanceCacheService],
  exports: [FinanceCacheService],
})
export class FinanceCacheModule {}
