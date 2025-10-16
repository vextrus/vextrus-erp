import { Module } from '@nestjs/common';
import { EmailChannel } from './email.channel';
import { SmsChannel } from './sms.channel';
import { PushChannel } from './push.channel';

@Module({
  providers: [EmailChannel, SmsChannel, PushChannel],
  exports: [EmailChannel, SmsChannel, PushChannel],
})
export class ChannelsModule {}
