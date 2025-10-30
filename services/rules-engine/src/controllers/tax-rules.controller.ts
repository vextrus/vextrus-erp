import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { TaxRulesService } from '../services/tax-rules.service';
import { CalculateVATDto } from '../dto/calculate-vat.dto';
import { CalculateAITDto } from '../dto/calculate-ait.dto';
import { CalculateWithholdingTaxDto } from '../dto/calculate-withholding-tax.dto';

@ApiTags('Bangladesh Tax Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tax-rules')
export class TaxRulesController {
  constructor(private readonly taxRulesService: TaxRulesService) {}

  @Post('vat/calculate')
  @ApiOperation({ summary: 'Calculate VAT based on Bangladesh rules' })
  @ApiResponse({ status: 200, description: 'VAT calculation result' })
  async calculateVAT(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) dto: CalculateVATDto,
  ) {
    return this.taxRulesService.calculateVAT(dto);
  }

  @Post('ait/calculate')
  @ApiOperation({ summary: 'Calculate AIT (Advance Income Tax)' })
  @ApiResponse({ status: 200, description: 'AIT calculation result' })
  async calculateAIT(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) dto: CalculateAITDto,
  ) {
    return this.taxRulesService.calculateAIT(dto);
  }

  @Post('withholding-tax/calculate')
  @ApiOperation({ summary: 'Calculate withholding tax' })
  @ApiResponse({ status: 200, description: 'Withholding tax calculation result' })
  async calculateWithholdingTax(
    @CurrentTenant() tenant: TenantContext,
    @Body(ValidationPipe) dto: CalculateWithholdingTaxDto,
  ) {
    return this.taxRulesService.calculateWithholdingTax(
      dto.type,
      dto.amount,
      dto.isResident,
    );
  }

  @Get('validate-tin/:tin')
  @ApiOperation({ summary: 'Validate Bangladesh TIN format' })
  @ApiResponse({ status: 200, description: 'TIN validation result' })
  async validateTIN(@Param('tin') tin: string) {
    return this.taxRulesService.validateTIN(tin);
  }

  @Get('validate-bin/:bin')
  @ApiOperation({ summary: 'Validate Bangladesh BIN format' })
  @ApiResponse({ status: 200, description: 'BIN validation result' })
  async validateBIN(@Param('bin') bin: string) {
    return this.taxRulesService.validateBIN(bin);
  }

  @Get('vat-rates')
  @ApiOperation({ summary: 'Get standard VAT rates for different categories' })
  @ApiResponse({ status: 200, description: 'VAT rates by category' })
  async getVATRates() {
    return {
      standard: 0.15,
      reduced: {
        education: 0.05,
        constructionMaterialsBulk: 0.075,
      },
      exempt: [
        'medicine',
        'basic-food',
        'agriculture',
        'exports',
        'government',
      ],
    };
  }

  @Get('ait-rates')
  @ApiOperation({ summary: 'Get standard AIT rates for different services' })
  @ApiResponse({ status: 200, description: 'AIT rates by service type' })
  async getAITRates() {
    return {
      construction: 0.07,
      supply: 0.03,
      professional: 0.10,
      transport: 0.03,
      withCertificate: 0.02,
    };
  }

  @Get('fiscal-year')
  @ApiOperation({ summary: 'Get current Bangladesh fiscal year information' })
  @ApiResponse({ status: 200, description: 'Fiscal year information' })
  async getFiscalYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Bangladesh fiscal year: July 1 to June 30
    let fiscalYear: string;
    if (currentMonth >= 7) {
      fiscalYear = `${currentYear}-${currentYear + 1}`;
    } else {
      fiscalYear = `${currentYear - 1}-${currentYear}`;
    }

    return {
      current: fiscalYear,
      startDate: currentMonth >= 7 ? `${currentYear}-07-01` : `${currentYear - 1}-07-01`,
      endDate: currentMonth >= 7 ? `${currentYear + 1}-06-30` : `${currentYear}-06-30`,
      quarter: Math.ceil(((currentMonth - 7 + 12) % 12 + 1) / 3),
    };
  }

  @Post('bulk-vat-calculate')
  @ApiOperation({ summary: 'Calculate VAT for multiple items' })
  @ApiResponse({ status: 200, description: 'Bulk VAT calculation results' })
  async bulkCalculateVAT(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: { items: CalculateVATDto[] },
  ) {
    const results = await Promise.all(
      dto.items.map(item => this.taxRulesService.calculateVAT(item))
    );
    
    const totalOriginal = results.reduce((sum, r) => sum + r.originalAmount, 0);
    const totalVAT = results.reduce((sum, r) => sum + r.vatAmount, 0);
    const totalWithVAT = results.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      items: results,
      summary: {
        totalOriginalAmount: totalOriginal,
        totalVATAmount: totalVAT,
        totalAmountWithVAT: totalWithVAT,
      },
    };
  }
}