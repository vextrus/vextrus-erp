import { Injectable } from '@nestjs/common';

@Injectable()
export class PushChannel {
  async send(token: string, message: any) {
    console.log(`Push to ${token}:`, message);
    return { success: true };
  }
}
