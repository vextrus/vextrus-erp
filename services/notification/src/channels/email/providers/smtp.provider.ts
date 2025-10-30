import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailDto } from '../../../dto/email.dto';
import { EmailResponse } from '../email.channel';

@Injectable()
export class SMTPProvider {
  private readonly logger = new Logger(SMTPProvider.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async send(dto: EmailDto): Promise<EmailResponse> {
    try {
      this.logger.debug(`Sending email via SMTP to ${dto.to}`);
      
      const result = await this.mailerService.sendMail({
        to: dto.to,
        from: dto.from || this.configService.get('smtp.from'),
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        attachments: dto.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.type,
        })),
        template: dto.template,
        context: dto.templateData,
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
      };
    } catch (error: any) {
      this.logger.error(`SMTP error: ${error.message}`);
      throw error;
    }
  }
}