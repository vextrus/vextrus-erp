import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PushDto } from '../../../dto/push.dto';
import { PushResponse } from '../push.channel';

@Injectable()
export class FirebaseProvider {
  private readonly logger = new Logger(FirebaseProvider.name);
  private app: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.get('firebase.projectId');
    const privateKey = this.configService.get('firebase.privateKey');
    const clientEmail = this.configService.get('firebase.clientEmail');

    if (projectId && privateKey && clientEmail) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    }
  }

  async send(dto: PushDto): Promise<PushResponse> {
    if (!this.app) {
      throw new Error('Firebase not configured');
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: dto.tokens,
        notification: {
          title: dto.title,
          body: dto.body,
          imageUrl: dto.imageUrl,
        },
        data: dto.data,
        android: dto.android && {
          priority: dto.android.priority || 'high',
          notification: {
            sound: dto.android.sound || 'default',
            channelId: dto.android.channelId,
            color: dto.android.color,
            icon: dto.android.icon,
          },
        },
        apns: dto.apns && {
          payload: {
            aps: {
              alert: {
                title: dto.title,
                body: dto.body,
              },
              sound: dto.apns.sound || 'default',
              badge: dto.apns.badge,
              category: dto.apns.category,
            },
          },
        },
        webpush: dto.webpush && {
          notification: {
            title: dto.title,
            body: dto.body,
            icon: dto.webpush.icon,
            badge: dto.webpush.badge,
            image: dto.imageUrl,
            vibrate: dto.webpush.vibrate,
            data: dto.data,
            actions: dto.webpush.actions,
          },
        },
      };

      this.logger.debug(`Sending FCM notification to ${dto.tokens.length} devices`);
      
      const response = await this.app.messaging().sendMulticast(message);
      
      return {
        success: response.failureCount === 0,
        provider: 'firebase',
        multicastId: response.responses[0]?.messageId,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      this.logger.error(`Firebase error: ${error.message}`);
      throw error;
    }
  }

  async sendToTopic(topic: string, dto: Omit<PushDto, 'tokens'>): Promise<PushResponse> {
    if (!this.app) {
      throw new Error('Firebase not configured');
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: dto.title,
          body: dto.body,
          imageUrl: dto.imageUrl,
        },
        data: dto.data,
      };

      const response = await this.app.messaging().send(message);
      
      return {
        success: true,
        messageId: response,
        provider: 'firebase',
      };
    } catch (error: any) {
      this.logger.error(`Firebase topic send error: ${error.message}`);
      throw error;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.app) {
      throw new Error('Firebase not configured');
    }

    try {
      await this.app.messaging().subscribeToTopic(tokens, topic);
      this.logger.debug(`Subscribed ${tokens.length} devices to topic: ${topic}`);
    } catch (error: any) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.app) {
      throw new Error('Firebase not configured');
    }

    try {
      await this.app.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.debug(`Unsubscribed ${tokens.length} devices from topic: ${topic}`);
    } catch (error: any) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`);
      throw error;
    }
  }
}