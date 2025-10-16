import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('event_store')
@Index(['aggregateId', 'eventVersion'])
@Index(['aggregateType', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class EventStoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  aggregateId!: string;

  @Column({ type: 'varchar', length: 100 })
  aggregateType!: string;

  @Column({ type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  eventData!: string;

  @Column({ type: 'int' })
  eventVersion!: number;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}