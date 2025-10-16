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
    'organization.created',
    'organization.updated',
    'organization.deleted',
    'organization.suspended',
    'organization.activated',
    'tenant.created',
    'tenant.updated',
    'tenant.deleted',
    'tenant.activated',
    'tenant.suspended',
    'division.created',
    'division.updated',
    'division.deleted',
    'subscription.changed',
    'subscription.expired',
    'license.exceeded',
    'compliance.validated',
  ];

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'organization-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'organization-service-group' });
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
      this.logger.log(`Created topics: ${topicsToCreate.join(', ')}`);
    }
  }

  private async subscribeToTopics() {
    // Subscribe to relevant topics for this service
    const subscribeTopics = this.getSubscriptionTopics();
    if (subscribeTopics.length > 0) {
      await this.consumer.subscribe({ topics: subscribeTopics, fromBeginning: false });
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.log(`Received message from topic ${topic}`);
          await this.handleMessage(topic, message);
        },
      });
    }
  }

  private getSubscriptionTopics(): string[] {
    // Organization service listens to events from other services
    return [
      'auth.user.created', // Create default organization for new users
      'auth.user.deleted', // Handle user deletion in organizations
      'workflow.process.completed', // Update organization metrics
      'rules.compliance.checked', // Handle compliance validations
    ];
  }

  private async handleMessage(topic: string, message: any) {
    try {
      const payload = JSON.parse(message.value?.toString() || '{}');
      this.logger.log(`Processing message from ${topic}`, payload);
      
      switch (topic) {
        case 'auth.user.created':
          // Handle new user creation - potentially create default organization
          break;
        case 'auth.user.deleted':
          // Handle user deletion - update organization user counts
          break;
        case 'workflow.process.completed':
          // Update organization usage metrics
          break;
        case 'rules.compliance.checked':
          // Update organization compliance status
          break;
        default:
          this.logger.warn(`Unhandled topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}`, error);
    }
  }

  // Organization events
  async publishOrganizationCreated(organization: any) {
    await this.publish('organization.created', {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      subscriptionPlan: organization.subscriptionPlan,
      tin: organization.tin,
      bin: organization.bin,
      createdAt: organization.createdAt,
      createdBy: organization.createdBy,
    });
  }

  async publishOrganizationUpdated(organization: any, changes: any) {
    await this.publish('organization.updated', {
      id: organization.id,
      name: organization.name,
      changes,
      updatedAt: new Date(),
      updatedBy: organization.lastModifiedBy,
    });
  }

  async publishOrganizationDeleted(organizationId: string, deletedBy: string) {
    await this.publish('organization.deleted', {
      id: organizationId,
      deletedAt: new Date(),
      deletedBy,
    });
  }

  async publishOrganizationSuspended(organizationId: string, reason: string) {
    await this.publish('organization.suspended', {
      id: organizationId,
      reason,
      suspendedAt: new Date(),
    });
  }

  // Tenant events
  async publishTenantCreated(tenant: any) {
    await this.publish('tenant.created', {
      id: tenant.id,
      organizationId: tenant.organizationId,
      code: tenant.code,
      name: tenant.name,
      settings: tenant.settings,
      createdAt: tenant.createdAt,
    });
  }

  async publishTenantUpdated(tenant: any, changes: any) {
    await this.publish('tenant.updated', {
      id: tenant.id,
      organizationId: tenant.organizationId,
      code: tenant.code,
      changes,
      updatedAt: new Date(),
    });
  }

  async publishTenantDeleted(tenantId: string, organizationId: string) {
    await this.publish('tenant.deleted', {
      id: tenantId,
      organizationId,
      deletedAt: new Date(),
    });
  }

  async publishTenantActivated(tenantId: string, organizationId: string) {
    await this.publish('tenant.activated', {
      id: tenantId,
      organizationId,
      activatedAt: new Date(),
    });
  }

  async publishTenantSuspended(tenantId: string, organizationId: string, reason: string) {
    await this.publish('tenant.suspended', {
      id: tenantId,
      organizationId,
      reason,
      suspendedAt: new Date(),
    });
  }

  // Division events
  async publishDivisionCreated(division: any) {
    await this.publish('division.created', {
      id: division.id,
      organizationId: division.organizationId,
      name: division.name,
      code: division.code,
      type: division.type,
      createdAt: division.createdAt,
    });
  }

  async publishDivisionUpdated(division: any, changes: any) {
    await this.publish('division.updated', {
      id: division.id,
      organizationId: division.organizationId,
      changes,
      updatedAt: new Date(),
    });
  }

  async publishDivisionDeleted(divisionId: string, organizationId: string) {
    await this.publish('division.deleted', {
      id: divisionId,
      organizationId,
      deletedAt: new Date(),
    });
  }

  // Subscription events
  async publishSubscriptionChanged(organizationId: string, oldPlan: string, newPlan: string) {
    await this.publish('subscription.changed', {
      organizationId,
      oldPlan,
      newPlan,
      changedAt: new Date(),
    });
  }

  async publishSubscriptionExpired(organizationId: string) {
    await this.publish('subscription.expired', {
      organizationId,
      expiredAt: new Date(),
    });
  }

  // License events
  async publishLicenseExceeded(organizationId: string, resourceType: string, current: number, limit: number) {
    await this.publish('license.exceeded', {
      organizationId,
      resourceType,
      current,
      limit,
      exceededAt: new Date(),
    });
  }

  // Compliance events
  async publishComplianceValidated(organizationId: string, complianceType: string, isValid: boolean) {
    await this.publish('compliance.validated', {
      organizationId,
      complianceType,
      isValid,
      validatedAt: new Date(),
    });
  }

  private async publish(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || message.organizationId || Date.now().toString(),
            value: JSON.stringify(message),
            headers: {
              service: 'organization',
              timestamp: Date.now().toString(),
            },
          },
        ],
      });
      this.logger.log(`Published message to ${topic}`);
    } catch (error) {
      this.logger.error(`Error publishing to ${topic}`, error);
      throw error;
    }
  }
}