-- PR 1: Database Initialization and Extensions
-- Description: Set up the PostgreSQL database instance with all required extensions and initial configuration
-- 
-- IMPORTANT: This script should be run as a PostgreSQL superuser (typically 'postgres')
-- The database 'daybreak_health' must be created before running this script
--
-- Usage:
--   1. Connect to PostgreSQL as superuser: psql -U postgres
--   2. Create database: CREATE DATABASE daybreak_health;
--   3. Connect to new database: \c daybreak_health
--   4. Run this script: \i migrations/001_initialize_database.sql
--   5. Update passwords for roles before production use

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================

-- UUID generation (PostgreSQL 13+ uses gen_random_uuid(), but uuid-ossp provides uuid_generate_v4() for compatibility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Text search and pattern matching (for full-text search capabilities)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Cryptographic functions (for PII encryption)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: Create Database Roles
-- ============================================================================

-- Application role: Full read/write access for application operations
-- NOTE: Update password before production use
CREATE ROLE daybreak_app WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- Read-only role: For reporting, analytics, and read-only access
-- NOTE: Update password before production use
CREATE ROLE daybreak_readonly WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';

-- Admin role: Full superuser access for administrative tasks
-- NOTE: Update password before production use
CREATE ROLE daybreak_admin WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION' SUPERUSER;

-- ============================================================================
-- STEP 3: Grant Initial Database Permissions
-- ============================================================================

-- Grant connection permissions
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_app;
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_readonly;
GRANT ALL PRIVILEGES ON DATABASE daybreak_health TO daybreak_admin;

-- ============================================================================
-- STEP 4: Create Migration Tracking Table
-- ============================================================================

-- Track applied migrations for version control and rollback capabilities
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

-- Grant permissions on migration tracking table
GRANT SELECT ON schema_migrations TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON schema_migrations TO daybreak_admin;

-- Insert this migration record
INSERT INTO schema_migrations (version, description)
VALUES ('001_initialize_database', 'Initialize database with extensions, roles, and migration tracking')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify extensions are enabled:
-- SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pgcrypto');

-- Verify roles exist:
-- SELECT rolname, rolsuper, rolcanlogin FROM pg_roles WHERE rolname LIKE 'daybreak%';

-- Verify migration was recorded:
-- SELECT * FROM schema_migrations WHERE version = '001_initialize_database';

