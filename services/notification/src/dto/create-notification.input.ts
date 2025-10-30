import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsDate } from 'class-validator';
import { NotificationChannel, NotificationStatus } from '../entities/notification.entity';

@InputType()
export class CreateNotificationInput {
  @Field()
  @IsString()
  tenant_id: string;

  @Field()
  @IsString()
  recipient: string;

  @Field(() => NotificationChannel)
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @Field()
  @IsString()
  subject: string;

  @Field()
  @IsString()
  content: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  template_id?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  template_name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  template_data?: any;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true, defaultValue: 'normal' })
  @IsString()
  @IsOptional()
  priority?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  metadata?: any;

  @Field(() => String, { nullable: true })
  @IsOptional()
  variables?: any;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  batch_id?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  scheduled_for?: Date;
}