import { InputType, Field } from '@nestjs/graphql';
import { AccountType } from '../dto/enums.dto';

@InputType()
export class CreateAccountInput {
  @Field()
  accountCode!: string;

  @Field()
  accountName!: string;

  @Field(() => AccountType)
  accountType!: AccountType;

  @Field({ nullable: true })
  parentAccountId?: string;

  @Field()
  currency!: string;
}
