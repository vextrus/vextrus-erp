import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { CreateNotificationInput } from '../dto/create-notification.input';
import { UpdateNotificationStatusInput } from '../dto/update-notification-status.input';
import { NotificationConnection } from '../dto/notification-connection.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientProxy,
  ) {}

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async findByTenant(tenantId: string, limit: number, offset: number): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { tenant_id: tenantId },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        tenant_id: tenantId,
        status: NotificationStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async send(input: CreateNotificationInput): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...input,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Emit to Kafka for async processing
    try {
      await lastValueFrom(
        this.kafkaClient.emit('notification.created', {
          id: savedNotification.id,
          channel: savedNotification.channel,
          recipient: savedNotification.recipient,
          subject: savedNotification.subject,
          content: savedNotification.content,
          metadata: savedNotification.metadata,
        })
      );
    } catch (error) {
      console.error('Failed to emit notification event:', error);
    }

    return savedNotification;
  }

  async sendBulk(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const batchId = `batch_${Date.now()}`;
    const notifications = await Promise.all(
      inputs.map(input => this.send({ ...input, batch_id: batchId }))
    );
    return notifications;
  }

  async schedule(input: CreateNotificationInput, scheduledFor: Date): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...input,
      scheduled_for: scheduledFor,
      status: NotificationStatus.PENDING,
      createdAt: new Date(),
    });

    return this.notificationRepository.save(notification);
  }

  async updateStatus(input: UpdateNotificationStatusInput): Promise<Notification> {
    const notification = await this.findById(input.id);

    Object.assign(notification, {
      status: input.status,
      error_message: input.error_message,
      sent_at: input.sent_at,
      failed_at: input.failed_at,
    });

    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { id },
      { status: NotificationStatus.READ }
    );
    return (result.affected ?? 0) > 0;
  }

  async retryFailed(id: string): Promise<boolean> {
    const notification = await this.findById(id);

    if (notification.status !== NotificationStatus.FAILED) {
      return false;
    }

    if (notification.retry_count >= notification.max_retries) {
      return false;
    }

    await this.notificationRepository.update(
      { id },
      {
        status: NotificationStatus.PENDING,
        retry_count: notification.retry_count + 1,
        error_message: undefined,
        failed_at: undefined,
      }
    );

    // Re-emit for processing
    await lastValueFrom(
      this.kafkaClient.emit('notification.retry', {
        id: notification.id,
        retry_count: notification.retry_count + 1,
      })
    );

    return true;
  }

  async cancelScheduled(id: string): Promise<boolean> {
    const notification = await this.findById(id);

    if (notification.status !== NotificationStatus.PENDING || !notification.scheduled_for) {
      return false;
    }

    const result = await this.notificationRepository.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async findPaginated(params: {
    tenantId: string;
    first?: number;
    after?: string;
    last?: number;
    before?: string;
  }): Promise<NotificationConnection> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenant_id = :tenantId', { tenantId: params.tenantId })
      .orderBy('notification.createdAt', 'DESC');

    let limit = 10;
    let offset = 0;

    if (params.first) {
      limit = params.first;
      if (params.after) {
        const decodedCursor = Buffer.from(params.after, 'base64').toString('utf-8');
        offset = parseInt(decodedCursor, 10) + 1;
      }
    } else if (params.last) {
      limit = params.last;
      if (params.before) {
        const decodedCursor = Buffer.from(params.before, 'base64').toString('utf-8');
        const totalCount = await query.getCount();
        offset = Math.max(0, totalCount - parseInt(decodedCursor, 10) - params.last);
      }
    }

    const [items, totalCount] = await query
      .skip(offset)
      .take(limit + 1) // Fetch one extra to check for next page
      .getManyAndCount();

    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items.pop(); // Remove the extra item
    }

    const edges = items.map((item, index) => ({
      cursor: Buffer.from(`${offset + index}`).toString('base64'),
      node: item,
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage: offset > 0,
        startCursor: edges[0]?.cursor || undefined,
        endCursor: edges[edges.length - 1]?.cursor || undefined,
      },
      totalCount,
    };
  }

  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduled_for: LessThan(now),
      },
    });

    for (const notification of scheduledNotifications) {
      await lastValueFrom(
        this.kafkaClient.emit('notification.scheduled', {
          id: notification.id,
        })
      );
    }
  }
}