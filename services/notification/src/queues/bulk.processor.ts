import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationChannel, NotificationStatus } from '../entities/notification.entity';
import { EmailChannel } from '../channels/email/email.channel';
import { SMSChannel } from '../channels/sms/sms.channel';
import { PushChannel } from '../channels/push/push.channel';

@Processor('bulk-notification')
export class BulkProcessor {
  private readonly logger = new Logger(BulkProcessor.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SMSChannel,
    private readonly pushChannel: PushChannel,
  ) {}

  @Process('process-bulk')
  async handleBulk(job: Job) {
    const { batchId, tenantId, channel, recipients, message, template, templateData } = job.data;
    this.logger.log(`Processing bulk notification batch ${batchId}`);

    const results: { recipient: any; status: string; error?: string }[] = [];
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const notification = await this.createNotification({
              tenant_id: tenantId,
              channel,
              recipient: recipient.email || recipient.phone || recipient.token,
              subject: message?.subject,
              content: message?.body || message?.content,
              template_name: template,
              template_data: { ...templateData, ...recipient.data },
              batch_id: batchId,
            });

            await this.sendNotification(notification, channel, recipient, message);
            results.push({ recipient, status: 'success' });
          } catch (error: any) {
            this.logger.error(`Failed to send to ${JSON.stringify(recipient)}: ${error.message}`);
            results.push({ recipient, status: 'failed', error: error.message });
          }
        }),
      );

      // Progress update
      const progress = Math.round(((i + batch.length) / recipients.length) * 100);
      await job.progress(progress);
    }

    return {
      batchId,
      total: recipients.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  }

  private async createNotification(data: Partial<Notification>) {
    const notification = this.notificationRepository.create({
      ...data,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  private async sendNotification(
    notification: Notification,
    channel: NotificationChannel,
    recipient: any,
    message: any,
  ) {
    try {

      let result;
      switch (channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailChannel.send({
            to: recipient.email,
            subject: message.subject,
            html: message.body,
            templateData: recipient.data,
          });
          break;

        case NotificationChannel.SMS:
          result = await this.smsChannel.send({
            to: recipient.phone,
            message: message.body,
          });
          break;

        case NotificationChannel.PUSH:
          result = await this.pushChannel.send({
            tokens: [recipient.token],
            title: message.title,
            body: message.body,
            data: recipient.data,
          });
          break;

        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      if (result.success) {
        notification.status = NotificationStatus.SENT;
        notification.sent_at = new Date();
        notification.metadata = {
          ...notification.metadata,
          provider: result.provider,
          provider_message_id: result.messageId,
        };
      } else {
        throw new Error(result.error);
      }

      await this.notificationRepository.save(notification);
    } catch (error: any) {
      notification.status = NotificationStatus.FAILED;
      notification.failed_at = new Date();
      notification.error_message = error.message;
      await this.notificationRepository.save(notification);
      throw error;
    }
  }
}