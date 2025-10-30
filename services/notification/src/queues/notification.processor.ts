import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';

@Processor('notifications')
@Injectable()
export class NotificationProcessor {
  @Process()
  async handleNotification(job: Job) {
    console.log('Processing notification job:', job.data);
    return { processed: true };
  }
}
