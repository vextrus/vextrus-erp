---
task: h-implement-business-architecture-foundation
branch: feature/business-architecture-foundation
status: in-progress
created: 2025-01-10
updated: 2025-01-10
modules: [master-data, workflow, rules-engine, api-gateway, services/*, shared/business-core]
---

# Implement Business Architecture Foundation

## Problem/Goal
Before developing business modules (Finance, CRM, HR, etc.), we need critical architectural components that will serve as the foundation for all business logic. Currently missing: Master Data Management (MDM) service, Workflow/BPM engine, Business Rules Engine, and API Composition Layer. Without these, business modules will face integration issues, data inconsistency, and complex inter-module communication problems.

## Success Criteria
- [ ] Master Data Management (MDM) service operational with customer, vendor, product, and chart of accounts repositories
- [ ] Workflow engine integrated (Temporal or Camunda) with sample approval workflow
- [ ] Business rules engine implemented with Bangladesh VAT/tax calculation rules
- [ ] GraphQL API composition layer with federation support
- [ ] Integration tests passing between all architectural components
- [ ] Performance benchmarks: MDM queries <50ms, rule evaluation <10ms, workflow task creation <100ms
- [ ] Developer documentation with examples for each component
- [ ] Migration framework established for business module data

## Context Manifest

### Current State
- **Infrastructure**: Complete (K8s, Docker, CI/CD)
- **Supporting Services**: All 8 operational (Auth, Notification, File Storage, Audit, Configuration, Import/Export, Document Generator)
- **Shared Libraries**: Event sourcing, sagas, distributed transactions ready
- **Database Strategy**: Multi-tenant with RLS defined
- **Missing**: MDM, Workflow Engine, Rules Engine, API Composition

### Industry Best Practices Research

#### SAP S/4HANA Approach
- Centralized master data with MDG (Master Data Governance)
- SAP Business Workflow for process orchestration
- BRFplus for business rules
- OData services for API composition

#### Microsoft Dynamics 365
- Common Data Service (Dataverse) for unified data
- Power Automate for workflows
- Business Rules framework
- GraphQL via Hot Chocolate

#### Oracle NetSuite
- SuiteScript for business logic
- SuiteFlow for workflow automation
- Centralized master records
- REST/SOAP API composition

## Technical Approach

### 1. Master Data Management (MDM) Service

**Location**: `services/master-data/`

**Core Entities**:
```typescript
// Customer Master
interface Customer {
  id: string;
  tenantId: string;
  code: string; // Unique customer code
  name: string;
  nameInBengali?: string;
  tin?: string; // 12-digit Bangladesh TIN
  nid?: string; // National ID
  phone: string; // +880 validated
  email: string;
  address: Address;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  metadata: Record<string, any>;
}

// Vendor Master
interface Vendor {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  tin: string; // Required for NBR
  bankAccount: BankAccount;
  categories: VendorCategory[];
  approved: boolean;
  blacklisted: boolean;
}

// Product/Service Master
interface Product {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: UnitOfMeasure;
  hsCode?: string; // For customs
  vatRate: number; // 0.15 for standard
}

// Chart of Accounts
interface Account {
  id: string;
  tenantId: string;
  code: string; // e.g., "1001"
  name: string;
  type: AccountType; // Asset, Liability, Equity, Revenue, Expense
  parent?: string;
  currency: Currency;
  isActive: boolean;
}
```

**Implementation Strategy**:
- Use TypeORM with PostgreSQL
- Implement caching with Redis (5-minute TTL)
- Event sourcing for audit trail
- REST + GraphQL endpoints
- Data validation with class-validator
- Import/Export via existing service

### 2. Workflow Engine Integration

**Options Analysis**:

| Feature | Temporal | Camunda 8 | Bull + Custom |
|---------|----------|-----------|---------------|
| Language | Go/Multi-language SDKs | Java/Multi-language | Node.js native |
| Learning Curve | Medium | High | Low |
| Bangladesh Context | No | No | Can customize |
| Cost | Open Source | Community/Enterprise | Open Source |
| Scalability | Excellent | Excellent | Good |
| Visual Designer | No | Yes (Modeler) | No |
| **Recommendation** | ✅ Best fit | Good alternative | Fallback option |

**Temporal Implementation**:
```typescript
// services/workflow/
import { Connection, WorkflowClient } from '@temporalio/client';
import { Worker } from '@temporalio/worker';

// Purchase Order Approval Workflow
export async function purchaseOrderApproval(po: PurchaseOrder) {
  // Step 1: Validate budget
  const budgetCheck = await validateBudget(po);
  if (!budgetCheck.approved) {
    return { status: 'rejected', reason: 'budget_exceeded' };
  }

  // Step 2: Manager approval (if > 100,000 BDT)
  if (po.amount > 100000) {
    const approval = await waitForApproval('manager', po);
    if (!approval.approved) {
      return { status: 'rejected', reason: 'manager_rejected' };
    }
  }

  // Step 3: Finance approval
  const financeApproval = await waitForApproval('finance', po);
  
  // Step 4: Create PO in system
  await createPurchaseOrder(po);
  
  // Step 5: Notify vendor
  await notifyVendor(po);
  
  return { status: 'approved', poNumber: po.number };
}
```

### 3. Business Rules Engine

**Technology**: json-rules-engine (8.1 trust score, 62 code examples)

**Bangladesh-Specific Rules**:
```typescript
// services/rules-engine/
import { Engine } from 'json-rules-engine';

// VAT Calculation Rules
const bangladeshVATEngine = new Engine();

// Standard 15% VAT rule
bangladeshVATEngine.addRule({
  conditions: {
    all: [
      {
        fact: 'productCategory',
        operator: 'notIn',
        value: ['medicine', 'agriculture', 'education']
      },
      {
        fact: 'customerType',
        operator: 'notEqual',
        value: 'government'
      }
    ]
  },
  event: {
    type: 'apply-vat',
    params: {
      rate: 0.15,
      description: 'Standard VAT rate'
    }
  }
});

// Zero VAT for essentials
bangladeshVATEngine.addRule({
  conditions: {
    any: [
      {
        fact: 'productCategory',
        operator: 'in',
        value: ['medicine', 'basic-food', 'agriculture']
      },
      {
        fact: 'customerType',
        operator: 'equal',
        value: 'government'
      }
    ]
  },
  event: {
    type: 'apply-vat',
    params: {
      rate: 0,
      description: 'VAT exempt'
    }
  }
});

// AIT (Advance Income Tax) rules
const aitEngine = new Engine();

aitEngine.addRule({
  conditions: {
    all: [
      {
        fact: 'serviceType',
        operator: 'equal',
        value: 'construction'
      },
      {
        fact: 'vendorType',
        operator: 'equal',
        value: 'contractor'
      }
    ]
  },
  event: {
    type: 'apply-ait',
    params: {
      rate: 0.07, // 7% for construction contractors
      description: 'Construction contractor AIT'
    }
  }
});
```

### 4. API Composition Layer (GraphQL)

**Technology**: Apollo Federation v2

**Implementation**:
```typescript
// services/api-gateway/
import { ApolloServer } from '@apollo/server';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';

// Federated GraphQL Schema
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'auth', url: 'http://auth-service:3001/graphql' },
      { name: 'master-data', url: 'http://master-data:3009/graphql' },
      { name: 'workflow', url: 'http://workflow:3010/graphql' },
      { name: 'finance', url: 'http://finance:3011/graphql' },
      { name: 'projects', url: 'http://projects:3012/graphql' }
    ]
  })
});

// Unified Schema Example
type Query {
  # From master-data service
  customer(id: ID!): Customer
  vendors(filter: VendorFilter): [Vendor!]!
  
  # From finance service
  invoice(id: ID!): Invoice
  
  # Composed query
  projectDashboard(projectId: ID!): ProjectDashboard!
}

type ProjectDashboard {
  project: Project! # From projects service
  budget: Budget! # From finance service
  team: [Employee!]! # From HR service
  materials: [Material!]! # From SCM service
  approvals: [WorkflowTask!]! # From workflow service
}
```

**DataLoader for N+1 Prevention**:
```typescript
import DataLoader from 'dataloader';

const customerLoader = new DataLoader(async (ids: string[]) => {
  const customers = await customerService.findByIds(ids);
  return ids.map(id => customers.find(c => c.id === id));
});
```

## Implementation Plan

### Week 1: Master Data Management
- **Day 1-2**: Create MDM service structure, entities, and database schema
- **Day 3-4**: Implement repositories, services, and REST endpoints
- **Day 5**: Add GraphQL schema and resolvers
- **Day 6-7**: Integration tests and caching layer

### Week 2: Workflow Engine & Rules
- **Day 8-9**: Set up Temporal server and create first workflow
- **Day 10-11**: Implement approval workflows and task management
- **Day 12-13**: Integrate json-rules-engine with Bangladesh rules
- **Day 14**: Connect rules engine to workflow decisions

### Week 3: API Composition & Integration
- **Day 15-16**: Set up Apollo Federation gateway
- **Day 17-18**: Create federated schemas for each service
- **Day 19-20**: Implement DataLoaders and query optimization
- **Day 21**: End-to-end integration testing

## Testing Strategy

### Unit Tests
```typescript
describe('MDM Service', () => {
  it('should validate Bangladesh TIN format', () => {
    expect(validateTIN('123456789012')).toBe(true);
    expect(validateTIN('12345')).toBe(false);
  });
});

describe('VAT Rules Engine', () => {
  it('should apply 15% VAT for construction materials', async () => {
    const result = await vatEngine.run({ 
      productCategory: 'construction-materials',
      customerType: 'private'
    });
    expect(result.events[0].params.rate).toBe(0.15);
  });
});
```

### Integration Tests
```typescript
describe('Purchase Order Workflow', () => {
  it('should complete full approval cycle', async () => {
    const po = createTestPO({ amount: 150000 });
    const workflowId = await workflowClient.start(purchaseOrderApproval, {
      args: [po],
      workflowId: `po-${po.id}`
    });
    
    // Simulate manager approval
    await workflowClient.signal(workflowId, 'approve', { role: 'manager' });
    
    // Simulate finance approval
    await workflowClient.signal(workflowId, 'approve', { role: 'finance' });
    
    const result = await workflowClient.result(workflowId);
    expect(result.status).toBe('approved');
  });
});
```

### Performance Tests
```typescript
describe('Performance Benchmarks', () => {
  it('MDM queries should complete < 50ms', async () => {
    const start = Date.now();
    await customerService.findById('test-id');
    expect(Date.now() - start).toBeLessThan(50);
  });
  
  it('Rule evaluation should complete < 10ms', async () => {
    const start = Date.now();
    await vatEngine.run(testFacts);
    expect(Date.now() - start).toBeLessThan(10);
  });
});
```

## Migration Strategy

### Database Migrations
```sql
-- V1__create_master_data_schema.sql
CREATE SCHEMA master_data;

CREATE TABLE master_data.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_bn VARCHAR(255),
  tin VARCHAR(12),
  nid VARCHAR(17),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant ON master_data.customers(tenant_id);
CREATE INDEX idx_customers_tin ON master_data.customers(tin);
```

### Seed Data
```typescript
// seeds/master-data.seed.ts
export const seedMasterData = async () => {
  // Chart of Accounts (Bangladesh context)
  await accountRepo.save([
    { code: '1000', name: 'Assets', type: 'Asset' },
    { code: '1100', name: 'Current Assets', type: 'Asset', parent: '1000' },
    { code: '1110', name: 'Cash', type: 'Asset', parent: '1100' },
    { code: '1120', name: 'Bank', type: 'Asset', parent: '1100' },
    { code: '2000', name: 'Liabilities', type: 'Liability' },
    { code: '3000', name: 'Equity', type: 'Equity' },
    { code: '4000', name: 'Revenue', type: 'Revenue' },
    { code: '5000', name: 'Expenses', type: 'Expense' }
  ]);
  
  // Product categories
  await categoryRepo.save([
    { name: 'Construction Materials', vatRate: 0.15 },
    { name: 'Heavy Equipment', vatRate: 0.15 },
    { name: 'Safety Equipment', vatRate: 0.15 },
    { name: 'Office Supplies', vatRate: 0.15 }
  ]);
};
```

## Documentation Requirements

### Developer Guide
- How to add new master data entities
- Creating workflow definitions
- Writing business rules
- Extending GraphQL schema

### API Documentation
- REST endpoints for MDM
- GraphQL schema documentation
- Workflow API reference
- Rules engine integration

## Risk Mitigation

### Technical Risks
1. **Workflow Engine Complexity**: Start with simple workflows, gradually add complexity
2. **GraphQL N+1 Queries**: Use DataLoader from day one
3. **Rule Engine Performance**: Cache rule evaluation results
4. **Data Consistency**: Use event sourcing for critical master data

### Business Risks
1. **Scope Creep**: Focus on MVP - basic CRUD for master data
2. **Integration Complexity**: Test each component in isolation first
3. **Performance Issues**: Set up monitoring from the start

## Dependencies
- PostgreSQL schemas must be created
- Redis must be configured for caching
- Kafka topics for event streaming
- Docker images for Temporal server

## Resources
- [Temporal Documentation](https://docs.temporal.io)
- [json-rules-engine](https://github.com/cachecontrol/json-rules-engine)
- [Apollo Federation](https://www.apollographql.com/docs/federation/)
- [TypeORM](https://typeorm.io)

## Success Metrics
- All integration tests passing
- Performance benchmarks met
- Zero breaking changes to existing services
- Developer productivity increased (measured by time to implement first business module)

### Discovered During Implementation
[Date: 2025-09-13 / Session marker]

During implementation, we discovered several critical architectural and technical realities that weren't documented in the original context. These discoveries significantly impact implementation complexity and timeline estimates.

**Major Architectural Misalignment**: The original plan assumed all services would have GraphQL endpoints for federation, but in reality, most services (workflow, rules-engine, api-gateway) are REST-based with only master-data service supporting GraphQL. This means the API composition layer strategy needs fundamental revision - either converting all services to support GraphQL schemas or switching to a REST-based composition approach with API aggregation.

**Service Build Complexity**: Services have substantial TypeScript compilation issues (22+ errors in master-data, 6 in workflow, 5 in rules-engine) requiring extensive type fixing, DTO alignment, and dependency resolution. The original 3-week timeline severely underestimated debugging effort.

**External Library API Mismatch**: The json-rules-engine library API differs from documentation expectations - methods like `getRules()` and properties like `almanac.factMap` don't exist, requiring alternative implementation approaches for rules engine functionality.

**Infrastructure Dependencies**: Workflow service requires external Temporal server deployment, adding infrastructure complexity not fully accounted for in original planning. Additionally, services use inconsistent database credentials and port configurations requiring systematic configuration management.

**Database Schema Conflicts**: Master-data entity relationships (parent/parent_id, address field mappings) don't align with DTO structures, requiring careful entity-DTO mapping and potential schema adjustments.

#### Updated Technical Details
- Services are primarily REST-based, not GraphQL-federated as planned
- json-rules-engine requires different API approach than documented
- Temporal server infrastructure dependency for workflow service
- Extensive TypeScript type alignment needed across all services  
- Database credential and port configuration standardization required
- Entity-DTO field mapping inconsistencies in address structures

---

## Work Log
*To be updated during implementation*

### Day 1 - [Date]
- [ ] Task started
- [ ] Current focus: 
- [ ] Blockers:
- [ ] Progress:

---

*Estimated Effort: 3 weeks*
*Team Size: 2-3 developers*
*Priority: HIGH - Blocks all business module development*