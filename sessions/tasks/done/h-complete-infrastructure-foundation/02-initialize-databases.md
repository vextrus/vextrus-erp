---
task: h-complete-infrastructure-foundation/02-initialize-databases
status: pending
created: 2025-09-20
---

# Subtask 2: Initialize Database Schemas

## Objective
Create all required database schemas, tables, and initial data for every service.

## Success Criteria
- [ ] PostgreSQL schemas created for all services
- [ ] TypeORM migrations run successfully
- [ ] Initial seed data loaded
- [ ] Redis configured with proper databases
- [ ] Kafka topics created

## Tasks

### 1. PostgreSQL Schema Setup
- [ ] Create schemas: auth, master_data, workflow, rules, audit, etc.
- [ ] Run TypeORM migrations for each service
- [ ] Verify table creation
- [ ] Set up proper permissions

### 2. Initial Data Seeding
- [ ] Create default admin user
- [ ] Load master data (countries, currencies, etc.)
- [ ] Create default roles and permissions
- [ ] Load Bangladesh-specific data

### 3. Redis Configuration
- [ ] Configure Redis databases (0-15)
- [ ] Set up cache keys structure
- [ ] Configure session storage
- [ ] Test Redis connectivity

### 4. Kafka Topics
- [ ] Create all required topics
- [ ] Configure partitions and replication
- [ ] Set retention policies
- [ ] Verify topic creation

## Database Schemas Required
```sql
-- Create all schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS master_data;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS rules_engine;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS file_storage;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS scm;
```

## Validation
```bash
# Check PostgreSQL schemas
docker exec vextrus-postgres psql -U vextrus -d vextrus_erp -c "\dn"

# Check Redis
docker exec vextrus-redis redis-cli ping

# Check Kafka topics
docker exec vextrus-kafka kafka-topics --list --bootstrap-server localhost:9092
```