# Workflow Service CLAUDE.md

## Purpose
Provides workflow orchestration and task management capabilities with GraphQL federation support for business process automation across the ERP system.

## Narrative Summary
The Workflow Service implements a comprehensive business process management system using NestJS with multi-tenant architecture. It manages workflow definitions, executions, and task assignments with state tracking and event-driven processing. The service features dual interfaces with REST controllers and GraphQL resolvers supporting federation patterns. Workflows support variable passing, conditional logic, parallel execution, and error handling with retry capabilities. Task management includes assignment, status tracking, and deadline monitoring with notification integration.

## Key Files
- `src/app.module.ts:26-30` - Application module with GraphQL federation configuration and database setup
- `src/workflow.module.ts` - Workflow domain module with services and GraphQL resolvers
- `src/entities/workflow.entity.ts` - Workflow definition entity with state management and federation directives
- `src/entities/task.entity.ts` - Task entity with assignment tracking and federation support
- `src/graphql/workflow.resolver.ts:8-103` - GraphQL resolver for workflow CRUD operations and execution control
- `src/graphql/task.resolver.ts` - GraphQL resolver for task management and assignment
- `src/graphql/dto/workflow.input.ts` - Workflow GraphQL input DTOs (CreateWorkflowInput, UpdateWorkflowInput, WorkflowFilterInput)
- `src/graphql/dto/workflow.response.ts:3-45` - WorkflowResponse DTO with federation key and PaginatedWorkflowResponse
- `src/graphql/dto/task.input.ts` - Task GraphQL input DTOs for creation, updates, and filtering
- `src/graphql/dto/task.response.ts:3-35` - TaskResponse DTO with federation key and pagination support
- `src/services/workflow.service.ts` - Workflow business logic with state management and execution
- `src/services/task.service.ts` - Task management, assignment logic, and status tracking
- `src/controllers/workflow.controller.ts` - REST endpoints for workflow operations
- `src/controllers/task.controller.ts` - REST endpoints for task management
- `src/auth/jwt-auth.guard.ts` - JWT authentication guard for GraphQL endpoints
- `src/auth/tenant-context.decorator.ts` - Multi-tenant context decorator for resolvers

## API Endpoints

### REST Endpoints
- `GET /api/workflows` - List workflows with pagination and filtering
- `POST /api/workflows` - Create new workflow definition
- `GET /api/workflows/:id` - Get workflow by ID
- `PUT /api/workflows/:id` - Update workflow definition
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/start` - Start workflow execution
- `POST /api/workflows/:id/cancel` - Cancel running workflow
- `POST /api/workflows/:id/retry` - Retry failed workflow
- `GET /api/workflows/:id/history` - Get workflow execution history
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign task to user
- `POST /api/tasks/:id/complete` - Mark task as completed
- `GET /api/health` - Service health check

### GraphQL Operations

#### Workflow Operations
- `Query.workflows(filter: WorkflowFilterInput, page: Number, limit: Number): PaginatedWorkflowResponse` - List workflows with filtering and pagination
- `Query.workflow(id: ID): WorkflowResponse` - Get workflow definition and current state by ID
- `Query.workflowsByStatus(status: String): [WorkflowResponse]` - Find workflows by execution status (PENDING, RUNNING, COMPLETED, FAILED)
- `Query.workflowHistory(id: ID): [WorkflowResponse]` - Get complete execution history for a workflow
- `Mutation.createWorkflow(input: CreateWorkflowInput): WorkflowResponse` - Create workflow definition with steps and variables
- `Mutation.updateWorkflow(id: ID, input: UpdateWorkflowInput): WorkflowResponse` - Update workflow definition
- `Mutation.startWorkflow(id: ID, variables: String): WorkflowResponse` - Start workflow execution with JSON variables
- `Mutation.cancelWorkflow(id: ID, reason: String): WorkflowResponse` - Cancel running workflow with reason
- `Mutation.retryWorkflow(id: ID): WorkflowResponse` - Retry failed workflow from last checkpoint
- `Mutation.deleteWorkflow(id: ID): Boolean` - Soft delete workflow definition

#### Task Operations
- `Query.tasks(filter: TaskFilterInput, page: Number, limit: Number): PaginatedTaskResponse` - List tasks with filtering and pagination
- `Query.task(id: ID): TaskResponse` - Get task details with assignment and status
- `Query.tasksByAssignee(userId: ID): [TaskResponse]` - Find tasks assigned to specific user
- `Query.tasksByStatus(status: String): [TaskResponse]` - Find tasks by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `Query.tasksByWorkflow(workflowId: ID): [TaskResponse]` - Find all tasks for a workflow
- `Mutation.createTask(input: CreateTaskInput): TaskResponse` - Create standalone or workflow task
- `Mutation.updateTask(id: ID, input: UpdateTaskInput): TaskResponse` - Update task details
- `Mutation.assignTask(id: ID, userId: ID): TaskResponse` - Assign task to user
- `Mutation.completeTask(id: ID, result: String): TaskResponse` - Complete task with result data
- `Mutation.deleteTask(id: ID): Boolean` - Soft delete task

#### Federation Support
- `WorkflowResponse.__resolveReference(reference: {__typename: String, id: String})` - Workflow entity resolution
- `TaskResponse.__resolveReference(reference: {__typename: String, id: String})` - Task entity resolution
- `@Directive('@key(fields: "id")')` on WorkflowResponse and TaskResponse for federation

## Integration Points
### Consumes
- PostgreSQL: Workflow and task persistence with state tracking
- JWT Authentication: Service-to-service security and user context
- Tenant Context: Multi-tenant workflow isolation
- Notification Service: Task assignments and deadline alerts
- User Service: User lookup for task assignments
- Event Bus: Workflow state change notifications

### Provides
- Workflow Orchestration: Business process automation and execution with state management
- Task Management: Assignment, tracking, and completion workflows with user context
- GraphQL Federation Schema: WorkflowResponse and TaskResponse entities with federation keys
- Entity Resolution: Cross-service workflow and task lookups via federation
- Process Events: WorkflowStarted, WorkflowCompleted, TaskAssigned, TaskCompleted events via Kafka
- State Tracking: Real-time workflow and task status monitoring with history
- Variable Management: Dynamic JSON data passing between workflow steps
- Execution Control: Workflow start, cancel, retry operations with reason tracking
- Assignment Logic: User-based task assignment with tenant isolation

## Configuration
Required environment variables:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` - PostgreSQL connection
- `JWT_SECRET` - JWT token validation
- `KAFKA_BROKERS`, `KAFKA_CLIENT_ID` - Event publishing configuration
- `PORT` - Service port (default: 3004)
- `CORS_ORIGIN` - CORS configuration

Optional configuration:
- `WORKFLOW_TIMEOUT` - Default workflow timeout in seconds (default: 3600)
- `TASK_DEADLINE_BUFFER` - Task deadline buffer in hours (default: 24)
- `MAX_RETRY_ATTEMPTS` - Maximum workflow retry attempts (default: 3)
- `NOTIFICATION_SERVICE_URL` - Notification service endpoint
- `USER_SERVICE_URL` - User service endpoint for lookups

## Key Patterns
- State machine pattern for workflow execution tracking
- Event-driven architecture with Kafka for process notifications
- Multi-tenant isolation with tenant-scoped queries
- GraphQL federation with entity resolution for cross-service queries
- Task assignment patterns with user context validation
- Variable interpolation for dynamic workflow execution
- Retry mechanisms with exponential backoff for failed processes

GraphQL federation patterns:
- Entity federation with @Directive('@key(fields: "id")') on WorkflowResponse and TaskResponse
- Tenant-aware resolvers using @CurrentTenant() decorator for data isolation
- Authentication guard integration with @UseGuards(JwtAuthGuard) on all endpoints
- JSON variable passing for workflow context (see workflow.resolver.ts:64-67)
- Status-based filtering for workflow and task queries
- Reference resolution for cross-service workflow and task lookups
- Consistent error handling and validation across GraphQL operations

Workflow orchestration patterns:
- Sequential step execution with conditional branching
- Parallel task execution with synchronization points
- Error handling with rollback and compensation actions
- Timeout management with configurable deadlines
- Variable passing between workflow steps (see workflow.resolver.ts:64-67)
- History tracking for audit and debugging purposes

## Related Documentation
- ../../shared/kernel/CLAUDE.md - Domain primitives and workflow abstractions
- ../../shared/contracts/CLAUDE.md - Workflow and task interfaces
- ../notification/CLAUDE.md - Task notification integration
- ../auth/CLAUDE.md - User authentication and authorization
- ../../docs/adr/ - Architecture decisions for workflow patterns