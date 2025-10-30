import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsChannel {
  async send(to: string, message: string) {
    console.log(`SMS to ${to}: ${message}`);
    return { success: true };
  }
}
