import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditConsumer {
  async processAuditEvent(event: any) {
    console.log('Processing audit event:', event);
    return { processed: true };
  }
}
