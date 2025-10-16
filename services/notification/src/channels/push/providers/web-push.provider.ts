import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushDto } from '../../../dto/push.dto';
import { PushResponse } from '../push.channel';

@Injectable()
export class WebPushProvider {
  private readonly logger = new Logger(WebPushProvider.name);

  constructor(private readonly configService: ConfigService) {
    const vapidPublicKey = this.configService.get('webPush.vapidPublicKey');
    const vapidPrivateKey = this.configService.get('webPush.vapidPrivateKey');
    const subject = this.configService.get('webPush.subject');

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
    }
  }

  async send(dto: PushDto): Promise<PushResponse> {
    try {
      const payload = JSON.stringify({
        title: dto.title,
        body: dto.body,
        icon: dto.webpush?.icon,
        badge: dto.webpush?.badge,
        image: dto.imageUrl,
        vibrate: dto.webpush?.vibrate,
        data: dto.data,
        actions: dto.webpush?.actions,
      });

      const options = {
        TTL: dto.ttl || 60 * 60 * 24, // 24 hours default
        urgency: dto.urgency || 'normal',
      };

      this.logger.debug(`Sending Web Push notification to ${dto.tokens.length} devices`);
      
      const promises = dto.tokens.map(subscription => 
        webpush.sendNotification(JSON.parse(subscription), payload, options)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      return {
        success: failureCount === 0,
        provider: 'web-push',
        successCount,
        failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Web Push error: ${error.message}`);
      throw error;
    }
  }
}