import { ObjectType, Field, ID, Directive } from '@nestjs/graphql';
import { MoneyDto } from './money.dto';
import { AccountType } from './enums.dto';

@ObjectType('ChartOfAccount')
@Directive('@key(fields: "id")')
export class ChartOfAccountDto {
  @Field(() => ID)
  id!: string;

  @Field()
  accountCode!: string;

  @Field()
  accountName!: string;

  @Field(() => AccountType)
  accountType!: AccountType;

  @Field({ nullable: true })
  parentAccountId?: string;

  @Field(() => ChartOfAccountDto, { nullable: true })
  parentAccount?: ChartOfAccountDto;

  @Field(() => [ChartOfAccountDto], { nullable: true })
  children?: ChartOfAccountDto[];

  @Field(() => MoneyDto)
  balance!: MoneyDto;

  @Field()
  currency!: string;

  @Field()
  isActive!: boolean;

  @Field()
  tenantId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
