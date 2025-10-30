-- Multi-Tenancy Setup for Vextrus ERP
-- This migration sets up Row-Level Security (RLS) for tenant isolation

-- Create a function to get current tenant ID from session variable
CREATE OR REPLACE FUNCTION get_current_tenant_id() 
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.tenant_id', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create organizations table (master tenant table)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'construction', -- construction, real-estate, both
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create divisions table (for large organizations)
CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(50), -- residential, commercial, infrastructure
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- Create projects table (multi-tenant)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    division_id UUID REFERENCES divisions(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50), -- building, road, bridge, residential-complex
    status VARCHAR(50) DEFAULT 'planning', -- planning, active, on-hold, completed
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    location JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sites table (construction sites within projects)
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    coordinates JSONB DEFAULT '{}',
    site_manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, code)
);

-- Add tenant_id to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'tenant_id') THEN
        ALTER TABLE users ADD COLUMN tenant_id UUID;
        ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
        ALTER TABLE users ADD COLUMN division_id UUID REFERENCES divisions(id);
    END IF;
END $$;

-- Add tenant_id to other core tables (if they exist)
DO $$
DECLARE
    tbl RECORD;
    tables_to_update TEXT[] := ARRAY[
        'roles',
        'permissions', 
        'user_roles',
        'audit_logs',
        'documents',
        'notifications'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_update
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' AND table_name = table_name) THEN
            -- Check if tenant_id column doesn't exist
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND information_schema.columns.table_name = table_name 
                          AND column_name = 'tenant_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', table_name);
                RAISE NOTICE 'Added tenant_id to table: %', table_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Enable Row Level Security on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY tenant_isolation_select ON users
    FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_insert ON users
    FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_update ON users
    FOR UPDATE
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

CREATE POLICY tenant_isolation_delete ON users
    FOR DELETE
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- Create RLS policies for projects table
CREATE POLICY tenant_isolation_select ON projects
    FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_insert ON projects
    FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_update ON projects
    FOR UPDATE
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_delete ON projects
    FOR DELETE
    USING (tenant_id = get_current_tenant_id());

-- Create RLS policies for sites table
CREATE POLICY tenant_isolation_select ON sites
    FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_insert ON sites
    FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_update ON sites
    FOR UPDATE
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_delete ON sites
    FOR DELETE
    USING (tenant_id = get_current_tenant_id());

-- Create RLS policies for divisions (organization-level access)
CREATE POLICY org_isolation_select ON divisions
    FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = current_setting('app.user_id', true)::uuid
    ));

CREATE POLICY org_isolation_insert ON divisions
    FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = current_setting('app.user_id', true)::uuid
    ));

CREATE POLICY org_isolation_update ON divisions
    FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = current_setting('app.user_id', true)::uuid
    ))
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = current_setting('app.user_id', true)::uuid
    ));

CREATE POLICY org_isolation_delete ON divisions
    FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = current_setting('app.user_id', true)::uuid
    ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_project_id ON sites(project_id);
CREATE INDEX IF NOT EXISTS idx_divisions_organization_id ON divisions(organization_id);

-- Create helper functions for tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.tenant_id', p_tenant_id::text, false);
    PERFORM set_config('app.user_id', p_user_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        tenant_id,
        table_name,
        operation,
        user_id,
        record_id,
        old_data,
        new_data,
        created_at
    ) VALUES (
        get_current_tenant_id(),
        TG_TABLE_NAME,
        TG_OP,
        current_setting('app.user_id', true)::uuid,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
            ELSE NULL
        END,
        CURRENT_TIMESTAMP
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create sample data for testing
INSERT INTO organizations (id, name, slug, type, subscription_plan)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'ABC Construction Ltd', 'abc-construction', 'construction', 'enterprise'),
    ('22222222-2222-2222-2222-222222222222', 'XYZ Real Estate', 'xyz-realestate', 'real-estate', 'professional')
ON CONFLICT DO NOTHING;

INSERT INTO divisions (organization_id, name, code, type)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Residential Division', 'RES', 'residential'),
    ('11111111-1111-1111-1111-111111111111', 'Commercial Division', 'COM', 'commercial')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions to the application user
GRANT ALL ON ALL TABLES IN SCHEMA public TO vextrus;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO vextrus;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vextrus;

COMMENT ON FUNCTION get_current_tenant_id() IS 'Returns the current tenant ID from session context';
COMMENT ON FUNCTION set_tenant_context(UUID, UUID) IS 'Sets the tenant and user context for RLS policies';
COMMENT ON TABLE organizations IS 'Master table for organizations (tenants)';
COMMENT ON TABLE divisions IS 'Divisions within organizations for large enterprises';
COMMENT ON TABLE projects IS 'Construction/Real-estate projects with tenant isolation';
COMMENT ON TABLE sites IS 'Physical sites within projects';