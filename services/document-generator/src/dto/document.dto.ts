import { InputType, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { DocumentStatus } from '../entities/document.entity';

@InputType()
export class CreateDocumentInput {
  @Field()
  tenantId: string;

  @Field()
  templateId: string;

  @Field()
  fileName: string;

  @Field(() => String, { nullable: true })
  data?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;
}

@InputType()
export class GenerateDocumentInput {
  @Field()
  tenantId: string;

  @Field()
  templateId: string;

  @Field()
  fileName: string;

  @Field()
  format: string; // 'pdf', 'excel', 'word', 'csv'

  @Field(() => String)
  data: string; // JSON stringified data

  @Field(() => String, { nullable: true })
  options?: string; // JSON stringified options
}

@InputType()
export class SearchDocumentInput {
  @Field()
  tenantId: string;

  @Field({ nullable: true })
  query?: string;

  @Field(() => DocumentStatus, { nullable: true })
  status?: DocumentStatus;

  @Field({ nullable: true })
  templateId?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => Int, { defaultValue: 10 })
  limit?: number;

  @Field(() => Int, { defaultValue: 0 })
  offset?: number;
}

@ObjectType()
export class DocumentConnection {
  @Field(() => [Document])
  nodes: Document[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

@ObjectType()
export class GenerationProgress {
  @Field(() => ID)
  documentId: string;

  @Field()
  status: string;

  @Field(() => Int)
  progress: number;

  @Field({ nullable: true })
  message?: string;
}

// Import Document type for connection
import { Document } from '../entities/document.entity';