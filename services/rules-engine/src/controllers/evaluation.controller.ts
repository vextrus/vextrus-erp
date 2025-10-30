import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { EvaluationService, EvaluationRequest } from '../services/evaluation.service';

@ApiTags('Evaluations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Evaluate facts against rules' })
  @ApiResponse({ status: 200, description: 'Evaluation results' })
  async evaluate(
    @CurrentTenant() tenant: TenantContext,
    @Body() request: EvaluationRequest,
  ) {
    return this.evaluationService.evaluate(tenant.id, request);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch evaluate multiple fact sets' })
  @ApiResponse({ status: 200, description: 'Batch evaluation results' })
  async batchEvaluate(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: { requests: EvaluationRequest[] },
  ) {
    return this.evaluationService.batchEvaluate(tenant.id, data.requests);
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain how rules would be evaluated' })
  @ApiResponse({ status: 200, description: 'Evaluation explanation' })
  async explainEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @Body() request: EvaluationRequest,
  ) {
    return this.evaluationService.explainEvaluation(tenant.id, request);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare evaluation results across scenarios' })
  @ApiResponse({ status: 200, description: 'Comparison results' })
  async compareEvaluations(
    @CurrentTenant() tenant: TenantContext,
    @Body() data: {
      facts: any;
      scenarios: Array<{ name: string; overrides: any }>;
    },
  ) {
    return this.evaluationService.compareEvaluations(
      tenant.id,
      data.facts,
      data.scenarios,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get evaluation history' })
  @ApiResponse({ status: 200, description: 'Evaluation history' })
  async getEvaluationHistory(
    @CurrentTenant() tenant: TenantContext,
    @Query('limit') limit: number = 100,
  ) {
    return this.evaluationService.getEvaluationHistory(tenant.id, limit);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get evaluation statistics' })
  @ApiResponse({ status: 200, description: 'Evaluation statistics' })
  async getStatistics(
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.evaluationService.getStatistics(tenant.id);
  }

  @Get(':evaluationId')
  @ApiOperation({ summary: 'Get specific evaluation by ID' })
  @ApiResponse({ status: 200, description: 'Evaluation details' })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  async getEvaluation(
    @CurrentTenant() tenant: TenantContext,
    @Param('evaluationId') evaluationId: string,
  ) {
    const evaluation = await this.evaluationService.getEvaluation(tenant.id, evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }
    return evaluation;
  }
}