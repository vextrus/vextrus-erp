import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationStatus } from '../entities/notification.entity';

@InputType()
export class UpdateNotificationStatusInput {
  @Field()
  @IsString()
  id: string;

  @Field(() => NotificationStatus)
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  error_message?: string;

  @Field({ nullable: true })
  @IsOptional()
  sent_at?: Date;

  @Field({ nullable: true })
  @IsOptional()
  failed_at?: Date;
}