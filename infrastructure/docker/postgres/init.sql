-- PostgreSQL Initialization Script for Vextrus ERP
-- Creates all required databases for microservices architecture
-- Date: 2025-01-20
-- Updated to include all 18+ services

-- Create databases for each service
CREATE DATABASE vextrus_dev;
CREATE DATABASE vextrus_erp;
CREATE DATABASE vextrus_auth;
CREATE DATABASE vextrus_master_data;
CREATE DATABASE vextrus_workflow;
CREATE DATABASE vextrus_rules_engine;
CREATE DATABASE vextrus_notification;
CREATE DATABASE vextrus_audit;
CREATE DATABASE vextrus_configuration;
CREATE DATABASE vextrus_scheduler;
CREATE DATABASE vextrus_document_generator;
CREATE DATABASE vextrus_import_export;
CREATE DATABASE vextrus_file_storage;
CREATE DATABASE vextrus_crm;
CREATE DATABASE vextrus_finance;
CREATE DATABASE vextrus_hr;
CREATE DATABASE vextrus_organization;
CREATE DATABASE vextrus_project;
CREATE DATABASE vextrus_scm;

-- Grant all privileges to vextrus user
GRANT ALL PRIVILEGES ON DATABASE vextrus_dev TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_erp TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_auth TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_master_data TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_workflow TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_rules_engine TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_notification TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_audit TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_configuration TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_scheduler TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_document_generator TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_import_export TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_file_storage TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_crm TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_finance TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_hr TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_organization TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_project TO vextrus;
GRANT ALL PRIVILEGES ON DATABASE vextrus_scm TO vextrus;

-- Enable necessary extensions on each database
\c vextrus_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_erp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_master_data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_workflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_rules_engine
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_notification
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_audit
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_configuration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_scheduler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_document_generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_import_export
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_file_storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_crm
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_finance
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_hr
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_organization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_project
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c vextrus_scm
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for each service database
\c vextrus_auth
CREATE SCHEMA IF NOT EXISTS auth;
GRANT ALL ON SCHEMA auth TO vextrus;

\c vextrus_master_data
CREATE SCHEMA IF NOT EXISTS master_data;
GRANT ALL ON SCHEMA master_data TO vextrus;

\c vextrus_workflow
CREATE SCHEMA IF NOT EXISTS workflow;
GRANT ALL ON SCHEMA workflow TO vextrus;

\c vextrus_rules_engine
CREATE SCHEMA IF NOT EXISTS rules_engine;
GRANT ALL ON SCHEMA rules_engine TO vextrus;

\c vextrus_notification
CREATE SCHEMA IF NOT EXISTS notification;
GRANT ALL ON SCHEMA notification TO vextrus;

\c vextrus_audit
CREATE SCHEMA IF NOT EXISTS audit;
GRANT ALL ON SCHEMA audit TO vextrus;

\c vextrus_finance
CREATE SCHEMA IF NOT EXISTS finance;
GRANT ALL ON SCHEMA finance TO vextrus;

\c vextrus_hr
CREATE SCHEMA IF NOT EXISTS hr;
GRANT ALL ON SCHEMA hr TO vextrus;

\c vextrus_scm
CREATE SCHEMA IF NOT EXISTS scm;
GRANT ALL ON SCHEMA scm TO vextrus;

\c vextrus_crm
CREATE SCHEMA IF NOT EXISTS crm;
GRANT ALL ON SCHEMA crm TO vextrus;

\c vextrus_organization
CREATE SCHEMA IF NOT EXISTS organization;
GRANT ALL ON SCHEMA organization TO vextrus;

\c vextrus_project
CREATE SCHEMA IF NOT EXISTS project;
GRANT ALL ON SCHEMA project TO vextrus;

\c vextrus_configuration
CREATE SCHEMA IF NOT EXISTS configuration;
GRANT ALL ON SCHEMA configuration TO vextrus;

\c vextrus_scheduler
CREATE SCHEMA IF NOT EXISTS scheduler;
GRANT ALL ON SCHEMA scheduler TO vextrus;

\c vextrus_document_generator
CREATE SCHEMA IF NOT EXISTS document_generator;
GRANT ALL ON SCHEMA document_generator TO vextrus;

\c vextrus_import_export
CREATE SCHEMA IF NOT EXISTS import_export;
GRANT ALL ON SCHEMA import_export TO vextrus;

\c vextrus_file_storage
CREATE SCHEMA IF NOT EXISTS file_storage;
GRANT ALL ON SCHEMA file_storage TO vextrus;

-- Add comments for documentation
COMMENT ON DATABASE vextrus_dev IS 'Development database for all services';
COMMENT ON DATABASE vextrus_erp IS 'Main ERP database';
COMMENT ON DATABASE vextrus_auth IS 'Authentication and authorization service database';
COMMENT ON DATABASE vextrus_master_data IS 'Master data management service database';
COMMENT ON DATABASE vextrus_workflow IS 'Workflow engine service database';
COMMENT ON DATABASE vextrus_rules_engine IS 'Business rules engine service database';
COMMENT ON DATABASE vextrus_notification IS 'Notification service database';
COMMENT ON DATABASE vextrus_audit IS 'Audit logging service database';
COMMENT ON DATABASE vextrus_configuration IS 'Configuration management service database';
COMMENT ON DATABASE vextrus_scheduler IS 'Job scheduling service database';
COMMENT ON DATABASE vextrus_document_generator IS 'Document generation service database';
COMMENT ON DATABASE vextrus_import_export IS 'Import/Export service database';
COMMENT ON DATABASE vextrus_file_storage IS 'File storage service database';
COMMENT ON DATABASE vextrus_crm IS 'Customer Relationship Management database';
COMMENT ON DATABASE vextrus_finance IS 'Financial management database';
COMMENT ON DATABASE vextrus_hr IS 'Human Resources management database';
COMMENT ON DATABASE vextrus_organization IS 'Organization structure database';
COMMENT ON DATABASE vextrus_project IS 'Project management database';
COMMENT ON DATABASE vextrus_scm IS 'Supply Chain Management database';

-- Verify creation
SELECT datname FROM pg_database WHERE datname LIKE 'vextrus%' ORDER BY datname;