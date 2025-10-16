-- Audit Logging Infrastructure for Vextrus ERP
-- This migration creates comprehensive audit logging with tenant isolation

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Partitioning by month for better performance
    -- Indexes for common queries
    CONSTRAINT audit_logs_check_data CHECK (
        (operation = 'INSERT' AND new_data IS NOT NULL) OR
        (operation = 'UPDATE' AND new_data IS NOT NULL) OR
        (operation = 'DELETE' AND old_data IS NOT NULL)
    )
) PARTITION BY RANGE (created_at);

-- Create partitions for the next 12 months
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
        
        -- Check if partition exists before creating
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                partition_name,
                start_date,
                end_date
            );
            RAISE NOTICE 'Created partition: %', partition_name;
        END IF;
    END LOOP;
END $$;

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
DROP POLICY IF EXISTS tenant_isolation_select ON audit_logs;
CREATE POLICY tenant_isolation_select ON audit_logs
    FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

DROP POLICY IF EXISTS tenant_isolation_insert ON audit_logs;
CREATE POLICY tenant_isolation_insert ON audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_table_op 
    ON audit_logs(tenant_id, table_name, operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user_created 
    ON audit_logs(tenant_id, user_id, created_at DESC);

-- Create audit triggers for critical tables
CREATE OR REPLACE FUNCTION create_audit_trigger(target_table TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('
        CREATE TRIGGER audit_trigger_%s
        AFTER INSERT OR UPDATE OR DELETE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION audit_trigger_function()',
        target_table,
        target_table
    );
    RAISE NOTICE 'Created audit trigger for table: %', target_table;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Audit trigger already exists for table: %', target_table;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to core tables
DO $$
DECLARE
    tables_to_audit TEXT[] := ARRAY[
        'users',
        'organizations',
        'divisions',
        'projects',
        'sites'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_audit
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'public' 
                  AND information_schema.tables.table_name = table_name) THEN
            PERFORM create_audit_trigger(table_name);
        END IF;
    END LOOP;
END $$;

-- Create function to clean old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get audit history for a specific record
CREATE OR REPLACE FUNCTION get_audit_history(
    p_table_name TEXT,
    p_record_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    operation VARCHAR,
    user_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.operation,
        al.user_id,
        al.old_data,
        al.new_data,
        al.created_at
    FROM audit_logs al
    WHERE al.table_name = p_table_name
        AND al.record_id = p_record_id
        AND al.tenant_id = get_current_tenant_id()
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user activity audit
CREATE OR REPLACE FUNCTION get_user_activity_audit(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - INTERVAL '7 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    table_name VARCHAR,
    operation VARCHAR,
    record_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.table_name,
        al.operation,
        al.record_id,
        al.created_at
    FROM audit_logs al
    WHERE al.user_id = p_user_id
        AND al.tenant_id = get_current_tenant_id()
        AND al.created_at BETWEEN p_start_date AND p_end_date
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for audit statistics
CREATE OR REPLACE VIEW audit_statistics AS
SELECT 
    tenant_id,
    table_name,
    operation,
    DATE_TRUNC('day', created_at) as audit_date,
    COUNT(*) as operation_count,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY tenant_id, table_name, operation, DATE_TRUNC('day', created_at);

-- Grant permissions
GRANT SELECT ON audit_statistics TO vextrus;
GRANT EXECUTE ON FUNCTION get_audit_history(TEXT, UUID, INTEGER) TO vextrus;
GRANT EXECUTE ON FUNCTION get_user_activity_audit(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) TO vextrus;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit logging with tenant isolation and partitioning';
COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Removes audit logs older than specified retention days';
COMMENT ON FUNCTION get_audit_history(TEXT, UUID, INTEGER) IS 'Returns audit history for a specific record';
COMMENT ON FUNCTION get_user_activity_audit(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER) IS 'Returns activity audit for a specific user';
COMMENT ON VIEW audit_statistics IS 'Aggregated audit statistics for monitoring';