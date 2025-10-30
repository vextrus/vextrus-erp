import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, registerEnumType, Directive } from '@nestjs/graphql';

export enum DocumentStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Register enum for GraphQL
registerEnumType(DocumentStatus, {
  name: 'DocumentStatus',
  description: 'The status of a document',
});

@ObjectType()
@Directive('@key(fields: "id")')
@Entity('documents')
export class Document {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  tenant_id: string;

  @Field()
  @Column()
  template_id: string;

  @Field()
  @Column()
  file_name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  file_path: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mime_type: string;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  file_size: number;

  @Field(() => DocumentStatus)
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Field({ nullable: true })
  @Column({ nullable: true })
  error_message: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  generated_at: Date;
}
