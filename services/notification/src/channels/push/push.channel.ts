import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseProvider } from './providers/firebase.provider';
import { WebPushProvider } from './providers/web-push.provider';
import { PushDto } from '../../dto/push.dto';

export interface PushResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  multicastId?: string;
  successCount?: number;
  failureCount?: number;
}

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly firebaseProvider: FirebaseProvider,
    private readonly webPushProvider: WebPushProvider,
  ) {}

  async send(dto: PushDto): Promise<PushResponse> {
    this.logger.log(`Sending push notification to ${dto.tokens?.length || 1} devices`);

    // Determine provider based on token format or configuration
    const firstToken = dto.tokens?.[0];
    if (dto.provider === 'web-push' || (firstToken && this.isWebPushToken(firstToken))) {
      return await this.webPushProvider.send(dto);
    }

    // Default to Firebase
    return await this.firebaseProvider.send(dto);
  }

  async sendToTopic(topic: string, dto: Omit<PushDto, 'tokens'>): Promise<PushResponse> {
    return await this.firebaseProvider.sendToTopic(topic, dto);
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseProvider.subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    await this.firebaseProvider.unsubscribeFromTopic(tokens, topic);
  }

  private isWebPushToken(token: string): boolean {
    // Web Push tokens are typically longer and contain specific structure
    return token?.length > 200 && token.includes('.');
  }
}