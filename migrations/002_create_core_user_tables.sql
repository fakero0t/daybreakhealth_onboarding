-- PR 2: Core User Tables
-- Description: Create the two primary user tables with all columns, indexes, and basic constraints
-- Dependencies: PR 1 (database initialization and extensions)
--
-- IMPORTANT: This migration creates the core user tables. Foreign key constraints
-- for supervisor_id will be added in PR 8 (cross-table constraints).
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/002_create_core_user_tables.sql

-- ============================================================================
-- STEP 1: Create patients_and_guardians Table
-- ============================================================================

CREATE TABLE patients_and_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role INTEGER NOT NULL, -- 1=patient/guardian
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(255),
    preferred_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    latest_ticket VARCHAR(255),
    title VARCHAR(50),
    preferred_language VARCHAR(10), -- eng, spa, yue, cmn, por, vie
    preferred_pronoun VARCHAR(50),
    self_gender INTEGER,
    legal_gender INTEGER,
    birthdate DATE,
    profile_data JSONB DEFAULT '{}',
    supervisor_id UUID, -- references clinicians(id) - FK constraint added in PR 8
    clinical_associate BOOLEAN DEFAULT false,
    licenses TEXT[],
    licensed_states TEXT[],
    care_provider_status INTEGER DEFAULT 0,
    system_labels TEXT[], -- ['guardian', 'dependent', 'student', 'referred', 'enrolled']
    supabase_id UUID,
    supabase_metadata JSONB,
    migration_details JSONB,
    address JSONB, -- {city, state, zip_code, street_address_1, street_address_2}
    healthie_id VARCHAR(50),
    openpm_reference_id VARCHAR(50),
    account_status INTEGER DEFAULT 0,
    openpm_policyholder_id VARCHAR(50),
    zendesk_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create clinicians Table
-- ============================================================================

CREATE TABLE clinicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthie_id VARCHAR(50),
    account_status INTEGER,
    email VARCHAR(255),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    preferred_name VARCHAR(255),
    preferred_pronoun VARCHAR(50),
    title VARCHAR(50),
    address JSONB,
    phone VARCHAR(50),
    birthdate DATE,
    preferred_language VARCHAR(10),
    legal_gender INTEGER,
    care_provider_status INTEGER,
    clinical_associate BOOLEAN,
    supervisor_id UUID, -- references clinicians(id) - self-referential FK added in PR 8
    licensed_states TEXT[],
    care_languages TEXT[],
    care_provider_role INTEGER,
    licenses TEXT[],
    states_active TEXT[],
    profile_data JSONB,
    migration_details JSONB,
    migration_profile_data JSONB,
    system_labels TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    associate_supervisor_id UUID,
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
    -- Note: Many additional columns exist in CSV but are not included in core schema
    -- These can be stored in profile_data JSONB or added as needed
);

-- ============================================================================
-- STEP 3: Create Indexes for patients_and_guardians
-- ============================================================================

-- Index on email for lookups
CREATE INDEX idx_patients_guardians_email ON patients_and_guardians(email);

-- Index on role for filtering
CREATE INDEX idx_patients_guardians_role ON patients_and_guardians(role);

-- GIN index on system_labels array for array operations
CREATE INDEX idx_patients_guardians_system_labels ON patients_and_guardians USING GIN(system_labels);

-- Index on supabase_id for external system integration
CREATE INDEX idx_patients_guardians_supabase_id ON patients_and_guardians(supabase_id);

-- Index on supervisor_id for foreign key lookups (FK constraint added in PR 8)
CREATE INDEX idx_patients_guardians_supervisor ON patients_and_guardians(supervisor_id);

-- ============================================================================
-- STEP 4: Create Indexes for clinicians
-- ============================================================================

-- Index on email for lookups
CREATE INDEX idx_clinicians_email ON clinicians(email);

-- Index on healthie_id for external system integration
CREATE INDEX idx_clinicians_healthie_id ON clinicians(healthie_id);

-- GIN index on system_labels array for array operations
CREATE INDEX idx_clinicians_system_labels ON clinicians USING GIN(system_labels);

-- Index on supervisor_id for foreign key lookups (FK constraint added in PR 8)
CREATE INDEX idx_clinicians_supervisor ON clinicians(supervisor_id);

-- ============================================================================
-- STEP 5: Add CHECK Constraints
-- ============================================================================

-- Note: role only has value 1 (patient/guardian) currently, but CHECK constraint
-- allows for future expansion if needed
ALTER TABLE patients_and_guardians ADD CONSTRAINT chk_patients_guardians_role 
    CHECK (role = 1);

-- ============================================================================
-- STEP 6: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON patients_and_guardians, clinicians TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON patients_and_guardians, clinicians TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON patients_and_guardians, clinicians TO daybreak_admin;

-- Grant sequence permissions for UUID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO daybreak_admin;

-- ============================================================================
-- STEP 7: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('002_create_core_user_tables', 'Create core user tables (patients_and_guardians, clinicians) with indexes and permissions')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('patients_and_guardians', 'clinicians');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('patients_and_guardians', 'clinicians') 
-- ORDER BY tablename, indexname;

-- Verify GIN indexes:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename IN ('patients_and_guardians', 'clinicians') 
-- AND indexdef LIKE '%GIN%';

-- Test insert (remove after testing):
-- INSERT INTO patients_and_guardians (role, email, first_name, last_name) 
-- VALUES (1, 'test@example.com', 'Test', 'User') RETURNING id, created_at;
-- 
-- INSERT INTO clinicians (email, first_name, last_name) 
-- VALUES ('clinician@example.com', 'Test', 'Clinician') RETURNING id, created_at;
--
-- Verify UUID generation and defaults:
-- SELECT id, role, created_at, updated_at, _fivetran_deleted, profile_data 
-- FROM patients_and_guardians WHERE email = 'test@example.com';
--
-- Clean up test data:
-- DELETE FROM patients_and_guardians WHERE email = 'test@example.com';
-- DELETE FROM clinicians WHERE email = 'clinician@example.com';

