-- Minimal Migration: Create clinician_availabilities table only
-- Description: Creates only the clinician_availabilities table with indexes and permissions
-- Usage: psql -U <superuser> -d daybreak_health -f migrations/007_clinician_availabilities_only.sql

-- ============================================================================
-- STEP 1: Ensure Required Extensions Exist
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: Create Database Roles (if they don't exist)
-- ============================================================================

DO $$
BEGIN
    -- Create daybreak_app role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'daybreak_app') THEN
        CREATE ROLE daybreak_app WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
    
    -- Create daybreak_readonly role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'daybreak_readonly') THEN
        CREATE ROLE daybreak_readonly WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    END IF;
    
    -- Create daybreak_admin role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'daybreak_admin') THEN
        CREATE ROLE daybreak_admin WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION' SUPERUSER;
    END IF;
END $$;

-- Grant database permissions (safe to run multiple times)
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_app;
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_readonly;
GRANT ALL PRIVILEGES ON DATABASE daybreak_health TO daybreak_admin;

-- ============================================================================
-- STEP 3: Create Migration Tracking Table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

GRANT SELECT ON schema_migrations TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON schema_migrations TO daybreak_admin;

-- ============================================================================
-- STEP 4: Create clinician_availabilities table
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinician_availabilities (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL, -- references clinicians (healthie_id), not a direct FK
    range_start TIMESTAMPTZ NOT NULL,
    range_end TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
    is_repeating BOOLEAN DEFAULT false,
    contact_type_id INTEGER,
    appointment_location_id INTEGER,
    deleted_at TIMESTAMPTZ,
    end_on TIMESTAMPTZ,
    parent_organization_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    tx_commit_time TIMESTAMPTZ
);

-- ============================================================================
-- STEP 5: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinician_avail_user ON clinician_availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_clinician_avail_range ON clinician_availabilities(range_start, range_end);

-- ============================================================================
-- STEP 6: Grant permissions (safe to run multiple times)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON clinician_availabilities TO daybreak_app;
GRANT SELECT ON clinician_availabilities TO daybreak_readonly;
GRANT ALL PRIVILEGES ON clinician_availabilities TO daybreak_admin;

-- ============================================================================
-- STEP 7: Record migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('007_clinician_availabilities_only', 'Create clinician_availabilities table with indexes and permissions')
ON CONFLICT (version) DO NOTHING;

