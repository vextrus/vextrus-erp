import { ObjectType, Field, Float, registerEnumType } from '@nestjs/graphql';
import { Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@shareable')
export class MoneyDto {
  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field()
  formattedAmount!: string;
}

export enum Currency {
  BDT = 'BDT',
  USD = 'USD',
  EUR = 'EUR',
}

registerEnumType(Currency, {
  name: 'Currency',
  description: 'Supported currencies',
});
