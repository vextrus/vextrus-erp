import { DataSource, EntityManager } from 'typeorm';
import { dataSource, clearDatabase, createTestTenant } from '../setup';

// Mock entities for testing
class User {
  id!: string;
  email!: string;
  tenantId!: string;
  roles?: Role[];
}

class Role {
  id!: string;
  name!: string;
  permissions!: string[];
  tenantId!: string;
  users?: User[];
}

class File {
  id!: string;
  filename!: string;
  size!: number;
  tenantId!: string;
  metadata?: FileMetadata;
}

class FileMetadata {
  id!: string;
  fileId!: string;
  width?: number;
  height?: number;
  mimeType!: string;
}

class AuditLog {
  id!: string;
  entityType!: string;
  entityId!: string;
  action!: string;
  performedBy!: string;
  tenantId!: string;
  createdAt!: Date;
}

describe('Database Transaction Rollback Tests', () => {
  const testTenant = createTestTenant();
  
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Multi-Service Transaction Scenarios', () => {
    it('should rollback user creation when role assignment fails', async () => {
      let userCreated = false;
      let roleAssigned = false;
      let transactionCommitted = false;

      try {
        await dataSource.transaction(async (manager: EntityManager) => {
          // Step 1: Create user
          const user = new User();
          user.id = 'user-123';
          user.email = 'test@example.com';
          user.tenantId = testTenant.id;
          
          await manager.save(user);
          userCreated = true;

          // Step 2: Try to assign non-existent role (should fail)
          const role = await manager.findOne(Role, { 
            where: { id: 'non-existent-role' } 
          });
          
          if (!role) {
            throw new Error('Role not found');
          }
          
          user.roles = [role];
          await manager.save(user);
          roleAssigned = true;
          
          transactionCommitted = true;
        });
      } catch (error) {
        // Transaction should rollback
      }

      // Verify rollback
      const users = await dataSource.getRepository(User).find();
      
      expect(userCreated).toBe(true);
      expect(roleAssigned).toBe(false);
      expect(transactionCommitted).toBe(false);
      expect(users).toHaveLength(0); // User should not exist due to rollback
    });

    it('should rollback file upload when metadata creation fails', async () => {
      let fileCreated = false;
      let metadataCreated = false;
      let uploadComplete = false;

      try {
        await dataSource.transaction(async (manager: EntityManager) => {
          // Step 1: Create file record
          const file = new File();
          file.id = 'file-456';
          file.filename = 'document.pdf';
          file.size = 1048576; // 1MB
          file.tenantId = testTenant.id;
          
          await manager.save(file);
          fileCreated = true;

          // Step 2: Try to create metadata with invalid data
          const metadata = new FileMetadata();
          metadata.id = 'meta-789';
          metadata.fileId = file.id;
          metadata.mimeType = null!; // This should cause a constraint violation
          
          await manager.save(metadata);
          metadataCreated = true;
          
          uploadComplete = true;
        });
      } catch (error) {
        // Transaction should rollback
      }

      // Verify rollback
      const files = await dataSource.getRepository(File).find();
      const metadata = await dataSource.getRepository(FileMetadata).find();
      
      expect(fileCreated).toBe(true);
      expect(metadataCreated).toBe(false);
      expect(uploadComplete).toBe(false);
      expect(files).toHaveLength(0); // File should not exist
      expect(metadata).toHaveLength(0); // Metadata should not exist
    });

    it('should maintain audit log consistency during service failures', async () => {
      const auditLogs: AuditLog[] = [];
      let mainOperationComplete = false;

      try {
        await dataSource.transaction(async (manager: EntityManager) => {
          // Step 1: Perform main operation
          const user = new User();
          user.id = 'user-audit-test';
          user.email = 'audit@test.com';
          user.tenantId = testTenant.id;
          await manager.save(user);

          // Step 2: Create audit log
          const auditLog = new AuditLog();
          auditLog.id = 'audit-1';
          auditLog.entityType = 'User';
          auditLog.entityId = user.id;
          auditLog.action = 'CREATE';
          auditLog.performedBy = 'system';
          auditLog.tenantId = testTenant.id;
          auditLog.createdAt = new Date();
          
          await manager.save(auditLog);
          auditLogs.push(auditLog);

          // Step 3: Simulate service failure
          throw new Error('Service unavailable');
          
          mainOperationComplete = true;
        });
      } catch (error) {
        // Transaction should rollback
      }

      // Verify audit logs were rolled back with the transaction
      const persistedAuditLogs = await dataSource.getRepository(AuditLog).find();
      const persistedUsers = await dataSource.getRepository(User).find();
      
      expect(auditLogs).toHaveLength(1); // Audit log was created in transaction
      expect(mainOperationComplete).toBe(false);
      expect(persistedAuditLogs).toHaveLength(0); // But rolled back
      expect(persistedUsers).toHaveLength(0); // User also rolled back
    });

    it('should handle distributed transaction coordination', async () => {
      const operations: string[] = [];
      let coordinationSuccessful = false;

      // Simulate distributed transaction with multiple data sources
      const transaction1 = dataSource.createQueryRunner();
      const transaction2 = dataSource.createQueryRunner(); // Simulating second service
      
      await transaction1.connect();
      await transaction2.connect();
      
      await transaction1.startTransaction();
      await transaction2.startTransaction();

      try {
        // Service 1: Create user
        await transaction1.manager.save(User, {
          id: 'dist-user-1',
          email: 'dist1@test.com',
          tenantId: testTenant.id,
        });
        operations.push('user-created');

        // Service 2: Create role
        await transaction2.manager.save(Role, {
          id: 'dist-role-1',
          name: 'Admin',
          permissions: ['all'],
          tenantId: testTenant.id,
        });
        operations.push('role-created');

        // Simulate coordination failure
        throw new Error('Coordination failed');
        
        await transaction1.commitTransaction();
        await transaction2.commitTransaction();
        coordinationSuccessful = true;
      } catch (error) {
        // Rollback both transactions
        await transaction1.rollbackTransaction();
        await transaction2.rollbackTransaction();
      } finally {
        await transaction1.release();
        await transaction2.release();
      }

      // Verify both transactions rolled back
      const users = await dataSource.getRepository(User).find();
      const roles = await dataSource.getRepository(Role).find();
      
      expect(operations).toEqual(['user-created', 'role-created']);
      expect(coordinationSuccessful).toBe(false);
      expect(users).toHaveLength(0);
      expect(roles).toHaveLength(0);
    });
  });

  describe('Nested Transaction Scenarios', () => {
    it('should handle nested transaction rollbacks correctly', async () => {
      let outerTransactionComplete = false;
      let innerTransactionComplete = false;
      const createdEntities: string[] = [];

      try {
        await dataSource.transaction(async (outerManager: EntityManager) => {
          // Outer transaction: Create user
          const user = new User();
          user.id = 'outer-user';
          user.email = 'outer@test.com';
          user.tenantId = testTenant.id;
          await outerManager.save(user);
          createdEntities.push('outer-user');

          // Nested transaction
          await outerManager.transaction(async (innerManager: EntityManager) => {
            // Inner transaction: Create role
            const role = new Role();
            role.id = 'inner-role';
            role.name = 'Nested Role';
            role.permissions = ['read'];
            role.tenantId = testTenant.id;
            await innerManager.save(role);
            createdEntities.push('inner-role');

            // Force inner transaction to fail
            throw new Error('Inner transaction failed');
            
            innerTransactionComplete = true;
          });

          outerTransactionComplete = true;
        });
      } catch (error) {
        // Both transactions should rollback
      }

      const users = await dataSource.getRepository(User).find();
      const roles = await dataSource.getRepository(Role).find();
      
      expect(createdEntities).toEqual(['outer-user', 'inner-role']);
      expect(innerTransactionComplete).toBe(false);
      expect(outerTransactionComplete).toBe(false);
      expect(users).toHaveLength(0);
      expect(roles).toHaveLength(0);
    });
  });

  describe('Savepoint and Partial Rollback', () => {
    it('should support savepoints for partial rollback', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const createdUsers: string[] = [];

      try {
        // Create first user
        await queryRunner.manager.save(User, {
          id: 'user-1',
          email: 'user1@test.com',
          tenantId: testTenant.id,
        });
        createdUsers.push('user-1');

        // Create savepoint
        await queryRunner.createSavePoint('sp1');

        // Create second user
        await queryRunner.manager.save(User, {
          id: 'user-2',
          email: 'user2@test.com',
          tenantId: testTenant.id,
        });
        createdUsers.push('user-2');

        // Create another savepoint
        await queryRunner.createSavePoint('sp2');

        // Try to create third user with duplicate email (should fail)
        try {
          await queryRunner.manager.save(User, {
            id: 'user-3',
            email: 'user1@test.com', // Duplicate email
            tenantId: testTenant.id,
          });
          createdUsers.push('user-3');
        } catch (error) {
          // Rollback to savepoint 2
          await queryRunner.rollbackToSavePoint('sp2');
        }

        // Commit transaction
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      const users = await dataSource.getRepository(User).find();
      
      expect(createdUsers).toEqual(['user-1', 'user-2']);
      expect(users).toHaveLength(2); // Only first two users should exist
      expect(users.map(u => u.id)).toEqual(['user-1', 'user-2']);
    });
  });

  describe('Concurrent Transaction Handling', () => {
    it('should handle concurrent transactions with proper isolation', async () => {
      const results: any[] = [];

      // Run two concurrent transactions
      const transaction1 = dataSource.transaction(async (manager: EntityManager) => {
        const user = new User();
        user.id = 'concurrent-1';
        user.email = 'concurrent1@test.com';
        user.tenantId = testTenant.id;
        
        await manager.save(user);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check isolation - should not see other transaction's data
        const allUsers = await manager.find(User);
        results.push({ transaction: 1, users: allUsers.length });
        
        return user;
      });

      const transaction2 = dataSource.transaction(async (manager: EntityManager) => {
        const user = new User();
        user.id = 'concurrent-2';
        user.email = 'concurrent2@test.com';
        user.tenantId = testTenant.id;
        
        await manager.save(user);
        
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check isolation - should not see other transaction's data
        const allUsers = await manager.find(User);
        results.push({ transaction: 2, users: allUsers.length });
        
        return user;
      });

      await Promise.all([transaction1, transaction2]);

      // After both commit, should see both users
      const finalUsers = await dataSource.getRepository(User).find();
      
      expect(results).toHaveLength(2);
      expect(results[0].users).toBe(1); // Each transaction only sees its own data
      expect(results[1].users).toBe(1);
      expect(finalUsers).toHaveLength(2); // Both users exist after commit
    });

    it('should handle deadlock detection and recovery', async () => {
      let deadlockDetected = false;
      const queryRunner1 = dataSource.createQueryRunner();
      const queryRunner2 = dataSource.createQueryRunner();
      
      await queryRunner1.connect();
      await queryRunner2.connect();

      try {
        // Start both transactions
        await queryRunner1.startTransaction();
        await queryRunner2.startTransaction();

        // Transaction 1: Lock user table, then try role table
        const t1 = (async () => {
          await queryRunner1.manager.save(User, {
            id: 'deadlock-user-1',
            email: 'deadlock1@test.com',
            tenantId: testTenant.id,
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await queryRunner1.manager.save(Role, {
            id: 'deadlock-role-1',
            name: 'Role1',
            permissions: [],
            tenantId: testTenant.id,
          });
        })();

        // Transaction 2: Lock role table, then try user table (opposite order)
        const t2 = (async () => {
          await queryRunner2.manager.save(Role, {
            id: 'deadlock-role-2',
            name: 'Role2',
            permissions: [],
            tenantId: testTenant.id,
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          await queryRunner2.manager.save(User, {
            id: 'deadlock-user-2',
            email: 'deadlock2@test.com',
            tenantId: testTenant.id,
          });
        })();

        // Wait for both with timeout
        await Promise.race([
          Promise.all([t1, t2]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Deadlock timeout')), 5000)
          ),
        ]);

        await queryRunner1.commitTransaction();
        await queryRunner2.commitTransaction();
      } catch (error: any) {
        if (error.message.includes('Deadlock') || error.message.includes('timeout')) {
          deadlockDetected = true;
        }
        
        await queryRunner1.rollbackTransaction();
        await queryRunner2.rollbackTransaction();
      } finally {
        await queryRunner1.release();
        await queryRunner2.release();
      }

      expect(deadlockDetected).toBe(true);
      
      // Verify no partial data exists
      const users = await dataSource.getRepository(User).find();
      const roles = await dataSource.getRepository(Role).find();
      
      expect(users).toHaveLength(0);
      expect(roles).toHaveLength(0);
    });
  });
});