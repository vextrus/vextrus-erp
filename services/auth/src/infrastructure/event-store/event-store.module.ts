import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventStore } from './event-store';
import { EventStoreEntity } from './event-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EventStoreEntity])],
  providers: [EventStore],
  exports: [EventStore],
})
export class EventStoreModule {}