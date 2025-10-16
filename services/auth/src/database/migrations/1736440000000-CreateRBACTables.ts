import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRBACTables1736440000000 implements MigrationInterface {
  name = 'CreateRBACTables1736440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth"."permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(100) UNIQUE NOT NULL,
        "resource" varchar(50) NOT NULL,
        "action" varchar(50) NOT NULL,
        "description" text NOT NULL,
        "descriptionBn" text NOT NULL,
        "category" varchar(50) NOT NULL,
        "isActive" boolean DEFAULT true,
        "isSystem" boolean DEFAULT false,
        "requiresMfa" boolean DEFAULT false,
        "requiresApproval" boolean DEFAULT false,
        "conditions" jsonb,
        "metadata" jsonb,
        "createdAt" timestamptz DEFAULT NOW(),
        "updatedAt" timestamptz DEFAULT NOW(),
        "version" integer DEFAULT 1
      );
    `);

    // Create indexes for permissions
    await queryRunner.query(`
      CREATE INDEX "IDX_permissions_key" ON "auth"."permissions" ("key");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_permissions_resource_action" ON "auth"."permissions" ("resource", "action");
    `);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth"."roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "nameEn" varchar(100) NOT NULL,
        "nameBn" varchar(100) NOT NULL,
        "description" text NOT NULL,
        "descriptionBn" text,
        "organizationId" uuid NOT NULL,
        "parentRoleId" uuid,
        "level" integer DEFAULT 0,
        "permissions" jsonb DEFAULT '[]',
        "isActive" boolean DEFAULT true,
        "isSystem" boolean DEFAULT false,
        "isDefault" boolean DEFAULT false,
        "priority" integer DEFAULT 0,
        "metadata" jsonb,
        "createdAt" timestamptz DEFAULT NOW(),
        "createdBy" uuid,
        "updatedAt" timestamptz DEFAULT NOW(),
        "updatedBy" uuid,
        "deletedAt" timestamptz,
        "version" integer DEFAULT 1,
        CONSTRAINT "FK_roles_parentRole" FOREIGN KEY ("parentRoleId") 
          REFERENCES "auth"."roles" ("id") ON DELETE SET NULL
      );
    `);

    // Create indexes for roles
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_roles_name_org" ON "auth"."roles" ("name", "organizationId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_roles_name" ON "auth"."roles" ("name");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_roles_organizationId" ON "auth"."roles" ("organizationId");
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth"."role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") 
          REFERENCES "auth"."roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") 
          REFERENCES "auth"."permissions" ("id") ON DELETE CASCADE
      );
    `);

    // Create user_roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth"."user_roles" (
        "userId" uuid NOT NULL,
        "roleId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "assignedBy" uuid,
        "assignedAt" timestamptz DEFAULT NOW(),
        "expiresAt" timestamptz,
        "isActive" boolean DEFAULT true,
        "reason" text,
        "scope" jsonb,
        "revokedAt" timestamptz,
        "revokedBy" uuid,
        "revocationReason" text,
        PRIMARY KEY ("userId", "roleId"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("userId") 
          REFERENCES "auth"."users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("roleId") 
          REFERENCES "auth"."roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_assignedBy" FOREIGN KEY ("assignedBy") 
          REFERENCES "auth"."users" ("id") ON DELETE SET NULL
      );
    `);

    // Create indexes for user_roles
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_roles_userId_roleId" ON "auth"."user_roles" ("userId", "roleId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_organizationId" ON "auth"."user_roles" ("organizationId");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_expiresAt" ON "auth"."user_roles" ("expiresAt");
    `);

    // Insert default permissions for Bangladesh Construction context
    await queryRunner.query(`
      INSERT INTO "auth"."permissions" ("key", "resource", "action", "description", "descriptionBn", "category", "isSystem")
      VALUES 
      -- Project Management
      ('project.create', 'project', 'create', 'Create new projects', 'নতুন প্রকল্প তৈরি করুন', 'project_management', true),
      ('project.read', 'project', 'read', 'View project details', 'প্রকল্পের বিবরণ দেখুন', 'project_management', true),
      ('project.update', 'project', 'update', 'Update project information', 'প্রকল্পের তথ্য আপডেট করুন', 'project_management', true),
      ('project.delete', 'project', 'delete', 'Delete projects', 'প্রকল্প মুছে ফেলুন', 'project_management', true),
      ('project.approve', 'project', 'approve', 'Approve project changes', 'প্রকল্প পরিবর্তন অনুমোদন করুন', 'project_management', true),
      ('project.archive', 'project', 'archive', 'Archive completed projects', 'সম্পন্ন প্রকল্প সংরক্ষণ করুন', 'project_management', true),
      
      -- Financial Management
      ('finance.create', 'finance', 'create', 'Create financial records', 'আর্থিক রেকর্ড তৈরি করুন', 'financial_management', true),
      ('finance.read', 'finance', 'read', 'View financial information', 'আর্থিক তথ্য দেখুন', 'financial_management', true),
      ('finance.update', 'finance', 'update', 'Update financial records', 'আর্থিক রেকর্ড আপডেট করুন', 'financial_management', true),
      ('finance.approve', 'finance', 'approve', 'Approve financial transactions', 'আর্থিক লেনদেন অনুমোদন করুন', 'financial_management', true),
      ('finance.export', 'finance', 'export', 'Export financial reports', 'আর্থিক প্রতিবেদন রপ্তানি করুন', 'financial_management', true),
      
      -- Document Management
      ('document.upload', 'document', 'create', 'Upload documents', 'নথি আপলোড করুন', 'document_management', true),
      ('document.read', 'document', 'read', 'View documents', 'নথি দেখুন', 'document_management', true),
      ('document.update', 'document', 'update', 'Update documents', 'নথি আপডেট করুন', 'document_management', true),
      ('document.delete', 'document', 'delete', 'Delete documents', 'নথি মুছে ফেলুন', 'document_management', true),
      ('document.approve', 'document', 'approve', 'Approve documents', 'নথি অনুমোদন করুন', 'document_management', true),
      ('document.share', 'document', 'share', 'Share documents', 'নথি শেয়ার করুন', 'document_management', true),
      
      -- Compliance Management
      ('compliance.rajuk.submit', 'compliance', 'submit', 'Submit to RAJUK', 'রাজউকে জমা দিন', 'compliance_management', true),
      ('compliance.rajuk.track', 'compliance', 'read', 'Track RAJUK status', 'রাজউক স্ট্যাটাস ট্র্যাক করুন', 'compliance_management', true),
      ('compliance.nbr.file', 'compliance', 'submit', 'File NBR returns', 'এনবিআর রিটার্ন ফাইল করুন', 'compliance_management', true),
      ('compliance.nbr.report', 'compliance', 'read', 'View NBR reports', 'এনবিআর প্রতিবেদন দেখুন', 'compliance_management', true),
      
      -- Resource Management
      ('resource.allocate', 'resource', 'assign', 'Allocate resources', 'সম্পদ বরাদ্দ করুন', 'resource_management', true),
      ('resource.read', 'resource', 'read', 'View resource allocation', 'সম্পদ বরাদ্দ দেখুন', 'resource_management', true),
      ('resource.update', 'resource', 'update', 'Update resource allocation', 'সম্পদ বরাদ্দ আপডেট করুন', 'resource_management', true),
      
      -- User Management
      ('user.create', 'user', 'create', 'Create users', 'ব্যবহারকারী তৈরি করুন', 'user_management', true),
      ('user.read', 'user', 'read', 'View user information', 'ব্যবহারকারীর তথ্য দেখুন', 'user_management', true),
      ('user.update', 'user', 'update', 'Update user information', 'ব্যবহারকারীর তথ্য আপডেট করুন', 'user_management', true),
      ('user.delete', 'user', 'delete', 'Delete users', 'ব্যবহারকারী মুছে ফেলুন', 'user_management', true),
      
      -- Role Management
      ('role.create', 'role', 'create', 'Create roles', 'ভূমিকা তৈরি করুন', 'user_management', true),
      ('role.read', 'role', 'read', 'View roles', 'ভূমিকা দেখুন', 'user_management', true),
      ('role.update', 'role', 'update', 'Update roles', 'ভূমিকা আপডেট করুন', 'user_management', true),
      ('role.delete', 'role', 'delete', 'Delete roles', 'ভূমিকা মুছে ফেলুন', 'user_management', true),
      ('role.assign', 'role', 'assign', 'Assign roles to users', 'ব্যবহারকারীদের ভূমিকা বরাদ্দ করুন', 'user_management', true),
      ('role.revoke', 'role', 'delete', 'Revoke roles from users', 'ব্যবহারকারীদের থেকে ভূমিকা প্রত্যাহার করুন', 'user_management', true),
      
      -- Permission Management
      ('permission.read', 'permission', 'read', 'View permissions', 'অনুমতি দেখুন', 'user_management', true),
      
      -- Organization Management
      ('organization.manage', 'organization', 'manage', 'Manage organization settings', 'সংস্থা সেটিংস পরিচালনা করুন', 'system_administration', true),
      
      -- System Administration
      ('system.admin', 'system', 'manage', 'Full system administration', 'সম্পূর্ণ সিস্টেম প্রশাসন', 'system_administration', true),
      
      -- Reporting
      ('report.financial', 'report', 'read', 'View financial reports', 'আর্থিক প্রতিবেদন দেখুন', 'reporting', true),
      ('report.project', 'report', 'read', 'View project reports', 'প্রকল্প প্রতিবেদন দেখুন', 'reporting', true),
      ('report.compliance', 'report', 'read', 'View compliance reports', 'সম্মতি প্রতিবেদন দেখুন', 'reporting', true),
      
      -- Audit
      ('audit.view', 'audit', 'read', 'View audit logs', 'অডিট লগ দেখুন', 'audit', true),
      ('audit.export', 'audit', 'export', 'Export audit logs', 'অডিট লগ রপ্তানি করুন', 'audit', true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "auth"."user_roles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth"."role_permissions" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth"."roles" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth"."permissions" CASCADE;`);
  }
}