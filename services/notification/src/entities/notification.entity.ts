import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from '@nestjs/graphql';
import { Directive } from '@nestjs/graphql';

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  READ = 'read',
}

// Register enums for GraphQL
registerEnumType(NotificationChannel, {
  name: 'NotificationChannel',
  description: 'Notification delivery channel',
});

registerEnumType(NotificationStatus, {
  name: 'NotificationStatus',
  description: 'Status of notification delivery',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('notifications')
@Index(['tenant_id', 'createdAt'])
@Index(['tenant_id', 'status'])
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  @Index()
  tenant_id: string;

  @Field()
  @Column()
  recipient: string;

  @Field(() => NotificationChannel)
  @Column()
  channel: string;

  @Field()
  @Column()
  subject: string;

  @Field()
  @Column('text')
  content: string;

  @Field(() => NotificationStatus)
  @Column({ default: 'pending' })
  status: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  template_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  type: string;

  @Field()
  @Column({ default: 'normal' })
  priority: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  metadata: any;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  variables: any;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  scheduled_for: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  failed_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  error_message: string;

  @Field()
  @Column({ default: 0 })
  retry_count: number;

  @Field()
  @Column({ default: 3 })
  max_retries: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  template_name: string;

  @Field(() => String, { nullable: true })
  @Column('jsonb', { nullable: true })
  template_data: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  batch_id: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
