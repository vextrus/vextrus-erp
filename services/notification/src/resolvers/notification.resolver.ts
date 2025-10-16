import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveReference,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationInput } from '../dto/create-notification.input';
import { UpdateNotificationStatusInput } from '../dto/update-notification-status.input';
import { NotificationConnection } from '../dto/notification-connection.dto';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
  ) {}

  @Query(() => Notification, { nullable: true })
  async notification(@Args('id') id: string): Promise<Notification> {
    return this.notificationService.findById(id);
  }

  @Query(() => [Notification])
  async notifications(
    @Args('tenantId') tenantId: string,
    @Args('limit', { type: () => Number, defaultValue: 100 }) limit: number,
    @Args('offset', { type: () => Number, defaultValue: 0 }) offset: number,
  ): Promise<Notification[]> {
    return this.notificationService.findByTenant(tenantId, limit, offset);
  }

  @Query(() => [Notification])
  async pendingNotifications(
    @Args('tenantId') tenantId: string,
  ): Promise<Notification[]> {
    return this.notificationService.findPending(tenantId);
  }

  @Query(() => NotificationConnection)
  async notificationsPaginated(
    @Args('tenantId') tenantId: string,
    @Args('first', { type: () => Number, nullable: true }) first?: number,
    @Args('after', { nullable: true }) after?: string,
    @Args('last', { type: () => Number, nullable: true }) last?: number,
    @Args('before', { nullable: true }) before?: string,
  ): Promise<NotificationConnection> {
    return this.notificationService.findPaginated({
      tenantId,
      first,
      after,
      last,
      before,
    });
  }

  @Mutation(() => Notification)
  async sendNotification(
    @Args('input') input: CreateNotificationInput,
  ): Promise<Notification> {
    return this.notificationService.send(input);
  }

  @Mutation(() => [Notification])
  async sendBulkNotifications(
    @Args('inputs', { type: () => [CreateNotificationInput] })
    inputs: CreateNotificationInput[],
  ): Promise<Notification[]> {
    return this.notificationService.sendBulk(inputs);
  }

  @Mutation(() => Notification)
  async scheduleNotification(
    @Args('input') input: CreateNotificationInput,
    @Args('scheduledFor') scheduledFor: Date,
  ): Promise<Notification> {
    return this.notificationService.schedule(input, scheduledFor);
  }

  @Mutation(() => Notification)
  async updateNotificationStatus(
    @Args('input') input: UpdateNotificationStatusInput,
  ): Promise<Notification> {
    return this.notificationService.updateStatus(input);
  }

  @Mutation(() => Boolean)
  async markAsRead(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.notificationService.markAsRead(id);
  }

  @Mutation(() => Boolean)
  async retryFailedNotification(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.notificationService.retryFailed(id);
  }

  @Mutation(() => Boolean)
  async cancelScheduledNotification(
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.notificationService.cancelScheduled(id);
  }

  @ResolveReference()
  async resolveReference(reference: {
    __typename: string;
    id: string;
  }): Promise<Notification> {
    return this.notificationService.findById(reference.id);
  }
}