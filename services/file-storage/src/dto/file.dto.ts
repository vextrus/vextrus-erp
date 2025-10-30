import { InputType, Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { FileStatus, FileAccessLevel } from '../entities/file.entity';

@InputType()
export class CreateFileInput {
  @Field()
  tenantId: string;

  @Field()
  originalName: string;

  @Field()
  bucket: string;

  @Field()
  mimeType: string;

  @Field(() => Int)
  size: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  parentFolderId?: string;

  @Field(() => FileAccessLevel, { defaultValue: FileAccessLevel.PRIVATE })
  accessLevel?: FileAccessLevel;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field()
  createdBy: string;
}

@InputType()
export class UpdateFileInput {
  @Field({ nullable: true })
  originalName?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => FileAccessLevel, { nullable: true })
  accessLevel?: FileAccessLevel;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  updatedBy?: string;
}

@InputType()
export class SearchFileInput {
  @Field()
  tenantId: string;

  @Field({ nullable: true })
  query?: string;

  @Field(() => FileStatus, { nullable: true })
  status?: FileStatus;

  @Field(() => FileAccessLevel, { nullable: true })
  accessLevel?: FileAccessLevel;

  @Field({ nullable: true })
  mimeType?: string;

  @Field({ nullable: true })
  parentFolderId?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Int, { defaultValue: 10 })
  limit?: number;

  @Field(() => Int, { defaultValue: 0 })
  offset?: number;
}

@InputType()
export class ShareFileInput {
  @Field({ nullable: true })
  publicUrl?: string;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field({ nullable: true })
  password?: string;

  @Field(() => Int, { nullable: true })
  maxDownloads?: number;
}

@ObjectType()
export class FileConnection {
  @Field(() => [File])
  nodes: File[];

  @Field(() => Int)
  totalCount: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}

// Import File type for connection
import { File } from '../entities/file.entity';