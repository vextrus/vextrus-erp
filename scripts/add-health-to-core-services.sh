#!/bin/bash

# Script to add health check modules to core services
# Usage: ./add-health-to-core-services.sh

set -e

echo "=== Adding Health Checks to Core Services ==="
echo "Date: $(date)"
echo ""

# Services to add health checks to (auth already has health module)
SERVICES=("workflow" "rules-engine" "api-gateway")

# Function to create health module for a service
create_health_module() {
    local SERVICE=$1
    local SERVICE_DIR="services/$SERVICE"

    echo "Processing $SERVICE..."

    # Create health module directory
    mkdir -p "$SERVICE_DIR/src/modules/health"

    # Determine which health indicators this service needs
    local USE_DB="true"
    local USE_REDIS="true"
    local USE_KAFKA="true"

    # API Gateway doesn't need database
    if [ "$SERVICE" = "api-gateway" ]; then
        USE_DB="false"
    fi

    # Create health controller
    cat > "$SERVICE_DIR/src/modules/health/health.controller.ts" << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
EOF

    if [ "$USE_DB" = "true" ]; then
        echo "  TypeOrmHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.controller.ts" << 'EOF'
  MicroserviceHealthIndicator
} from '@nestjs/terminus';
EOF

    if [ "$USE_REDIS" = "true" ]; then
        echo "import { RedisHealthIndicator } from './redis.health';" >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "import { KafkaHealthIndicator } from './kafka.health';" >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.controller.ts" << EOF

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
EOF

    if [ "$USE_DB" = "true" ]; then
        echo "    private db: TypeOrmHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_REDIS" = "true" ]; then
        echo "    private redis: RedisHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "    private kafka: KafkaHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    echo "    private microservice: MicroserviceHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"

    cat >> "$SERVICE_DIR/src/modules/health/health.controller.ts" << EOF
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get health status' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
EOF

    if [ "$USE_DB" = "true" ]; then
        echo "      () => this.db.pingCheck('database')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_REDIS" = "true" ]; then
        echo "      () => this.redis.isHealthy('redis')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "      () => this.kafka.isHealthy('kafka')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.controller.ts" << EOF
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    try {
      await this.health.check([
EOF

    if [ "$USE_DB" = "true" ]; then
        echo "        () => this.db.pingCheck('database')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_REDIS" = "true" ]; then
        echo "        () => this.redis.isHealthy('redis')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "        () => this.kafka.isHealthy('kafka')," >> "$SERVICE_DIR/src/modules/health/health.controller.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.controller.ts" << EOF
      ]);
      return { status: 'ready', service: '$SERVICE' };
    } catch (error) {
      throw error;
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    return {
      status: 'alive',
      service: '$SERVICE',
      timestamp: new Date().toISOString()
    };
  }
}
EOF

    # Create Redis health indicator if needed
    if [ "$USE_REDIS" = "true" ]; then
        cat > "$SERVICE_DIR/src/modules/health/redis.health.ts" << 'EOF'
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@InjectRedis() private readonly redis: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pingResult = await this.redis.ping();
      const isHealthy = pingResult === 'PONG';

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Redis is connected' : 'Redis ping failed',
        host: this.redis.options.host,
        port: this.redis.options.port,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Redis check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
          host: this.redis.options.host,
          port: this.redis.options.port,
        }),
      );
    }
  }
}
EOF
    fi

    # Create Kafka health indicator if needed
    if [ "$USE_KAFKA" = "true" ]; then
        cat > "$SERVICE_DIR/src/modules/health/kafka.health.ts" << 'EOF'
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ClientKafka } from '@nestjs/microservices';
import { InjectMicroserviceClient } from '@vextrus/shared-services';

@Injectable()
export class KafkaHealthIndicator extends HealthIndicator {
  constructor(
    @InjectMicroserviceClient('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if Kafka client is connected
      const isConnected = this.kafkaClient['client']?.['_admin'] ? true : false;

      if (!isConnected) {
        // Try to connect if not already connected
        await this.kafkaClient.connect();
      }

      // Get broker metadata to verify connection
      const admin = this.kafkaClient['client']['_admin'];
      const metadata = await admin.fetchMetadata();

      const isHealthy = metadata.brokers && metadata.brokers.length > 0;

      const result = this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Kafka is connected' : 'No Kafka brokers available',
        brokers: metadata.brokers?.length || 0,
        topics: metadata.topics?.length || 0,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Kafka check failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Kafka check failed',
        this.getStatus(key, false, {
          message: error.message || 'Unable to connect to Kafka',
        }),
      );
    }
  }
}
EOF
    fi

    # Create health module
    cat > "$SERVICE_DIR/src/modules/health/health.module.ts" << EOF
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
EOF

    if [ "$USE_REDIS" = "true" ]; then
        echo "import { RedisHealthIndicator } from './redis.health';" >> "$SERVICE_DIR/src/modules/health/health.module.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "import { KafkaHealthIndicator } from './kafka.health';" >> "$SERVICE_DIR/src/modules/health/health.module.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.module.ts" << EOF

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
EOF

    if [ "$USE_REDIS" = "true" ]; then
        echo "    RedisHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.module.ts"
    fi

    if [ "$USE_KAFKA" = "true" ]; then
        echo "    KafkaHealthIndicator," >> "$SERVICE_DIR/src/modules/health/health.module.ts"
    fi

    cat >> "$SERVICE_DIR/src/modules/health/health.module.ts" << EOF
  ],
})
export class HealthModule {}
EOF

    echo "✅ Created health module for $SERVICE"
}

# Process each service
for SERVICE in "${SERVICES[@]}"; do
    create_health_module "$SERVICE"
done

echo ""
echo "=== Health Check Module Creation Complete ==="
echo ""
echo "Next steps:"
echo "1. Import HealthModule in each service's app.module.ts"
echo "2. Test health endpoints: /health, /health/ready, /health/live"
echo "3. Run 'docker-compose up' to verify all services start"
echo ""
echo "Services updated:"
for SERVICE in "${SERVICES[@]}"; do
    echo "  - $SERVICE"
done
echo "  - master-data (already done manually)"
echo ""