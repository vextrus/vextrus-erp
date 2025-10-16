import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailChannel {
  async send(to: string, subject: string, content: string) {
    console.log(`Email to ${to}: ${subject}`);
    return { success: true };
  }
}
