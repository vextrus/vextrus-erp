import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { kafkaClient, getTestConfig, createTestTenant } from '../setup';

describe('Kafka Inter-Service Communication', () => {
  let producer: Producer;
  let consumer: Consumer;
  const testTenant = createTestTenant();

  beforeAll(async () => {
    producer = kafkaClient.producer();
    consumer = kafkaClient.consumer({ groupId: 'test-group' });
    
    await producer.connect();
    await consumer.connect();
  });

  afterAll(async () => {
    await producer.disconnect();
    await consumer.disconnect();
  });

  describe('Audit Event Propagation', () => {
    it('should propagate audit events when user actions occur', async () => {
      const auditTopic = 'audit.events';
      const receivedEvents: any[] = [];

      // Subscribe to audit events
      await consumer.subscribe({ topic: auditTopic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          receivedEvents.push(JSON.parse(message.value?.toString() || '{}'));
        },
      });

      // Simulate user action event
      const userActionEvent = {
        eventType: 'USER_ACTION',
        entityType: 'Project',
        entityId: 'proj-123',
        action: 'UPDATE',
        userId: 'user-456',
        tenantId: testTenant.id,
        timestamp: new Date().toISOString(),
        changes: {
          before: { status: 'PENDING' },
          after: { status: 'APPROVED' },
        },
        metadata: {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-789',
        },
      };

      await producer.send({
        topic: auditTopic,
        messages: [{ value: JSON.stringify(userActionEvent) }],
      });

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toMatchObject({
        eventType: 'USER_ACTION',
        entityType: 'Project',
        action: 'UPDATE',
        tenantId: testTenant.id,
      });
    });

    it('should ensure multi-tenant event isolation', async () => {
      const tenant1Events: any[] = [];
      const tenant2Events: any[] = [];
      const tenant1 = { ...testTenant, id: 'tenant-1' };
      const tenant2 = { ...testTenant, id: 'tenant-2' };

      // Create separate consumers for each tenant
      const tenant1Consumer = kafkaClient.consumer({ groupId: 'tenant1-group' });
      const tenant2Consumer = kafkaClient.consumer({ groupId: 'tenant2-group' });
      
      await tenant1Consumer.connect();
      await tenant2Consumer.connect();
      
      await tenant1Consumer.subscribe({ topic: 'tenant.events', fromBeginning: true });
      await tenant2Consumer.subscribe({ topic: 'tenant.events', fromBeginning: true });

      // Setup message handlers with tenant filtering
      await tenant1Consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          const event = JSON.parse(message.value?.toString() || '{}');
          if (event.tenantId === tenant1.id) {
            tenant1Events.push(event);
          }
        },
      });

      await tenant2Consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          const event = JSON.parse(message.value?.toString() || '{}');
          if (event.tenantId === tenant2.id) {
            tenant2Events.push(event);
          }
        },
      });

      // Send events for different tenants
      await producer.send({
        topic: 'tenant.events',
        messages: [
          { value: JSON.stringify({ tenantId: tenant1.id, data: 'tenant1-data' }) },
          { value: JSON.stringify({ tenantId: tenant2.id, data: 'tenant2-data' }) },
          { value: JSON.stringify({ tenantId: tenant1.id, data: 'tenant1-data-2' }) },
        ],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(tenant1Events).toHaveLength(2);
      expect(tenant2Events).toHaveLength(1);
      
      await tenant1Consumer.disconnect();
      await tenant2Consumer.disconnect();
    });
  });

  describe('Notification Triggers', () => {
    it('should trigger notifications from other services', async () => {
      const notificationTopic = 'notification.triggers';
      const notifications: any[] = [];

      await consumer.subscribe({ topic: notificationTopic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          notifications.push(JSON.parse(message.value?.toString() || '{}'));
        },
      });

      // Simulate project approval triggering notification
      const approvalNotification = {
        type: 'PROJECT_APPROVED',
        channels: ['email', 'sms', 'push'],
        recipient: {
          userId: 'user-123',
          email: 'user@example.com',
          phone: '+8801712345678',
        },
        tenantId: testTenant.id,
        data: {
          projectName: 'Dhaka Metro Rail',
          approvedBy: 'Project Director',
          approvalDate: new Date().toISOString(),
        },
        template: 'project_approval',
        priority: 'high',
      };

      await producer.send({
        topic: notificationTopic,
        messages: [{ value: JSON.stringify(approvalNotification) }],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'PROJECT_APPROVED',
        channels: expect.arrayContaining(['email', 'sms', 'push']),
        recipient: expect.objectContaining({
          phone: expect.stringMatching(/^\+880/),
        }),
      });
    });

    it('should handle bulk notification requests', async () => {
      const bulkTopic = 'notification.bulk';
      const processedBatches: any[] = [];

      await consumer.subscribe({ topic: bulkTopic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          processedBatches.push(JSON.parse(message.value?.toString() || '{}'));
        },
      });

      // Create bulk notification request
      const bulkRequest = {
        batchId: 'batch-' + Date.now(),
        tenantId: testTenant.id,
        type: 'MONTHLY_PAYSLIP',
        recipients: Array.from({ length: 100 }, (_, i) => ({
          userId: `user-${i}`,
          email: `employee${i}@company.bd`,
          phone: `+88017${String(i).padStart(8, '0')}`,
        })),
        template: 'payslip_notification',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      await producer.send({
        topic: bulkTopic,
        messages: [{ value: JSON.stringify(bulkRequest) }],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0].recipients).toHaveLength(100);
    });
  });

  describe('Configuration Updates', () => {
    it('should broadcast configuration changes to all services', async () => {
      const configTopic = 'config.updates';
      const configUpdates: any[] = [];

      await consumer.subscribe({ topic: configTopic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          configUpdates.push(JSON.parse(message.value?.toString() || '{}'));
        },
      });

      // Simulate configuration update
      const configUpdate = {
        tenantId: testTenant.id,
        service: 'notification',
        changes: {
          smsProvider: {
            before: 'alpha_sms',
            after: 'sms_net_bd',
            reason: 'Provider maintenance',
          },
          rateLimit: {
            before: 100,
            after: 150,
            unit: 'per_hour',
          },
        },
        appliedBy: 'admin-user',
        effectiveFrom: new Date().toISOString(),
      };

      await producer.send({
        topic: configTopic,
        messages: [{ value: JSON.stringify(configUpdate) }],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(configUpdates).toHaveLength(1);
      expect(configUpdates[0]).toMatchObject({
        service: 'notification',
        changes: expect.objectContaining({
          smsProvider: expect.objectContaining({
            after: 'sms_net_bd',
          }),
        }),
      });
    });
  });

  describe('Event Streaming Reliability', () => {
    it('should guarantee at-least-once message delivery', async () => {
      const reliabilityTopic = 'reliability.test';
      const receivedMessages = new Set<string>();

      await consumer.subscribe({ topic: reliabilityTopic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          const msg = JSON.parse(message.value?.toString() || '{}');
          receivedMessages.add(msg.id);
        },
      });

      // Send messages with unique IDs
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        data: `test-data-${i}`,
      }));

      for (const msg of messages) {
        await producer.send({
          topic: reliabilityTopic,
          messages: [{ value: JSON.stringify(msg) }],
        });
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(receivedMessages.size).toBe(10);
      messages.forEach(msg => {
        expect(receivedMessages.has(msg.id)).toBe(true);
      });
    });

    it('should handle dead letter queue for failed messages', async () => {
      const mainTopic = 'process.events';
      const dlqTopic = 'process.events.dlq';
      const dlqMessages: any[] = [];

      const dlqConsumer = kafkaClient.consumer({ groupId: 'dlq-group' });
      await dlqConsumer.connect();
      await dlqConsumer.subscribe({ topic: dlqTopic, fromBeginning: true });
      
      await dlqConsumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          dlqMessages.push(JSON.parse(message.value?.toString() || '{}'));
        },
      });

      // Simulate a message that will fail processing
      const failedMessage = {
        id: 'fail-msg-1',
        data: null, // This will cause processing to fail
        tenantId: testTenant.id,
        retryCount: 3,
        lastError: 'Processing failed: null data',
      };

      // Send to DLQ after max retries
      await producer.send({
        topic: dlqTopic,
        messages: [{ value: JSON.stringify(failedMessage) }],
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(dlqMessages).toHaveLength(1);
      expect(dlqMessages[0]).toMatchObject({
        id: 'fail-msg-1',
        retryCount: 3,
      });

      await dlqConsumer.disconnect();
    });
  });
});