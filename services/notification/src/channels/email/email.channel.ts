import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridProvider } from './providers/sendgrid.provider';
import { SMTPProvider } from './providers/smtp.provider';
import { EmailDto } from '../../dto/email.dto';
import { getErrorMessage } from '../../types/error.types';

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sendGridProvider: SendGridProvider,
    private readonly smtpProvider: SMTPProvider,
  ) {}

  async send(dto: EmailDto): Promise<EmailResponse> {
    this.logger.log(`Sending email to ${dto.to} via ${dto.subject}`);

    // Try SendGrid first if configured
    if (this.configService.get('sendgrid.apiKey')) {
      try {
        return await this.sendGridProvider.send(dto);
      } catch (error: any) {
        this.logger.warn(`SendGrid failed: ${getErrorMessage(error)}, falling back to SMTP`);
      }
    }

    // Fallback to SMTP
    try {
      return await this.smtpProvider.send(dto);
    } catch (error: any) {
      this.logger.error(`SMTP failed: ${getErrorMessage(error)}`);
      return {
        success: false,
        error: getErrorMessage(error),
        provider: 'smtp',
      };
    }
  }

  async sendBulk(recipients: string[], dto: Omit<EmailDto, 'to'>): Promise<EmailResponse[]> {
    const results: EmailResponse[] = [];
    
    // Batch process for better performance
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(to => 
        this.send({ ...dto, to })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map((result, index) => 
        result.status === 'fulfilled' 
          ? result.value 
          : {
              success: false,
              error: (result as PromiseRejectedResult).reason,
              provider: 'unknown',
            }
      ));
    }
    
    return results;
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}