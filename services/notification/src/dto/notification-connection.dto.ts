import { ObjectType, Field, Directive } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';

@ObjectType()
@Directive('@shareable')
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class NotificationEdge {
  @Field()
  cursor: string;

  @Field(() => Notification)
  node: Notification;
}

@ObjectType()
export class NotificationConnection {
  @Field(() => [NotificationEdge])
  edges: NotificationEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field()
  totalCount: number;
}