import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlphaSMSProvider } from './providers/alpha-sms.provider';
import { SMSNetBDProvider } from './providers/sms-net-bd.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { SMSDto, SMSPriority } from '../../dto/sms.dto';

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  segments?: number;
  cost?: number;
  unicode?: boolean;
}

@Injectable()
export class SMSChannel {
  private readonly logger = new Logger(SMSChannel.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly alphaSMSProvider: AlphaSMSProvider,
    private readonly smsNetBDProvider: SMSNetBDProvider,
    private readonly twilioProvider: TwilioProvider,
  ) {}

  async send(dto: SMSDto): Promise<SMSResponse> {
    this.logger.log(`Sending SMS to ${dto.to}`);

    // Determine if it's a Bangladesh number
    const isBangladeshNumber = this.isBangladeshNumber(dto.to);

    if (isBangladeshNumber) {
      // Try Alpha SMS first for Bangladesh numbers
      try {
        return await this.alphaSMSProvider.send(dto);
      } catch (error: any) {
        this.logger.warn(`Alpha SMS failed: ${error.message}, trying SMS.NET.BD`);
        
        // Fallback to SMS.NET.BD
        try {
          return await this.smsNetBDProvider.send(dto);
        } catch (fallbackError: any) {
          this.logger.error(`SMS.NET.BD also failed: ${fallbackError.message}`);
          throw fallbackError;
        }
      }
    } else {
      // Use Twilio for international numbers
      return await this.twilioProvider.send(dto);
    }
  }

  async sendBulk(recipients: string[], message: string): Promise<SMSResponse[]> {
    const results: SMSResponse[] = [];
    
    // Group by country for optimal provider usage
    const bangladeshNumbers = recipients.filter(r => this.isBangladeshNumber(r));
    const internationalNumbers = recipients.filter(r => !this.isBangladeshNumber(r));
    
    // Send to Bangladesh numbers
    for (const to of bangladeshNumbers) {
      try {
        const result = await this.send({ to, message });
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          provider: 'unknown',
        });
      }
    }
    
    // Send to international numbers
    for (const to of internationalNumbers) {
      try {
        const result = await this.send({ to, message });
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          provider: 'unknown',
        });
      }
    }
    
    return results;
  }

  async sendOTP(to: string, otp: string, expiryMinutes: number = 5): Promise<SMSResponse> {
    const message = `Your Vextrus verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes. Do not share this code with anyone.`;
    
    return this.send({
      to,
      message,
      priority: SMSPriority.HIGH,
    });
  }

  private isBangladeshNumber(phone: string): boolean {
    // Bangladesh numbers start with +880 or 880 or 0 (local)
    const cleanNumber = phone.replace(/\D/g, '');
    return (
      cleanNumber.startsWith('880') ||
      cleanNumber.startsWith('0') && cleanNumber.length === 11 ||
      phone.startsWith('+880')
    );
  }

  formatBangladeshNumber(phone: string): string {
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

  validatePhoneNumber(phone: string): boolean {
    const cleanNumber = phone.replace(/\D/g, '');
    
    if (this.isBangladeshNumber(phone)) {
      // Bangladesh mobile numbers are 11 digits (including 0) or 13 with country code
      return cleanNumber.length === 11 || cleanNumber.length === 13;
    }
    
    // Basic international validation
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  calculateSMSSegments(message: string): number {
    const isUnicode = this.containsBengali(message);
    const singleSMSLength = isUnicode ? 70 : 160;
    const multiSMSLength = isUnicode ? 67 : 153;
    
    if (message.length <= singleSMSLength) {
      return 1;
    }
    
    return Math.ceil(message.length / multiSMSLength);
  }

  private containsBengali(text: string): boolean {
    // Bengali Unicode range: U+0980 to U+09FF
    const bengaliRegex = /[\u0980-\u09FF]/;
    return bengaliRegex.test(text);
  }
}