import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStoreService } from './event-store.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}