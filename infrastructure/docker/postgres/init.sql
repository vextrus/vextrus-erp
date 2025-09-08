-- Vextrus ERP Database Initialization Script
-- Creates initial database structure with multi-tenant support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Bengali collation for proper sorting
CREATE COLLATION IF NOT EXISTS bengali (locale = 'bn_BD.utf8');

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
SET search_path TO core, auth, audit, public;

-- Create audit function for automatic timestamp updates
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create organizations table (multi-tenant root)
CREATE TABLE IF NOT EXISTS core.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255),
    type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}',
    
    -- Bangladesh specific
    trade_license VARCHAR(100),
    tin VARCHAR(50),
    bin VARCHAR(50),
    
    -- Audit columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1
);

-- Create users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    first_name_bn VARCHAR(100),
    last_name_bn VARCHAR(100),
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Security
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    password_changed_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    
    -- Audit columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1
);

-- Create roles table
CREATE TABLE IF NOT EXISTS auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    
    -- Audit columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    UNIQUE(organization_id, code)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS auth.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role_id UUID NOT NULL REFERENCES auth.roles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID,
    expires_at TIMESTAMPTZ,
    
    PRIMARY KEY (user_id, role_id)
);

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoked_reason VARCHAR(255),
    ip_address INET,
    user_agent TEXT
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_organizations_status ON core.organizations(status);
CREATE INDEX idx_users_organization ON auth.users(organization_id);
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_status ON auth.users(status);
CREATE INDEX idx_roles_organization ON auth.roles(organization_id);
CREATE INDEX idx_user_roles_user ON auth.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON auth.user_roles(role_id);
CREATE INDEX idx_refresh_tokens_user ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON auth.refresh_tokens(token_hash);
CREATE INDEX idx_audit_logs_organization ON audit.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit.audit_logs(user_id);
CREATE INDEX idx_audit_logs_occurred ON audit.audit_logs(occurred_at);

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON core.organizations
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON auth.roles
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- Insert default organization for development
INSERT INTO core.organizations (code, name, name_bn, type, status) 
VALUES ('DEMO', 'Demo Organization', 'ডেমো সংস্থা', 'DEMO', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO auth.roles (organization_id, code, name, description, permissions, is_system)
SELECT 
    o.id,
    r.code,
    r.name,
    r.description,
    r.permissions,
    true
FROM core.organizations o
CROSS JOIN (
    VALUES 
    ('SUPER_ADMIN', 'Super Admin', 'Full system access', '["*"]'::jsonb),
    ('ORG_ADMIN', 'Organization Admin', 'Organization level admin', '["org:*"]'::jsonb),
    ('PROJECT_MANAGER', 'Project Manager', 'Project management access', '["project:*", "report:read"]'::jsonb),
    ('ACCOUNTANT', 'Accountant', 'Financial module access', '["finance:*", "report:*"]'::jsonb),
    ('ENGINEER', 'Engineer', 'Engineering access', '["project:read", "task:write"]'::jsonb),
    ('VIEWER', 'Viewer', 'Read-only access', '["*:read"]'::jsonb)
) AS r(code, name, description, permissions)
WHERE o.code = 'DEMO'
ON CONFLICT (organization_id, code) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA core TO vextrus;
GRANT ALL PRIVILEGES ON SCHEMA auth TO vextrus;
GRANT ALL PRIVILEGES ON SCHEMA audit TO vextrus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO vextrus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO vextrus;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO vextrus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO vextrus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO vextrus;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO vextrus;