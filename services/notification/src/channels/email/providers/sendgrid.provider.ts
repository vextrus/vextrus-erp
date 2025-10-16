import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { EmailDto } from '../../../dto/email.dto';
import { EmailResponse } from '../email.channel';

@Injectable()
export class SendGridProvider {
  private readonly logger = new Logger(SendGridProvider.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('sendgrid.apiKey');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async send(dto: EmailDto): Promise<EmailResponse> {
    try {
      const fromEmail = dto.from || this.configService.get('sendgrid.from') || 'noreply@vextrus.com';
      const msg: any = {
        to: dto.to,
        from: fromEmail,
        subject: dto.subject,
      };

      // Add content based on what's provided
      if (dto.templateId) {
        msg.templateId = dto.templateId;
        if (dto.templateData) {
          msg.dynamicTemplateData = dto.templateData;
        }
      } else if (dto.html) {
        msg.html = dto.html;
      } else if (dto.text) {
        msg.text = dto.text;
      } else {
        msg.text = ''; // Default empty text
      }

      // Add attachments if provided
      if (dto.attachments?.length) {
        msg.attachments = dto.attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type,
          disposition: attachment.disposition || 'attachment',
        }));
      }

      this.logger.debug(`Sending email via SendGrid to ${dto.to}`);
      
      const [response] = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
        provider: 'sendgrid',
      };
    } catch (error: any) {
      this.logger.error(`SendGrid error: ${error.message}`);
      throw error;
    }
  }

  async sendBulk(recipients: string[], dto: Omit<EmailDto, 'to'>): Promise<EmailResponse[]> {
    try {
      const fromEmail = dto.from || this.configService.get('sendgrid.from') || 'noreply@vextrus.com';
      const messages = recipients.map(to => {
        const msg: any = {
          to,
          from: fromEmail,
          subject: dto.subject,
        };

        // Add content based on what's provided
        if (dto.templateId) {
          msg.templateId = dto.templateId;
          if (dto.templateData) {
            msg.dynamicTemplateData = dto.templateData;
          }
        } else if (dto.html) {
          msg.html = dto.html;
        } else if (dto.text) {
          msg.text = dto.text;
        } else {
          msg.text = ''; // Default empty text
        }

        return msg;
      });

      const responses = await sgMail.send(messages);
      
      return responses.map((response, index) => ({
        success: true,
        messageId: response[0].headers['x-message-id'],
        provider: 'sendgrid',
      }));
    } catch (error: any) {
      this.logger.error(`SendGrid bulk send error: ${error.message}`);
      throw error;
    }
  }
}