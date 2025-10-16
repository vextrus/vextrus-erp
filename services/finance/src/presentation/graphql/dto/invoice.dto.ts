import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';
import { MoneyDto } from './money.dto';
import { InvoiceStatus, VATCategory } from './enums.dto';

@ObjectType('LineItem')
export class LineItemDto {
  @Field(() => ID)
  id!: string;

  @Field()
  description!: string;

  @Field(() => Float)
  quantity!: number;

  @Field(() => MoneyDto)
  unitPrice!: MoneyDto;

  @Field(() => MoneyDto)
  amount!: MoneyDto;

  @Field(() => VATCategory)
  vatCategory!: VATCategory;

  @Field(() => Float)
  vatRate!: number;

  @Field(() => MoneyDto)
  vatAmount!: MoneyDto;

  @Field({ nullable: true })
  hsCode?: string;

  @Field(() => MoneyDto, { nullable: true })
  supplementaryDuty?: MoneyDto;

  @Field(() => MoneyDto, { nullable: true })
  advanceIncomeTax?: MoneyDto;
}

@ObjectType('Invoice')
@Directive('@key(fields: "id")')
export class InvoiceDto {
  @Field(() => ID)
  id!: string;

  @Field()
  invoiceNumber!: string;

  @Field()
  vendorId!: string;

  @Field()
  customerId!: string;

  @Field(() => [LineItemDto])
  lineItems!: LineItemDto[];

  @Field(() => MoneyDto)
  subtotal!: MoneyDto;

  @Field(() => MoneyDto)
  vatAmount!: MoneyDto;

  @Field(() => MoneyDto)
  supplementaryDuty!: MoneyDto;

  @Field(() => MoneyDto)
  advanceIncomeTax!: MoneyDto;

  @Field(() => MoneyDto)
  grandTotal!: MoneyDto;

  @Field(() => InvoiceStatus)
  status!: InvoiceStatus;

  @Field()
  invoiceDate!: Date;

  @Field()
  dueDate!: Date;

  @Field()
  fiscalYear!: string;

  @Field({ nullable: true })
  mushakNumber?: string;

  @Field({ nullable: true })
  challanNumber?: string;

  @Field({ nullable: true })
  vendorTIN?: string;

  @Field({ nullable: true })
  vendorBIN?: string;

  @Field({ nullable: true })
  customerTIN?: string;

  @Field({ nullable: true })
  customerBIN?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
