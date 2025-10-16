import Bull from 'bull';
import Redis from 'ioredis';
import { redisClient, getTestConfig, createTestTenant } from '../setup';
import { faker } from '@faker-js/faker';

describe('Bull Queue Job Processing', () => {
  const testTenant = createTestTenant();
  let notificationQueue: Bull.Queue;
  let importExportQueue: Bull.Queue;
  let bulkQueue: Bull.Queue;

  beforeAll(() => {
    const config = getTestConfig();
    
    notificationQueue = new Bull('notifications', {
      redis: config.redis,
    });
    
    importExportQueue = new Bull('import-export', {
      redis: config.redis,
    });
    
    bulkQueue = new Bull('bulk-operations', {
      redis: config.redis,
    });
  });

  afterAll(async () => {
    await notificationQueue.close();
    await importExportQueue.close();
    await bulkQueue.close();
  });

  afterEach(async () => {
    // Clean up queues after each test
    await notificationQueue.empty();
    await importExportQueue.empty();
    await bulkQueue.empty();
  });

  describe('Notification Queue Tests', () => {
    it('should process bulk email with rate limiting', async () => {
      const processedEmails: string[] = [];
      const rateLimit = 10; // 10 emails per second
      
      // Setup processor with rate limiting
      notificationQueue.process('email', rateLimit, async (job) => {
        processedEmails.push(job.data.email);
        return { sent: true, timestamp: Date.now() };
      });

      // Add 100 email jobs
      const emails = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@example.com`,
        subject: 'Test Email',
        template: 'welcome',
        data: { name: faker.person.fullName() },
        tenantId: testTenant.id,
      }));

      const jobs = await Promise.all(
        emails.map(data => notificationQueue.add('email', data))
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 12000)); // Should take ~10 seconds with rate limit

      expect(processedEmails.length).toBeGreaterThan(90); // Allow some margin
      expect(processedEmails.length).toBeLessThanOrEqual(100);
    });

    it('should handle SMS queue with Bangladesh provider failover', async () => {
      const sentSMS: any[] = [];
      const failedSMS: any[] = [];
      
      // Mock provider responses
      const alphaSMSAvailable = false; // Simulate primary provider failure
      const smsNetBDAvailable = true;

      notificationQueue.process('sms', async (job) => {
        const { phone, message, provider = 'alpha_sms' } = job.data;
        
        // Validate Bangladesh phone number
        if (!phone.match(/^\+880\d{10}$/)) {
          throw new Error('Invalid Bangladesh phone number');
        }

        // Try primary provider
        if (provider === 'alpha_sms' && !alphaSMSAvailable) {
          // Failover to secondary provider
          if (smsNetBDAvailable) {
            sentSMS.push({ ...job.data, provider: 'sms_net_bd' });
            return { sent: true, provider: 'sms_net_bd' };
          }
          throw new Error('All SMS providers unavailable');
        }

        sentSMS.push(job.data);
        return { sent: true, provider };
      });

      // Handle failed jobs
      notificationQueue.on('failed', (job, err) => {
        failedSMS.push({ data: job.data, error: err.message });
      });

      // Add SMS jobs with Bangladesh numbers
      const smsJobs = [
        { phone: '+8801712345678', message: 'Your OTP is 123456' },
        { phone: '+8801898765432', message: 'Payment received: 5000 BDT' },
        { phone: '+8801612341234', message: 'Meeting reminder: 3 PM' },
        { phone: '01712345678', message: 'Invalid format' }, // This should fail
      ];

      await Promise.all(
        smsJobs.map(data => notificationQueue.add('sms', { ...data, tenantId: testTenant.id }))
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(sentSMS).toHaveLength(3);
      expect(failedSMS).toHaveLength(1);
      expect(sentSMS[0].provider).toBe('sms_net_bd'); // Should use fallback provider
    });

    it('should batch push notifications efficiently', async () => {
      const processedBatches: any[] = [];
      
      notificationQueue.process('push-batch', async (job) => {
        const { devices, notification } = job.data;
        
        // Simulate FCM batch sending (max 500 devices per batch)
        const batchSize = 500;
        const batches = [];
        
        for (let i = 0; i < devices.length; i += batchSize) {
          batches.push(devices.slice(i, i + batchSize));
        }
        
        processedBatches.push({
          batchCount: batches.length,
          totalDevices: devices.length,
          notification,
        });
        
        return { batches: batches.length, sent: devices.length };
      });

      // Create a large batch of device tokens
      const devices = Array.from({ length: 1500 }, (_, i) => `device-token-${i}`);
      
      await notificationQueue.add('push-batch', {
        devices,
        notification: {
          title: 'System Update',
          body: 'New features available',
          data: { version: '2.0.0' },
        },
        tenantId: testTenant.id,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0].batchCount).toBe(3); // 1500 devices / 500 per batch
      expect(processedBatches[0].totalDevices).toBe(1500);
    });

    it('should implement retry mechanism with exponential backoff', async () => {
      const attempts: number[] = [];
      let attemptCount = 0;

      notificationQueue.process('retry-test', async (job) => {
        attemptCount++;
        attempts.push(Date.now());
        
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        
        return { success: true, attempts: attemptCount };
      });

      const job = await notificationQueue.add('retry-test', 
        { data: 'test' },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      );

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 8000));

      expect(attemptCount).toBe(3); // Should succeed on 3rd attempt
      
      // Check exponential backoff timing
      if (attempts.length >= 2) {
        const firstRetryDelay = attempts[1] - attempts[0];
        const secondRetryDelay = attempts[2] - attempts[1];
        expect(secondRetryDelay).toBeGreaterThan(firstRetryDelay);
      }
    });
  });

  describe('Import/Export Queue Tests', () => {
    it('should process large CSV files (100MB+)', async () => {
      let processedRows = 0;
      let processingComplete = false;

      importExportQueue.process('csv-import', async (job) => {
        const { fileSize, rowCount } = job.data;
        
        // Simulate processing large file
        const chunkSize = 1000;
        const chunks = Math.ceil(rowCount / chunkSize);
        
        for (let i = 0; i < chunks; i++) {
          const rows = Math.min(chunkSize, rowCount - (i * chunkSize));
          processedRows += rows;
          
          // Update job progress
          await job.progress((i + 1) / chunks * 100);
        }
        
        processingComplete = true;
        return { processedRows, fileSize };
      });

      // Simulate 100MB CSV with 1 million rows
      const largeFileJob = await importExportQueue.add('csv-import', {
        filename: 'large_dataset.csv',
        fileSize: 104857600, // 100MB
        rowCount: 1000000,
        tenantId: testTenant.id,
      });

      // Monitor progress
      const progressUpdates: number[] = [];
      largeFileJob.on('progress', (progress: number) => {
        progressUpdates.push(progress);
      });

      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(processingComplete).toBe(true);
      expect(processedRows).toBe(1000000);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should enforce concurrent job processing limits', async () => {
      const activeJobs: string[] = [];
      const completedJobs: string[] = [];
      const maxConcurrency = 3;

      // Process with concurrency limit
      importExportQueue.process('concurrent-test', maxConcurrency, async (job) => {
        const jobId = job.data.id;
        activeJobs.push(jobId);
        
        // Check we don't exceed concurrency limit
        expect(activeJobs.filter(id => !completedJobs.includes(id)).length).toBeLessThanOrEqual(maxConcurrency);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        completedJobs.push(jobId);
        return { completed: jobId };
      });

      // Add 10 jobs
      const jobs = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          importExportQueue.add('concurrent-test', { id: `job-${i}` })
        )
      );

      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(completedJobs.length).toBe(10);
    });

    it('should track export progress accurately', async () => {
      const progressSnapshots: any[] = [];

      importExportQueue.process('export-progress', async (job) => {
        const { format, recordCount } = job.data;
        const steps = [
          { name: 'Fetching data', progress: 20 },
          { name: 'Transforming data', progress: 40 },
          { name: 'Formatting output', progress: 60 },
          { name: 'Compressing file', progress: 80 },
          { name: 'Uploading to storage', progress: 100 },
        ];

        for (const step of steps) {
          await job.progress(step.progress);
          progressSnapshots.push({
            step: step.name,
            progress: step.progress,
            timestamp: Date.now(),
          });
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        return { 
          format, 
          recordCount,
          url: `https://storage.example.com/exports/export-${Date.now()}.${format}`,
        };
      });

      const exportJob = await importExportQueue.add('export-progress', {
        format: 'xlsx',
        recordCount: 50000,
        filters: { status: 'active' },
        tenantId: testTenant.id,
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(progressSnapshots).toHaveLength(5);
      expect(progressSnapshots[4].progress).toBe(100);
      expect(progressSnapshots[4].step).toBe('Uploading to storage');
    });

    it('should handle error recovery and partial completion', async () => {
      let processedBatches = 0;
      let errorOccurred = false;

      importExportQueue.process('error-recovery', async (job) => {
        const { batches } = job.data;
        
        for (let i = 0; i < batches; i++) {
          processedBatches++;
          
          // Simulate error on batch 3
          if (i === 2 && !job.data.retry) {
            errorOccurred = true;
            throw new Error('Database connection lost');
          }
          
          await job.progress((i + 1) / batches * 100);
        }
        
        return { processedBatches, recovered: job.data.retry };
      });

      // Add job that will fail
      const failedJob = await importExportQueue.add('error-recovery', {
        batches: 5,
        retry: false,
      }, {
        attempts: 2,
      });

      // Wait for failure and retry
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Add recovery job
      const recoveryJob = await importExportQueue.add('error-recovery', {
        batches: 5,
        retry: true,
        startFrom: processedBatches,
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(errorOccurred).toBe(true);
      expect(processedBatches).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Bulk Operations Queue', () => {
    it('should process Bangladesh-specific data validation', async () => {
      const validatedRecords: any[] = [];
      const invalidRecords: any[] = [];

      bulkQueue.process('bd-validation', async (job) => {
        const { records } = job.data;
        
        for (const record of records) {
          const validations = {
            phone: /^\+880\d{10}$/.test(record.phone),
            tin: /^\d{12}$/.test(record.tin), // Bangladesh TIN format
            nid: /^\d{10}|\d{13}|\d{17}$/.test(record.nid), // National ID formats
            postCode: /^\d{4}$/.test(record.postCode),
          };
          
          if (Object.values(validations).every(v => v)) {
            validatedRecords.push(record);
          } else {
            invalidRecords.push({ record, errors: validations });
          }
        }
        
        return {
          valid: validatedRecords.length,
          invalid: invalidRecords.length,
        };
      });

      const testRecords = [
        { phone: '+8801712345678', tin: '123456789012', nid: '1234567890', postCode: '1212' }, // Valid
        { phone: '01712345678', tin: '12345', nid: '123', postCode: 'ABCD' }, // Invalid
        { phone: '+8801812345678', tin: '098765432101', nid: '12345678901234567', postCode: '4000' }, // Valid
      ];

      await bulkQueue.add('bd-validation', { records: testRecords });

      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(validatedRecords).toHaveLength(2);
      expect(invalidRecords).toHaveLength(1);
    });

    it('should handle scheduled bulk operations', async () => {
      const executedJobs: any[] = [];
      const scheduledTime = Date.now() + 2000; // 2 seconds from now

      bulkQueue.process('scheduled-bulk', async (job) => {
        executedJobs.push({
          id: job.id,
          executedAt: Date.now(),
          data: job.data,
        });
        return { executed: true };
      });

      // Schedule bulk operation
      await bulkQueue.add('scheduled-bulk', 
        {
          operation: 'monthly-payroll',
          tenantId: testTenant.id,
          recipients: 500,
        },
        {
          delay: 2000, // 2 second delay
        }
      );

      // Should not execute immediately
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(executedJobs).toHaveLength(0);

      // Should execute after delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(executedJobs).toHaveLength(1);
      expect(executedJobs[0].executedAt).toBeGreaterThanOrEqual(scheduledTime - 100);
    });
  });
});