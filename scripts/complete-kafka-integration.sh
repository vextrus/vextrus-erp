#!/bin/bash
set -e

echo "Completing Kafka integration for remaining services..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to add Kafka module to a service
add_kafka_module() {
    local service=$1
    local topics=$2
    
    echo -e "${YELLOW}Adding Kafka module to $service service...${NC}"
    
    # Create Kafka module directory
    mkdir -p services/$service/src/modules/kafka
    
    # Create Kafka module
    cat > services/$service/src/modules/kafka/kafka.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
EOF

    # Create Kafka service with service-specific topics
    cat > services/$service/src/modules/kafka/kafka.service.ts << EOF
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private admin: Admin;
  private readonly topics = [
$topics
  ];

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: '${service}-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: '${service}-service-group' });
    this.admin = this.kafka.admin();
  }

  async onModuleInit() {
    try {
      await this.admin.connect();
      await this.createTopics();
      await this.producer.connect();
      await this.consumer.connect();
      await this.subscribeToTopics();
      this.logger.log('Kafka module initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Kafka module', error);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    await this.admin.disconnect();
  }

  private async createTopics() {
    const existingTopics = await this.admin.listTopics();
    const topicsToCreate = this.topics.filter(topic => !existingTopics.includes(topic));

    if (topicsToCreate.length > 0) {
      await this.admin.createTopics({
        topics: topicsToCreate.map(topic => ({
          topic,
          numPartitions: 3,
          replicationFactor: 1,
        })),
        waitForLeaders: true,
      });
      this.logger.log(\`Created topics: \${topicsToCreate.join(', ')}\`);
    }
  }

  private async subscribeToTopics() {
    // Subscribe to relevant topics for this service
    const subscribeTopics = this.getSubscriptionTopics();
    if (subscribeTopics.length > 0) {
      await this.consumer.subscribe({ topics: subscribeTopics, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.log(\`Received message from topic \${topic}\`);
          await this.handleMessage(topic, message);
        },
      });
    }
  }

  private getSubscriptionTopics(): string[] {
    // Define which topics this service should listen to
    const subscriptions: Record<string, string[]> = {
      'workflow': ['rules.evaluation.completed', 'auth.user.login', 'master-data.entity.changed'],
      'rules-engine': ['workflow.task.created', 'master-data.entity.created', 'master-data.entity.updated'],
      'api-gateway': ['auth.token.refresh', 'workflow.process.completed', 'rules.evaluation.completed'],
    };
    return subscriptions['${service}'] || [];
  }

  private async handleMessage(topic: string, message: any) {
    try {
      const payload = JSON.parse(message.value?.toString() || '{}');
      this.logger.log(\`Processing message from \${topic}\`, payload);
      // Service-specific message handling logic here
    } catch (error) {
      this.logger.error(\`Error processing message from \${topic}\`, error);
    }
  }

  async publish(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
            headers: {
              service: '${service}',
              timestamp: Date.now().toString(),
            },
          },
        ],
      });
      this.logger.log(\`Published message to \${topic}\`);
    } catch (error) {
      this.logger.error(\`Error publishing to \${topic}\`, error);
      throw error;
    }
  }
}
EOF

    echo -e "${GREEN}✓ Added Kafka module to $service service${NC}"
}

# Function to update app module to include Kafka
update_app_module() {
    local service=$1
    
    echo -e "${YELLOW}Updating app.module.ts for $service service...${NC}"
    
    # Check if KafkaModule is already imported
    if ! grep -q "KafkaModule" services/$service/src/app.module.ts; then
        # Add import statement
        sed -i "/^import.*Module.*from/a import { KafkaModule } from './modules/kafka/kafka.module';" services/$service/src/app.module.ts
        
        # Add to imports array
        sed -i '/imports: \[/,/\]/ s/\(imports: \[\)/\1\n    KafkaModule,/' services/$service/src/app.module.ts
        
        echo -e "${GREEN}✓ Updated app.module.ts for $service${NC}"
    else
        echo -e "${YELLOW}KafkaModule already imported in $service${NC}"
    fi
}

# Workflow service topics
WORKFLOW_TOPICS='    "workflow.process.started",
    "workflow.process.completed",
    "workflow.process.failed",
    "workflow.task.created",
    "workflow.task.assigned",
    "workflow.task.completed",
    "workflow.task.failed",
    "workflow.transition.triggered",'

# Rules Engine service topics
RULES_TOPICS='    "rules.evaluation.requested",
    "rules.evaluation.completed",
    "rules.evaluation.failed",
    "rules.rule.created",
    "rules.rule.updated",
    "rules.rule.deleted",
    "rules.condition.evaluated",
    "rules.action.executed",'

# API Gateway service topics
GATEWAY_TOPICS='    "gateway.query.received",
    "gateway.query.completed",
    "gateway.mutation.received",
    "gateway.mutation.completed",
    "gateway.federation.error",
    "gateway.auth.failed",
    "gateway.rate.limited",'

# Add Kafka modules to services
add_kafka_module "workflow" "$WORKFLOW_TOPICS"
add_kafka_module "rules-engine" "$RULES_TOPICS"
add_kafka_module "api-gateway" "$GATEWAY_TOPICS"

# Update app modules
update_app_module "workflow"
update_app_module "rules-engine"
update_app_module "api-gateway"

# Create Kafka topics configuration file
echo -e "\n${YELLOW}Creating Kafka topics configuration...${NC}"
cat > infrastructure/docker/kafka/create-topics.sh << 'EOF'
#!/bin/bash

# Wait for Kafka to be ready
sleep 10

# Create all topics
kafka-topics.sh --create --if-not-exists --topic workflow.process.started --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.process.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.process.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.assigned --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.task.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic workflow.transition.triggered --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

kafka-topics.sh --create --if-not-exists --topic rules.evaluation.requested --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.evaluation.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.evaluation.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.updated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.rule.deleted --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.condition.evaluated --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic rules.action.executed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

kafka-topics.sh --create --if-not-exists --topic gateway.query.received --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.query.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.mutation.received --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.mutation.completed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.federation.error --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.auth.failed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics.sh --create --if-not-exists --topic gateway.rate.limited --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

echo "All Kafka topics created successfully"
EOF

chmod +x infrastructure/docker/kafka/create-topics.sh

echo -e "\n${GREEN}✓ Kafka integration completed successfully!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review the generated Kafka modules"
echo "2. Update environment variables with KAFKA_BROKERS"
echo "3. Run docker-compose to test integration"
echo "4. Verify topic creation in Kafka"