-- PR 4: Insurance Tables
-- Description: Create tables for insurance companies and patient insurance coverage
-- Dependencies: PR 2 (core user tables)
--
-- IMPORTANT: The user_id and created_by in insurance_coverages can reference
-- either patients_and_guardians or clinicians. These are validated at the
-- application level since PostgreSQL doesn't support foreign keys to multiple tables.
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/004_create_insurance_tables.sql
--
-- NOTE: This script will drop existing tables if they exist, allowing it to be run multiple times.

-- ============================================================================
-- STEP 0: Drop Existing Objects (if they exist)
-- ============================================================================

-- Drop tables (CASCADE will drop dependent indexes, constraints, triggers, etc.)
DROP TABLE IF EXISTS insurance_coverages CASCADE;
DROP TABLE IF EXISTS clinician_credentialed_insurances CASCADE;

-- ============================================================================
-- STEP 1: Create clinician_credentialed_insurances Table
-- ============================================================================

CREATE TABLE clinician_credentialed_insurances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(10) DEFAULT 'US',
    state VARCHAR(10),
    line_of_business INTEGER,
    legacy_names TEXT[],
    network_status INTEGER DEFAULT 0,
    associates_allowed INTEGER DEFAULT 0,
    legacy_id VARCHAR(255),
    parent_credentialed_insurance_id UUID, -- self-referential FK added below
    open_pm_name VARCHAR(255),
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create insurance_coverages Table
-- ============================================================================

CREATE TABLE insurance_coverages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(255),
    group_id VARCHAR(255),
    front_card_url TEXT,
    back_card_url TEXT,
    plan_holder_first_name VARCHAR(255),
    plan_holder_last_name VARCHAR(255),
    plan_holder_dob DATE,
    plan_holder_country VARCHAR(10) DEFAULT 'US',
    plan_holder_state VARCHAR(10),
    plan_holder_city VARCHAR(255),
    plan_holder_street_address VARCHAR(255),
    plan_holder_zip_code VARCHAR(20),
    plan_holder_legal_gender INTEGER,
    created_by UUID, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    level INTEGER DEFAULT 1,
    insurance_company_name VARCHAR(255),
    kind INTEGER NOT NULL, -- 0=non-insurance, 2=insurance
    system_labels TEXT[], -- ['in_network', 'expired', 'submitted', 'out_of_network']
    eligibility INTEGER DEFAULT 0, -- 0=unknown, 2=submitted, 4=eligible, 6=expired
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    genesis INTEGER DEFAULT 0,
    migration_details JSONB,
    profile_data JSONB,
    openpm_insurance_organization_id VARCHAR(255),
    openpm_coverage_id VARCHAR(255),
    openpm_insurance_organization_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 3: Create Indexes for clinician_credentialed_insurances
-- ============================================================================

-- Index on name for insurance company lookups
CREATE INDEX idx_clin_cred_insurances_name ON clinician_credentialed_insurances(name);

-- Index on state for filtering by state
CREATE INDEX idx_clin_cred_insurances_state ON clinician_credentialed_insurances(state);

-- ============================================================================
-- STEP 4: Create Indexes for insurance_coverages
-- ============================================================================

-- Index on user_id for finding coverages by user
CREATE INDEX idx_insurance_coverages_user ON insurance_coverages(user_id);

-- Index on eligibility for filtering by eligibility status
CREATE INDEX idx_insurance_coverages_eligibility ON insurance_coverages(eligibility);

-- GIN index on system_labels array for array operations
CREATE INDEX idx_insurance_coverages_labels ON insurance_coverages USING GIN(system_labels);

-- Index on created_by for tracking who created the coverage
CREATE INDEX idx_insurance_coverages_created_by ON insurance_coverages(created_by);

-- Index on insurance_company_name for lookups by company
CREATE INDEX idx_insurance_coverages_company_name ON insurance_coverages(insurance_company_name);

-- ============================================================================
-- STEP 5: Add CHECK Constraints
-- ============================================================================

-- CHECK constraint for insurance_coverages.kind: 0=non-insurance, 2=insurance
ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_kind 
    CHECK (kind IN (0, 2));

-- CHECK constraint for insurance_coverages.eligibility: 0=unknown, 2=submitted, 4=eligible, 6=expired
ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_eligibility 
    CHECK (eligibility IN (0, 2, 4, 6));

-- ============================================================================
-- STEP 6: Add Self-Referential Foreign Key
-- ============================================================================

-- Self-referential foreign key for parent insurance companies
ALTER TABLE clinician_credentialed_insurances ADD CONSTRAINT fk_parent_insurance 
    FOREIGN KEY (parent_credentialed_insurance_id) 
    REFERENCES clinician_credentialed_insurances(id);

-- ============================================================================
-- STEP 7: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'daybreak_app') THEN
GRANT SELECT, INSERT, UPDATE, DELETE ON clinician_credentialed_insurances, insurance_coverages TO daybreak_app;
    END IF;

    -- Grant read-only permissions (if role exists)
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'daybreak_readonly') THEN
GRANT SELECT ON clinician_credentialed_insurances, insurance_coverages TO daybreak_readonly;
    END IF;

    -- Grant all permissions to admin role (if role exists)
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'daybreak_admin') THEN
GRANT ALL PRIVILEGES ON clinician_credentialed_insurances, insurance_coverages TO daybreak_admin;
    END IF;
END $$;

-- ============================================================================
-- STEP 8: Record Migration
-- ============================================================================

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE schema_migrations ADD COLUMN description TEXT;
    END IF;
END $$;

-- Record this migration (handle both with and without description column)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_migrations' 
        AND column_name = 'description'
    ) THEN
        INSERT INTO schema_migrations (version, description)
        VALUES ('004_create_insurance_tables', 'Create insurance tables (clinician_credentialed_insurances, insurance_coverages) with indexes, constraints, and self-referential FK')
        ON CONFLICT (version) DO NOTHING;
    ELSE
        INSERT INTO schema_migrations (version)
        VALUES ('004_create_insurance_tables')
        ON CONFLICT (version) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('clinician_credentialed_insurances', 'insurance_coverages');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('clinician_credentialed_insurances', 'insurance_coverages') 
-- ORDER BY tablename, indexname;

-- Verify GIN index on system_labels:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'insurance_coverages' AND indexdef LIKE '%GIN%';

-- Verify CHECK constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('clinician_credentialed_insurances', 'insurance_coverages') 
-- AND contype = 'c';

-- Verify self-referential foreign key:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'clinician_credentialed_insurances' 
-- AND contype = 'f' AND conname = 'fk_parent_insurance';

-- Test insert with valid enum values:
-- INSERT INTO clinician_credentialed_insurances (name, country, state)
-- VALUES ('Test Insurance Company', 'US', 'CA')
-- RETURNING id, created_at;
--
-- INSERT INTO insurance_coverages (user_id, kind, eligibility, insurance_company_name)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     2, -- insurance
--     4, -- eligible
--     'Test Insurance Company'
-- ) RETURNING id, created_at;

-- Test self-referential FK (requires existing parent insurance):
-- INSERT INTO clinician_credentialed_insurances (name, parent_credentialed_insurance_id)
-- VALUES ('Child Insurance Company', (SELECT id FROM clinician_credentialed_insurances WHERE name = 'Test Insurance Company' LIMIT 1))
-- RETURNING id, name, parent_credentialed_insurance_id;

-- Test invalid enum values (should fail):
-- INSERT INTO insurance_coverages (user_id, kind, eligibility, insurance_company_name)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     99, -- invalid kind value
--     4,
--     'Test Insurance'
-- );
-- -- Expected: ERROR: new row for relation "insurance_coverages" violates check constraint "chk_insurance_coverages_kind"
--
-- INSERT INTO insurance_coverages (user_id, kind, eligibility, insurance_company_name)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     2,
--     99, -- invalid eligibility value
--     'Test Insurance'
-- );
-- -- Expected: ERROR: new row for relation "insurance_coverages" violates check constraint "chk_insurance_coverages_eligibility"

-- Test GIN index on system_labels:
-- INSERT INTO insurance_coverages (user_id, kind, system_labels, insurance_company_name)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     2,
--     ARRAY['in_network', 'submitted']::TEXT[],
--     'Test Insurance'
-- );
--
-- -- Query using array contains (uses GIN index):
-- SELECT * FROM insurance_coverages WHERE 'in_network' = ANY(system_labels);

