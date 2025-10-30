# Immediate Action Plan - What to Do Right Now

## 🎯 Quick Decision Matrix

### Option A: Verify Infrastructure (15 minutes)
**Choose if**: You want to see everything working before proceeding
```bash
# 1. Check Grafana Dashboards
open http://localhost:3000
# Login: admin/admin

# 2. Check Temporal Workflows
open http://localhost:8088

# 3. Test a workflow
cd services/workflow
npm run test:workflow:po  # Test purchase order workflow
```

### Option B: Start Finance Module (Recommended)
**Choose if**: Ready to build business functionality
```bash
# 1. Create new task
echo "Creating Finance Module task..."
cat > sessions/tasks/h-implement-finance-module.md << 'EOF'
---
task: h-implement-finance-module
branch: feature/finance-module
status: active
created: 2025-09-17
modules: [finance, master-data, rules-engine]
---

# Implement Finance Module

## Goal
Implement core financial management system with Bangladesh compliance

## Success Criteria
- [ ] Chart of Accounts with Bangladesh structure
- [ ] General Ledger with double-entry bookkeeping
- [ ] Invoice management with VAT (15%)
- [ ] Tax withholding calculations
- [ ] Payment processing
- [ ] Financial reporting (P&L, Balance Sheet)
- [ ] NBR compliance reports

## Technical Approach
1. Create GraphQL schema
2. Implement TypeORM entities
3. Add Bangladesh tax logic
4. Create REST endpoints
5. Add integration tests
EOF

# 2. Create branch
git checkout -b feature/finance-module

# 3. Start development
cd services/finance
npm run dev
```

### Option C: Start HR Module
**Choose if**: Employee management is more urgent
```bash
# Similar to Option B but for HR module
cd services/hr
npm run dev
```

## 🚀 If You Choose Finance Module (Recommended Path)

### Step 1: Initial Setup (5 minutes)
```bash
# Navigate to finance service
cd services/finance

# Check current structure
ls -la src/

# You'll see skeleton structure:
# entities/
# graphql/
# controllers/
# services/
```

### Step 2: Create Core Entities (30 minutes)
```typescript
// src/entities/account.entity.ts
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string; // Account code (e.g., "1000")

  @Column()
  name: string; // Account name (e.g., "Cash")

  @Column()
  type: AccountType; // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column()
  currency: string; // "BDT"
}

// src/entities/transaction.entity.ts
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  vatAmount: number; // 15% VAT

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  withholdingTax: number; // Variable by vendor type

  @OneToMany(() => JournalEntry, entry => entry.transaction)
  journalEntries: JournalEntry[];
}
```

### Step 3: Implement Bangladesh Tax Logic (20 minutes)
```typescript
// src/services/tax.service.ts
export class TaxService {
  private readonly VAT_RATE = 0.15; // 15% VAT

  private readonly WITHHOLDING_RATES = {
    CONTRACTOR: 0.075,  // 7.5%
    SUPPLIER: 0.05,     // 5%
    SERVICE: 0.10       // 10%
  };

  calculateVAT(amount: number): number {
    return amount * this.VAT_RATE;
  }

  calculateWithholding(amount: number, vendorType: VendorType): number {
    return amount * this.WITHHOLDING_RATES[vendorType];
  }

  validateTIN(tin: string): boolean {
    return /^\d{10}$/.test(tin); // 10 digit TIN
  }

  validateBIN(bin: string): boolean {
    return /^\d{9}$/.test(bin); // 9 digit BIN
  }
}
```

### Step 4: Create GraphQL Schema (15 minutes)
```graphql
# src/graphql/schema.graphql
type Account @key(fields: "id") {
  id: ID!
  code: String!
  name: String!
  type: AccountType!
  balance: Float!
  currency: String!
}

type Transaction @key(fields: "id") {
  id: ID!
  date: DateTime!
  description: String!
  amount: Float!
  vatAmount: Float!
  withholdingTax: Float
  journalEntries: [JournalEntry!]!
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  INCOME
  EXPENSE
}

type Query {
  accounts(filter: AccountFilter): [Account!]!
  account(id: ID!): Account
  transactions(dateFrom: DateTime, dateTo: DateTime): [Transaction!]!
  trialBalance(date: DateTime): TrialBalance!
  profitLoss(dateFrom: DateTime!, dateTo: DateTime!): ProfitLoss!
}

type Mutation {
  createAccount(input: CreateAccountInput!): Account!
  postTransaction(input: PostTransactionInput!): Transaction!
  calculateTax(amount: Float!, vendorType: VendorType!): TaxCalculation!
}
```

## 📊 Monitoring Your Progress

### Check Service Health
```bash
# Service health endpoint
curl http://localhost:3005/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### View in Grafana
1. Open http://localhost:3000
2. Go to Business KPIs dashboard
3. You'll see finance metrics once transactions start flowing

### Test Your Implementation
```bash
cd services/finance
npm run test         # Unit tests
npm run test:e2e    # Integration tests
```

## ⚠️ Common Issues & Solutions

### Issue: Port already in use
```bash
# Find process using port
lsof -i :3005  # Mac/Linux
netstat -ano | findstr :3005  # Windows

# Kill process or change port in .env
PORT=3006
```

### Issue: Database connection failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart if needed
docker restart vextrus-postgres

# Check connection string
echo $DATABASE_URL
```

### Issue: TypeScript errors
```bash
# Rebuild TypeScript
npm run build

# Check for missing types
npm install --save-dev @types/node
```

## 📈 Success Metrics

### Day 1 Goals
- [ ] Basic entity structure created
- [ ] Tax calculation service working
- [ ] One GraphQL mutation working
- [ ] Health endpoint responding

### Week 1 Goals
- [ ] Chart of Accounts complete
- [ ] General Ledger posting working
- [ ] Basic invoice creation
- [ ] VAT calculation accurate
- [ ] Unit tests passing

### Week 2 Goals
- [ ] Full transaction posting
- [ ] Financial reports (Trial Balance)
- [ ] Integration with Master Data service
- [ ] Workflow integration for approvals
- [ ] 80% test coverage

## 🎉 Quick Wins to Build Momentum

### 1. Create Your First Account (5 minutes)
```bash
# GraphQL Playground: http://localhost:3005/graphql
mutation {
  createAccount(input: {
    code: "1000"
    name: "Cash"
    type: ASSET
    currency: "BDT"
  }) {
    id
    code
    name
    balance
  }
}
```

### 2. Calculate VAT (2 minutes)
```graphql
mutation {
  calculateTax(amount: 100000, vendorType: SUPPLIER) {
    subtotal
    vatAmount      # Should be 15,000
    withholdingTax  # Should be 5,000
    netPayable
  }
}
```

### 3. View in Temporal (3 minutes)
```bash
open http://localhost:8088
# See your invoice approval workflows
```

## 🔄 Alternative: Quick Infrastructure Verification

If you want to verify everything first:

```bash
# 1. Run infrastructure test suite
cd infrastructure/test
npm run test:all

# 2. Check all endpoints
./scripts/health-check-all.sh

# 3. Generate test data
cd scripts
./generate-test-data.sh

# 4. View dashboards with data
open http://localhost:3000
```

## 💡 Pro Tips

1. **Start Small**: Get one entity working end-to-end before expanding
2. **Test Often**: Run tests after each significant change
3. **Use Existing Patterns**: Copy from auth or master-data services
4. **Monitor Early**: Check Grafana to catch issues quickly
5. **Document as You Go**: Update CLAUDE.md in the service

## Ready to Start?

**Recommended**: Start with Finance Module Option B above. It's the most critical business module and other modules depend on it.

**Need Help?**
- Check `services/auth/` for a complete implementation example
- Review `docs/adr/` for architecture decisions
- Look at GraphQL schemas in working services

The infrastructure is ready, monitoring is active, and all supporting services are running. Time to build business value!

**Your next command:**
```bash
cd services/finance && npm run dev
```

Let's build this ERP! 🚀