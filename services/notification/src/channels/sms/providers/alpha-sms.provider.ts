import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SMSDto } from '../../../dto/sms.dto';
import { SMSResponse } from '../sms.channel';

@Injectable()
export class AlphaSMSProvider {
  private readonly logger = new Logger(AlphaSMSProvider.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get('sms.alpha.apiUrl') || '';
    this.apiKey = this.configService.get('sms.alpha.apiKey') || '';
    this.senderId = this.configService.get('sms.alpha.senderId') || '';
  }

  async send(dto: SMSDto): Promise<SMSResponse> {
    try {
      const phone = this.formatBangladeshNumber(dto.to);
      const isUnicode = this.containsBengali(dto.message);
      
      const payload = {
        api_key: this.apiKey,
        to: phone,
        message: dto.message,
        sender_id: this.senderId,
        unicode: isUnicode ? 1 : 0,
      };

      this.logger.debug(`Sending SMS via Alpha SMS to ${phone}`);
      
      const response = await axios.post(`${this.apiUrl}/send`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.message_id,
          provider: 'alpha-sms',
          segments: this.calculateSegments(dto.message, isUnicode),
          cost: response.data.cost || 0.30, // BDT per SMS
          unicode: isUnicode,
        };
      } else {
        throw new Error(response.data.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      this.logger.error(`Alpha SMS error: ${error.message}`);
      throw error;
    }
  }

  async checkBalance(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/balance`, {
        params: {
          api_key: this.apiKey,
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
      const response = await axios.get(`${this.apiUrl}/status/${messageId}`, {
        params: {
          api_key: this.apiKey,
        },
      });
      
      return response.data.status;
    } catch (error: any) {
      this.logger.error(`Failed to get delivery status: ${error.message}`);
      throw error;
    }
  }

  private formatBangladeshNumber(phone: string): string {
    const cleanNumber = phone.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('880')) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
      return `+88${cleanNumber}`;
    } else if (phone.startsWith('+880')) {
      return phone;
    }
    
    return `+880${cleanNumber}`;
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