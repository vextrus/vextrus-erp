import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  channel: string;

  @Column('text')
  template: string;

  @Column('jsonb', { nullable: true })
  variables: any;
}
