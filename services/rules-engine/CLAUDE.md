# Rules Engine Service CLAUDE.md

## Purpose
Provides business rules management and evaluation engine with GraphQL federation support for dynamic rule-based decision making across the ERP system.

## Narrative Summary
The Rules Engine Service implements a comprehensive business rules management system using NestJS with expression evaluation capabilities. It manages rule definitions, categories, and real-time evaluation with multi-tenant isolation. The service features dual interfaces with REST controllers and GraphQL resolvers supporting federation patterns. Rules support complex expressions, conditional logic, entity-specific triggers, and batch evaluation for rule sets. The engine provides validation, activation control, and audit trails for compliance and debugging.

## Key Files
- `src/app.module.ts` - Application module with GraphQL federation and rules engine configuration
- `src/rules.module.ts` - Rules domain module with services and GraphQL resolvers
- `src/entities/rule.entity.ts` - Rule definition entity with expression storage and federation directives
- `src/graphql/rule.resolver.ts:9-130` - GraphQL resolver for rule CRUD operations and real-time evaluation
- `src/graphql/dto/rule.input.ts` - Rule GraphQL input DTOs (CreateRuleInput, UpdateRuleInput, RuleFilterInput, EvaluateRuleInput)
- `src/graphql/dto/rule.response.ts` - Rule GraphQL response DTOs (RuleResponse, PaginatedRuleResponse, RuleEvaluationResponse)
- `src/services/rules.service.ts` - Rule management with CRUD operations and category organization
- `src/services/engine.service.ts:12-130` - Rule evaluation engine with expression parsing and context resolution
- `src/controllers/rules.controller.ts` - REST endpoints for rule management
- `src/controllers/engine.controller.ts` - REST endpoints for rule evaluation
- `src/validators/expression.validator.ts` - Expression syntax validation and security checks
- `src/evaluators/context.evaluator.ts` - Context variable resolution with type safety
- `src/auth/jwt-auth.guard.ts` - JWT authentication guard for GraphQL endpoints
- `src/auth/tenant-context.decorator.ts` - Multi-tenant context decorator for rule isolation

## API Endpoints

### REST Endpoints
- `GET /api/rules` - List rules with pagination and filtering
- `POST /api/rules` - Create new rule definition
- `GET /api/rules/:id` - Get rule by ID
- `PUT /api/rules/:id` - Update rule definition
- `DELETE /api/rules/:id` - Delete rule
- `POST /api/rules/:id/activate` - Activate rule
- `POST /api/rules/:id/deactivate` - Deactivate rule
- `GET /api/rules/category/:category` - List rules by category
- `GET /api/rules/entity/:entityType` - List rules by entity type
- `POST /api/engine/evaluate` - Evaluate single rule
- `POST /api/engine/evaluate-set` - Evaluate rule set
- `POST /api/engine/validate` - Validate expression syntax
- `GET /api/health` - Service health check

### GraphQL Operations

#### Rule Management
- `Query.rules(filter: RuleFilterInput, page: Number, limit: Number): PaginatedRuleResponse` - List rules with filtering and pagination
- `Query.rule(id: ID): RuleResponse` - Get rule definition and metadata by ID
- `Query.rulesByCategory(category: String): [RuleResponse]` - Find rules by business category
- `Query.rulesByEntity(entityType: String): [RuleResponse]` - Find rules applicable to specific entity type
- `Query.applicableRules(entityType: String, action: String): [RuleResponse]` - Get rules applicable for entity-action combination
- `Mutation.createRule(input: CreateRuleInput): RuleResponse` - Create rule definition with expression and metadata
- `Mutation.updateRule(id: ID, input: UpdateRuleInput): RuleResponse` - Update rule expression or configuration
- `Mutation.activateRule(id: ID): RuleResponse` - Activate rule for evaluation
- `Mutation.deactivateRule(id: ID): RuleResponse` - Deactivate rule temporarily
- `Mutation.deleteRule(id: ID): Boolean` - Soft delete rule definition

#### Rule Evaluation
- `Mutation.evaluateRule(input: EvaluateRuleInput): RuleEvaluationResponse` - Evaluate single rule with context
- `Mutation.evaluateRuleSet(category: String, context: String): RuleEvaluationResponse` - Evaluate all rules in category with JSON context
- `Query.validateRuleExpression(expression: String): Boolean` - Validate expression syntax and security

#### Federation Support
- `RuleResponse.__resolveReference(reference: {__typename: String, id: String})` - Rule entity resolution
- `@Directive('@key(fields: "id")')` on RuleResponse for federation key

## Integration Points
### Consumes
- PostgreSQL: Rule definitions and evaluation history persistence
- JWT Authentication: Service-to-service security and user context
- Tenant Context: Multi-tenant rule isolation
- Entity Services: Context data for rule evaluation
- Audit Service: Rule evaluation logging and compliance tracking

### Provides
- Rule Management: Definition, categorization, and lifecycle management with versioning
- Rule Evaluation: Real-time expression evaluation with context resolution and caching
- GraphQL Federation Schema: RuleResponse entity with federation key for cross-service integration
- Decision Engine: Boolean and value-based rule results with detailed evaluation metadata
- Expression Validation: Syntax checking, security validation, and complexity analysis
- Rule Events: RuleCreated, RuleEvaluated, RuleActivated, RuleDeactivated events via Kafka
- Entity Resolution: Cross-service rule lookups via federation
- Context Management: Dynamic variable injection for rule evaluation
- Performance Optimization: Rule result caching and batch evaluation capabilities

## Configuration
Required environment variables:
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` - PostgreSQL connection
- `JWT_SECRET` - JWT token validation
- `KAFKA_BROKERS`, `KAFKA_CLIENT_ID` - Event publishing configuration
- `PORT` - Service port (default: 3005)
- `CORS_ORIGIN` - CORS configuration

Optional configuration:
- `RULE_EVALUATION_TIMEOUT` - Maximum evaluation time in ms (default: 5000)
- `MAX_EXPRESSION_COMPLEXITY` - Maximum expression complexity score (default: 100)
- `ENABLE_RULE_CACHING` - Cache evaluation results (default: true)
- `CACHE_TTL` - Rule cache time-to-live in seconds (default: 300)
- `AUDIT_EVALUATIONS` - Log all evaluations (default: true)

## Key Patterns
- Expression evaluation with sandboxed execution environment
- Multi-tenant rule isolation with tenant-scoped queries
- Category-based rule organization for bulk operations
- Entity-specific rule targeting with action-based filtering
- Context variable resolution with type safety
- Rule activation/deactivation for deployment control
- Batch evaluation for performance optimization

GraphQL federation patterns:
- Entity federation with @Directive('@key(fields: "id")') on RuleResponse entity
- Tenant-aware resolvers using @CurrentTenant() decorator for rule isolation
- Authentication guard integration with @UseGuards(JwtAuthGuard) on all endpoints
- JSON context parsing for rule evaluation (see rule.resolver.ts:102)
- Category-based rule set evaluation with short-circuit logic
- Expression validation before rule creation and updates
- Reference resolution for cross-service rule lookups and dependencies

Rule engine patterns:
- Expression syntax validation before rule creation
- Context variable injection for dynamic evaluation (see rule.resolver.ts:102)
- Rule set evaluation with short-circuit logic
- Entity-action matching for applicable rule discovery
- Evaluation result caching for performance
- Audit trail for compliance and debugging

Bangladesh ERP rule examples:
- VAT calculation rules: `amount * 0.15` for 15% VAT rate
- TIN validation: `tin.length === 10 && /^\d{10}$/.test(tin)`
- Fiscal year rules: `month >= 7 ? year : year - 1` for July-June fiscal year
- Working day calculation excluding Friday/Saturday
- Currency conversion with Bangladesh Bank rates

## Related Documentation
- ../../shared/kernel/CLAUDE.md - Domain primitives and rule abstractions
- ../../shared/contracts/CLAUDE.md - Rule interfaces and evaluation contexts
- ../audit/CLAUDE.md - Rule evaluation audit integration
- ../master-data/CLAUDE.md - Entity data for rule context
- ../../docs/adr/ - Architecture decisions for rules engine patterns