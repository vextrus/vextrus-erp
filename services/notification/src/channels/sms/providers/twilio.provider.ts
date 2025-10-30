import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { SMSDto } from '../../../dto/sms.dto';
import { SMSResponse } from '../sms.channel';

@Injectable()
export class TwilioProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly client: twilio.Twilio;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get('sms.twilio.accountSid');
    const authToken = this.configService.get('sms.twilio.authToken');
    
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.fromNumber = this.configService.get('sms.twilio.fromNumber') || '';
    }
  }

  async send(dto: SMSDto): Promise<SMSResponse> {
    if (!this.client) {
      throw new Error('Twilio client not configured');
    }

    try {
      this.logger.debug(`Sending SMS via Twilio to ${dto.to}`);
      
      const message = await this.client.messages.create({
        body: dto.message,
        from: this.fromNumber,
        to: dto.to,
      });

      return {
        success: true,
        messageId: message.sid,
        provider: 'twilio',
        segments: message.numSegments ? parseInt(message.numSegments) : 1,
        cost: message.price ? Math.abs(parseFloat(message.price)) : undefined,
        unicode: false,
      };
    } catch (error: any) {
      this.logger.error(`Twilio error: ${error.message}`);
      throw error;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not configured');
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error: any) {
      this.logger.error(`Failed to get delivery status: ${error.message}`);
      throw error;
    }
  }
}