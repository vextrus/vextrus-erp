import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  async send(data: any) {
    console.log('Sending notification:', data);
    return { success: true, id: Date.now() };
  }
}
