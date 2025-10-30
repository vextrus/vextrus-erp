import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantContext, CurrentTenant } from '../auth';
import { TaskService } from '../services/task.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async listTasks(
    @CurrentTenant() tenant: TenantContext,
    @Query('assigned_to') assignedTo?: string,
    @Query('status') status?: string,
  ) {
    return this.taskService.findAll(tenant.id, { assignedTo, status });
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task details' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(
    @CurrentTenant() tenant: TenantContext,
    @Param('taskId') taskId: string,
  ) {
    return this.taskService.findOne(tenant.id, taskId);
  }

  @Put(':taskId/assign')
  @ApiOperation({ summary: 'Assign task to user' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  async assignTask(
    @CurrentTenant() tenant: TenantContext,
    @Param('taskId') taskId: string,
    @Body() data: { userId: string },
  ) {
    return this.taskService.assignTask(tenant.id, taskId, data.userId);
  }

  @Post(':taskId/complete')
  @ApiOperation({ summary: 'Complete task' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  async completeTask(
    @CurrentTenant() tenant: TenantContext,
    @Param('taskId') taskId: string,
    @Body() data: any,
  ) {
    return this.taskService.completeTask(tenant.id, taskId, data);
  }
}