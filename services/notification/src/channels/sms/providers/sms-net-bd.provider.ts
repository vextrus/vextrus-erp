import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SMSDto } from '../../../dto/sms.dto';
import { SMSResponse } from '../sms.channel';

@Injectable()
export class SMSNetBDProvider {
  private readonly logger = new Logger(SMSNetBDProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get('sms.smsNetBd.apiUrl') || '';
    this.apiKey = this.configService.get('sms.smsNetBd.apiKey') || '';
    this.senderId = this.configService.get('sms.smsNetBd.senderId') || '';
  }

  async send(dto: SMSDto): Promise<SMSResponse> {
    try {
      const phone = this.formatBangladeshNumber(dto.to);
      const isUnicode = this.containsBengali(dto.message);
      
      const payload = {
        api_key: this.apiKey,
        mobile: phone,
        sms: dto.message,
        sender_id: this.senderId,
        type: isUnicode ? 'unicode' : 'text',
      };

      this.logger.debug(`Sending SMS via SMS.NET.BD to ${phone}`);
      
      const response = await axios.post(`${this.apiUrl}/send`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.sms_id,
          provider: 'sms-net-bd',
          segments: this.calculateSegments(dto.message, isUnicode),
          cost: response.data.cost || 0.32, // BDT per SMS
          unicode: isUnicode,
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      this.logger.error(`SMS.NET.BD error: ${error.message}`);
      throw error;
    }
  }

  async checkBalance(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      return response.data.balance;
    } catch (error: any) {
      this.logger.error(`Failed to check balance: ${error.message}`);
      throw error;
    }
  }

  async getDeliveryStatus(messageId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.apiUrl}/status`, {
        params: {
          sms_id: messageId,
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      return response.data.delivery_status;
    } catch (error: any) {
      this.logger.error(`Failed to get delivery status: ${error.message}`);
      throw error;
    }
  }

  private formatBangladeshNumber(phone: string): string {
    const cleanNumber = phone.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('880')) {
      return cleanNumber;
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
      return `88${cleanNumber}`;
    } else if (phone.startsWith('+880')) {
      return phone.substring(1);
    }
    
    return `880${cleanNumber}`;
  }

  private containsBengali(text: string): boolean {
    const bengaliRegex = /[\u0980-\u09FF]/;
    return bengaliRegex.test(text);
  }

  private calculateSegments(message: string, isUnicode: boolean): number {
    const singleSMSLength = isUnicode ? 70 : 160;
    const multiSMSLength = isUnicode ? 67 : 153;
    
    if (message.length <= singleSMSLength) {
      return 1;
    }
    
    return Math.ceil(message.length / multiSMSLength);
  }
}