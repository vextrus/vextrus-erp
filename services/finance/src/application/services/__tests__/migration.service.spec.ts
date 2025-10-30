import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { MigrationService, MigrationPackage, ValidationResult, MigrationStatus } from '../migration.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('MigrationService', () => {
  let service: MigrationService;
  let connection: jest.Mocked<Connection>;

  beforeEach(async () => {
    const mockConnection = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<Connection>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationService,
        {
          provide: Connection,
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<MigrationService>(MigrationService);
    connection = module.get<Connection>(Connection) as jest.Mocked<Connection>;
  });

  describe('generateMigrationScripts', () => {
    it('should generate all migration scripts', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts).toHaveProperty('preMigration');
      expect(scripts).toHaveProperty('migration');
      expect(scripts).toHaveProperty('postMigration');
      expect(scripts).toHaveProperty('rollback');
      expect(scripts).toHaveProperty('validation');
      expect(scripts).toHaveProperty('seedData');
      expect(scripts).toHaveProperty('version');
      expect(scripts).toHaveProperty('checksum');
      expect(scripts).toHaveProperty('timestamp');
    });

    it('should include finance schema creation', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.migration.sql).toContain('CREATE SCHEMA IF NOT EXISTS finance');
      expect(scripts.migration.sql).toContain('SET search_path TO finance');
    });

    it('should create all required tables', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();
      const requiredTables = [
        'chart_of_accounts',
        'journal_entries',
        'invoices',
        'invoice_items',
        'payments',
        'expenses',
        'tax_calculations',
        'nbr_submissions',
        'receivables',
        'payables',
        'bank_accounts',
        'cash_transactions',
        'event_store',
        'tenants',
      ];

      requiredTables.forEach(table => {
        expect(scripts.migration.sql).toContain(`CREATE TABLE IF NOT EXISTS finance.${table}`);
      });
    });

    it('should include Bangladesh-specific types', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.migration.sql).toContain("CREATE TYPE tax_type AS ENUM");
      expect(scripts.migration.sql).toContain('VAT');
      expect(scripts.migration.sql).toContain('TDS');
      expect(scripts.migration.sql).toContain('AIT');
    });

    it('should create necessary indexes', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.migration.sql).toContain('CREATE INDEX idx_invoice_tenant_date');
      expect(scripts.migration.sql).toContain('CREATE INDEX idx_payment_tenant_date');
      expect(scripts.migration.sql).toContain('CREATE INDEX idx_journal_tenant_date');
    });

    it('should implement Row Level Security', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.migration.sql).toContain('ENABLE ROW LEVEL SECURITY');
      expect(scripts.migration.sql).toContain('CREATE POLICY');
      expect(scripts.migration.sql).toContain('current_setting');
    });
  });

  describe('executeMigration', () => {
    it('should execute migration successfully', async () => {
      const migrationPackage: MigrationPackage = await service.generateMigrationScripts();

      const result: MigrationStatus = await service.executeMigration(migrationPackage);

      expect(result.status).toBe('SUCCESS');
      expect(result.version).toBe(migrationPackage.version);
      expect(result.checksum).toBe(migrationPackage.checksum);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should rollback on error', async () => {
      const migrationPackage: MigrationPackage = await service.generateMigrationScripts();
      connection.query.mockRejectedValueOnce(new Error('Migration failed'));

      const result: MigrationStatus = await service.executeMigration(migrationPackage);

      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Migration failed');
    });

    it('should support dry run mode', async () => {
      const migrationPackage: MigrationPackage = await service.generateMigrationScripts();

      const result: MigrationStatus = await service.executeMigration(migrationPackage, { dryRun: true });

      expect(result.status).toBe('SUCCESS');
      expect(connection.query).not.toHaveBeenCalled();
    });

    it('should skip validation when requested', async () => {
      const migrationPackage: MigrationPackage = await service.generateMigrationScripts();

      const result: MigrationStatus = await service.executeMigration(migrationPackage, { skipValidation: true });

      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('validateMigration', () => {
    it('should validate all tables exist', async () => {
      connection.query
        .mockResolvedValueOnce([
          { table_name: 'chart_of_accounts', column_name: 'tenant_id' },
          { table_name: 'invoices', column_name: 'tenant_id' },
          { table_name: 'payments', column_name: 'tenant_id' },
          { table_name: 'journal_entries', column_name: 'tenant_id' },
        ])
        .mockResolvedValueOnce([{ indexname: 'idx_invoice_tenant_date' }])
        .mockResolvedValueOnce([{ constraint_type: 'PRIMARY KEY', table_name: 'invoices' }])
        .mockResolvedValueOnce([{ tablename: 'invoices', rowsecurity: true }])
        .mockResolvedValueOnce([{ grantee: 'finance_app', privilege_type: 'SELECT' }])
        .mockResolvedValueOnce([{ count: '20' }])
        .mockResolvedValueOnce([{ count: '35' }])
        .mockResolvedValueOnce([{ count: '25' }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '8' }])
        .mockResolvedValueOnce([{ unbalanced: '0' }]);

      const result: ValidationResult = await service.validateMigration();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toBeDefined();
      expect(result.summary.tablesCreated).toBe(20);
      expect(result.summary.dataIntegrity).toBe(true);
    });

    it('should detect missing required columns', async () => {
      connection.query
        .mockResolvedValueOnce([
          { table_name: 'invoices', column_name: 'invoice_id' },
        ])
        .mockResolvedValueOnce([{ indexname: 'idx_invoice_tenant_date' }])
        .mockResolvedValueOnce([{ constraint_type: 'PRIMARY KEY', table_name: 'invoices' }])
        .mockResolvedValueOnce([{ tablename: 'invoices', rowsecurity: true }])
        .mockResolvedValueOnce([{ grantee: 'finance_app', privilege_type: 'SELECT' }])
        .mockResolvedValueOnce([{ count: '20' }])
        .mockResolvedValueOnce([{ count: '35' }])
        .mockResolvedValueOnce([{ count: '25' }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '8' }])
        .mockResolvedValueOnce([{ unbalanced: '0' }]);

      const result: ValidationResult = await service.validateMigration();

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(i => i.type === 'SCHEMA')).toBe(true);
    });

    it('should detect missing indexes', async () => {
      connection.query
        .mockResolvedValueOnce([
          { table_name: 'invoices', column_name: 'tenant_id' },
          { table_name: 'invoices', column_name: 'invoice_number' },
          { table_name: 'invoices', column_name: 'customer_id' },
          { table_name: 'invoices', column_name: 'total' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ constraint_type: 'PRIMARY KEY', table_name: 'invoices' }])
        .mockResolvedValueOnce([{ tablename: 'invoices', rowsecurity: true }])
        .mockResolvedValueOnce([{ grantee: 'finance_app', privilege_type: 'SELECT' }])
        .mockResolvedValueOnce([{ count: '20' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '25' }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '8' }])
        .mockResolvedValueOnce([{ unbalanced: '0' }]);

      const result: ValidationResult = await service.validateMigration();

      expect(result.issues.some(i => i.type === 'INDEX')).toBe(true);
    });

    it('should detect RLS not enabled', async () => {
      connection.query
        .mockResolvedValueOnce([
          { table_name: 'invoices', column_name: 'tenant_id' },
          { table_name: 'invoices', column_name: 'invoice_number' },
          { table_name: 'invoices', column_name: 'customer_id' },
          { table_name: 'invoices', column_name: 'total' },
        ])
        .mockResolvedValueOnce([{ indexname: 'idx_invoice_tenant_date' }])
        .mockResolvedValueOnce([{ constraint_type: 'PRIMARY KEY', table_name: 'invoices' }])
        .mockResolvedValueOnce([{ tablename: 'invoices', rowsecurity: false }])
        .mockResolvedValueOnce([{ grantee: 'finance_app', privilege_type: 'SELECT' }])
        .mockResolvedValueOnce([{ count: '20' }])
        .mockResolvedValueOnce([{ count: '35' }])
        .mockResolvedValueOnce([{ count: '25' }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '10' }])
        .mockResolvedValueOnce([{ count: '8' }])
        .mockResolvedValueOnce([{ unbalanced: '0' }]);

      const result: ValidationResult = await service.validateMigration();

      expect(result.issues.some(i => i.type === 'PERMISSION' && i.description.includes('Row Level Security'))).toBe(true);
    });
  });

  describe('getMigrationHistory', () => {
    it('should retrieve migration history', async () => {
      const mockHistory = [
        {
          version: '2.0.0',
          applied_at: new Date(),
          execution_time: '5000',
          checksum: 'abc123',
          status: 'SUCCESS',
        },
      ];

      connection.query.mockResolvedValue(mockHistory);

      const history: MigrationStatus[] = await service.getMigrationHistory();

      expect(history).toHaveLength(1);
      expect(history[0].version).toBe('2.0.0');
      expect(history[0].status).toBe('SUCCESS');
      expect(history[0].executionTime).toBe(5000);
    });

    it('should handle empty migration history', async () => {
      connection.query.mockResolvedValue([]);

      const history: MigrationStatus[] = await service.getMigrationHistory();

      expect(history).toHaveLength(0);
    });

    it('should handle query errors gracefully', async () => {
      connection.query.mockRejectedValue(new Error('Query failed'));

      const history: MigrationStatus[] = await service.getMigrationHistory();

      expect(history).toHaveLength(0);
    });
  });

  describe('Migration Package', () => {
    it('should calculate correct checksum', async () => {
      const package1: MigrationPackage = await service.generateMigrationScripts();
      const package2: MigrationPackage = await service.generateMigrationScripts();

      // Checksums should be identical for same content
      expect(package1.checksum).toBe(package2.checksum);
      expect(package1.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex format
    });

    it('should save migration package to file', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      const migrationPackage: MigrationPackage = await service.generateMigrationScripts();

      expect(mockWriteFileSync).toHaveBeenCalled();
      const callArgs = mockWriteFileSync.mock.calls[0];
      expect(callArgs[0]).toContain('migrations');
      expect(callArgs[0]).toContain('migration-2.0.0');
      expect(callArgs[1]).toContain(migrationPackage.version);

      mockWriteFileSync.mockRestore();
      mockExistsSync.mockRestore();
    });
  });

  describe('Seed Data Scripts', () => {
    it('should include Bangladesh chart of accounts', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.seedData?.sql).toContain('Demo Company Ltd');
      expect(scripts.seedData?.sql).toContain('ডেমো কোম্পানি লিমিটেড');
      expect(scripts.seedData?.sql).toContain('Assets');
      expect(scripts.seedData?.sql).toContain('সম্পদ');
    });

    it('should set up parent-child account relationships', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.seedData?.sql).toContain('parent_id');
      expect(scripts.seedData?.sql).toContain('UPDATE finance.chart_of_accounts');
    });

    it('should use correct tenant ID', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.seedData?.sql).toContain('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    });
  });

  describe('Rollback Scripts', () => {
    it('should drop all objects in correct order', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      const rollbackSQL = scripts.rollback.sql;

      expect(rollbackSQL).toContain('DROP TABLE IF EXISTS finance.cash_transactions CASCADE');
      expect(rollbackSQL).toContain('DROP TABLE IF EXISTS finance.invoices CASCADE');
      expect(rollbackSQL).toContain('DROP TYPE IF EXISTS account_type CASCADE');
      expect(rollbackSQL).toContain('DROP FUNCTION IF EXISTS finance.update_updated_at_column()');
    });

    it('should include backup restoration logic', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.rollback.sql).toContain('finance_backup');
      expect(scripts.rollback.sql).toContain('Backup data available');
    });

    it('should record rollback in audit log', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.rollback.sql).toContain('ROLLBACK');
      expect(scripts.rollback.sql).toContain('INSERT INTO finance_audit.audit_log');
    });
  });

  describe('Validation Scripts', () => {
    it('should validate schemas exist', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.validation.sql).toContain('information_schema.schemata');
      expect(scripts.validation.sql).toContain('schema_name = \'finance\'');
      expect(scripts.validation.sql).toContain('schema_name = \'finance_audit\'');
    });

    it('should check minimum object counts', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.validation.sql).toContain('table_count < 15');
      expect(scripts.validation.sql).toContain('index_count < 30');
      expect(scripts.validation.sql).toContain('constraint_count < 20');
    });

    it('should validate RLS is enabled', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.validation.sql).toContain('rowsecurity = true');
      expect(scripts.validation.sql).toContain('RLS not enabled on invoices');
    });

    it('should check journal entry balance', async () => {
      const scripts: MigrationPackage = await service.generateMigrationScripts();

      expect(scripts.validation.sql).toContain('SUM(debit) - SUM(credit)');
      expect(scripts.validation.sql).toContain('Unbalanced journal entries found');
    });
  });
});