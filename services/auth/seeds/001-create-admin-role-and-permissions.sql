-- Seed Script: Create Admin Role with Finance Permissions
-- Purpose: Unblock integration testing by assigning all Finance permissions to test user
-- Status: Workaround for GAP-001 (Role Management API missing)
-- Target User: test.integration@vextrus.com (ID: 2f9cf0cf-f92e-49a1-b907-da92d14c9dc2)

-- ============================================================================
-- STEP 1: Create Finance Permissions
-- ============================================================================

-- Insert Finance permissions into the permissions table
INSERT INTO auth.permissions (id, key, resource, action, description, "descriptionBn", category, "isActive", "isSystem", "requiresMfa", "requiresApproval", "createdAt", "updatedAt", version)
VALUES
  -- Invoice Permissions
  (gen_random_uuid(), 'invoice:read', 'finance', 'read', 'View invoices', 'চালান দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'invoice:create', 'finance', 'create', 'Create invoices', 'চালান তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'invoice:update', 'finance', 'update', 'Update invoices', 'চালান আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'invoice:delete', 'finance', 'delete', 'Delete invoices', 'চালান মুছুন', 'financial_management', true, true, false, true, NOW(), NOW(), 1),
  (gen_random_uuid(), 'invoice:approve', 'finance', 'approve', 'Approve invoices', 'চালান অনুমোদন করুন', 'financial_management', true, true, true, false, NOW(), NOW(), 1),

  -- Payment Permissions
  (gen_random_uuid(), 'payment:read', 'finance', 'read', 'View payments', 'পেমেন্ট দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'payment:create', 'finance', 'create', 'Create payments', 'পেমেন্ট তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'payment:update', 'finance', 'update', 'Update payments', 'পেমেন্ট আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'payment:delete', 'finance', 'delete', 'Delete payments', 'পেমেন্ট মুছুন', 'financial_management', true, true, false, true, NOW(), NOW(), 1),
  (gen_random_uuid(), 'payment:approve', 'finance', 'approve', 'Approve payments', 'পেমেন্ট অনুমোদন করুন', 'financial_management', true, true, true, false, NOW(), NOW(), 1),

  -- Journal Permissions
  (gen_random_uuid(), 'journal:read', 'finance', 'read', 'View journal entries', 'জার্নাল এন্ট্রি দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'journal:create', 'finance', 'create', 'Create journal entries', 'জার্নাল এন্ট্রি তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'journal:update', 'finance', 'update', 'Update journal entries', 'জার্নাল এন্ট্রি আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'journal:delete', 'finance', 'delete', 'Delete journal entries', 'জার্নাল এন্ট্রি মুছুন', 'financial_management', true, true, false, true, NOW(), NOW(), 1),
  (gen_random_uuid(), 'journal:post', 'finance', 'approve', 'Post journal entries', 'জার্নাল এন্ট্রি পোস্ট করুন', 'financial_management', true, true, true, false, NOW(), NOW(), 1),

  -- Account Permissions
  (gen_random_uuid(), 'account:read', 'finance', 'read', 'View chart of accounts', 'চার্ট অফ একাউন্টস দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'account:create', 'finance', 'create', 'Create accounts', 'একাউন্ট তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'account:update', 'finance', 'update', 'Update accounts', 'একাউন্ট আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'account:delete', 'finance', 'delete', 'Delete accounts', 'একাউন্ট মুছুন', 'financial_management', true, true, false, true, NOW(), NOW(), 1),

  -- Master Data Permissions (for vendor/customer access)
  (gen_random_uuid(), 'customer:read', 'finance', 'read', 'View customers', 'গ্রাহক দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'customer:create', 'finance', 'create', 'Create customers', 'গ্রাহক তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'customer:update', 'finance', 'update', 'Update customers', 'গ্রাহক আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'vendor:read', 'finance', 'read', 'View vendors', 'বিক্রেতা দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'vendor:create', 'finance', 'create', 'Create vendors', 'বিক্রেতা তৈরি করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'vendor:update', 'finance', 'update', 'Update vendors', 'বিক্রেতা আপডেট করুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1),
  (gen_random_uuid(), 'product:read', 'finance', 'read', 'View products', 'পণ্য দেখুন', 'financial_management', true, true, false, false, NOW(), NOW(), 1)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Admin Role
-- ============================================================================

-- Create admin role with all Finance permissions in the permissions JSONB array
-- This uses the Role.permissions field (line 54 in role.entity.ts)
-- Using a deterministic UUID so the script is idempotent
WITH admin_role AS (
  INSERT INTO auth.roles (id, name, "nameEn", "nameBn", description, "descriptionBn", "organizationId", level, permissions, "isActive", "isSystem", "isDefault", priority, "createdAt", "updatedAt", version)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Admin role UUID (deterministic)
    'Finance Admin (Testing)',
    'Finance Admin (Testing)',
    'ফিন্যান্স এডমিন (টেস্টিং)',
    'Full access to all Finance module operations - FOR INTEGRATION TESTING ONLY',
    'সমস্ত ফিন্যান্স মডিউল অপারেশনে সম্পূর্ণ অ্যাক্সেস - শুধুমাত্র ইন্টিগ্রেশন টেস্টিং এর জন্য',
    '00000000-0000-0000-0000-000000000000'::uuid, -- Default tenant UUID
    0,
    '["invoice:read", "invoice:create", "invoice:update", "invoice:delete", "invoice:approve", "payment:read", "payment:create", "payment:update", "payment:delete", "payment:approve", "journal:read", "journal:create", "journal:update", "journal:delete", "journal:post", "account:read", "account:create", "account:update", "account:delete", "customer:read", "customer:create", "customer:update", "vendor:read", "vendor:create", "vendor:update", "product:read"]'::jsonb,
    true,
    true,
    false,
    100,
    NOW(),
    NOW(),
    1
  )
  ON CONFLICT (id) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    "updatedAt" = NOW()
  RETURNING id
)
SELECT 'Admin role created/updated with ID: ' || id FROM admin_role;

-- ============================================================================
-- STEP 3: Assign Role to Test User
-- ============================================================================

-- Assign admin role to the test user created during Phase 1 Day 2
-- Test user details:
--   Email: test.integration@vextrus.com
--   User ID: 2f9cf0cf-f92e-49a1-b907-da92d14c9dc2
--   Organization: 00000000-0000-0000-0000-000000000000 (default tenant)

-- GAP-001B Fix: Need to populate BOTH camelCase PKs and snake_case FKs
INSERT INTO auth.user_roles ("userId", "roleId", "organizationId", "assignedBy", "assignedAt", "isActive", reason, user_id, role_id)
VALUES (
  '2f9cf0cf-f92e-49a1-b907-da92d14c9dc2'::uuid,  -- PK: userId
  '00000000-0000-0000-0000-000000000001'::uuid,  -- PK: roleId (Admin role)
  '00000000-0000-0000-0000-000000000000'::uuid,  -- organizationId (default tenant)
  NULL,                                           -- assignedBy (system)
  NOW(),                                          -- assignedAt
  true,                                           -- isActive
  'Integration testing - GAP-001 workaround',     -- reason
  '2f9cf0cf-f92e-49a1-b907-da92d14c9dc2'::uuid,  -- FK: user_id (for TypeORM JOIN)
  '00000000-0000-0000-0000-000000000001'::uuid   -- FK: role_id (for TypeORM JOIN)
)
ON CONFLICT ("userId", "roleId") DO UPDATE SET
  "isActive" = true,
  "assignedAt" = NOW(),
  reason = 'Integration testing - GAP-001 workaround (updated)',
  user_id = '2f9cf0cf-f92e-49a1-b907-da92d14c9dc2'::uuid,  -- Update FK
  role_id = '00000000-0000-0000-0000-000000000001'::uuid;  -- Update FK

-- ============================================================================
-- STEP 4: Verification Query
-- ============================================================================

-- Verify the role assignment
SELECT
  u.id AS user_id,
  u.email,
  u."organizationId",
  r.name AS role_name,
  r.permissions,
  ur."assignedAt",
  ur."isActive"
FROM auth.users u
JOIN auth.user_roles ur ON u.id = ur."userId"
JOIN auth.roles r ON ur."roleId" = r.id
WHERE u.email = 'test.integration@vextrus.com';

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script addresses GAP-001 as a SHORT-TERM WORKAROUND.
-- For production, implement the full Role Management API as specified in
-- PHASE1-INTEGRATION-GAPS-ANALYSIS.md (Option 2: Implement Role Management API)

-- Expected result after execution:
-- - 27 Finance permissions created
-- - 1 admin role created with all permissions
-- - Test user assigned to admin role
-- - Integration tests can now execute Finance operations

-- To execute this script:
-- docker exec -i vextrus-postgres psql -U postgres -d vextrus_auth < services/auth/seeds/001-create-admin-role-and-permissions.sql

-- To verify permissions are working:
-- 1. Get JWT token for test.integration@vextrus.com
-- 2. Query Finance service: { invoices { id invoiceNumber } }
-- 3. Should return results instead of "Insufficient permissions"
