import { IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WithholdingTaxType {
  SALARY = 'salary',
  DIVIDEND = 'dividend',
  INTEREST = 'interest',
  RENT = 'rent',
}

export class CalculateWithholdingTaxDto {
  @ApiProperty({ 
    description: 'Type of withholding tax',
    enum: WithholdingTaxType,
    example: WithholdingTaxType.SALARY 
  })
  @IsEnum(WithholdingTaxType)
  type: WithholdingTaxType;

  @ApiProperty({ 
    description: 'Amount in BDT',
    example: 500000 
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Is the recipient a Bangladesh resident?',
    default: true 
  })
  @IsBoolean()
  isResident: boolean = true;
}