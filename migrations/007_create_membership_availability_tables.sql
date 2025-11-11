-- PR 7: Membership and Availability Tables
-- Description: Create tables for user memberships, availability, and clinician insurance affiliations
-- Dependencies: PR 2 (core user tables), PR 4 (insurance tables), PR 5 (organizations)
--
-- IMPORTANT: 
-- - user_id in memberships and patient_availabilities can reference either 
--   patients_and_guardians or clinicians (validated at application level)
-- - clinician_availabilities.user_id is INTEGER and references clinicians.healthie_id, 
--   NOT clinicians.id (legacy design from parquet export)
-- - care_provider_profile_id FK will be added in PR 8
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/007_create_membership_availability_tables.sql

-- ============================================================================
-- STEP 1: Create memberships Table
-- ============================================================================

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    organization_id UUID NOT NULL, -- FK added below
    profile_data JSONB DEFAULT '{}',
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_id, organization_id)
);

-- ============================================================================
-- STEP 2: Create patient_availabilities Table
-- ============================================================================

CREATE TABLE patient_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    availability JSONB NOT NULL, -- [{day: "Monday", time_blocks: [{start: "08:00:00", duration: 60}]}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 3: Create clinician_availabilities Table
-- ============================================================================

-- Note: This table uses INTEGER for id and user_id (legacy from parquet export)
-- user_id references clinicians.healthie_id, NOT clinicians.id
CREATE TABLE clinician_availabilities (
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
-- STEP 4: Create clinician_insurance_affiliations Table
-- ============================================================================

CREATE TABLE clinician_insurance_affiliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_provider_profile_id UUID NOT NULL, -- references clinicians(id) - FK added in PR 8
    credentialed_insurance_id UUID NOT NULL, -- FK added below
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(care_provider_profile_id, credentialed_insurance_id)
);

-- ============================================================================
-- STEP 5: Create Indexes for memberships
-- ============================================================================

-- Index on user_id for finding memberships by user
CREATE INDEX idx_memberships_user ON memberships(user_id);

-- Index on organization_id for finding memberships by organization
CREATE INDEX idx_memberships_org ON memberships(organization_id);

-- ============================================================================
-- STEP 6: Create Indexes for patient_availabilities
-- ============================================================================

-- Index on user_id for finding availability by user
CREATE INDEX idx_patient_avail_user ON patient_availabilities(user_id);

-- GIN index on availability JSONB for efficient JSON queries
CREATE INDEX idx_patient_avail_availability ON patient_availabilities USING GIN(availability);

-- ============================================================================
-- STEP 7: Create Indexes for clinician_availabilities
-- ============================================================================

-- Index on user_id for finding availability by clinician (healthie_id)
CREATE INDEX idx_clinician_avail_user ON clinician_availabilities(user_id);

-- Composite index on date range for time-based queries
CREATE INDEX idx_clinician_avail_range ON clinician_availabilities(range_start, range_end);

-- ============================================================================
-- STEP 8: Create Indexes for clinician_insurance_affiliations
-- ============================================================================

-- Index on care_provider_profile_id for finding insurances by clinician
CREATE INDEX idx_clin_ins_aff_clinician ON clinician_insurance_affiliations(care_provider_profile_id);

-- Index on credentialed_insurance_id for finding clinicians by insurance
CREATE INDEX idx_clin_ins_aff_insurance ON clinician_insurance_affiliations(credentialed_insurance_id);

-- ============================================================================
-- STEP 9: Add UNIQUE Constraints
-- ============================================================================

-- UNIQUE constraint already defined in table creation, but ensure it exists:
-- ALTER TABLE memberships ADD CONSTRAINT uk_memberships_user_org 
--     UNIQUE(user_id, organization_id);
-- (Already defined in CREATE TABLE)

-- ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT uk_clin_ins_aff 
--     UNIQUE(care_provider_profile_id, credentialed_insurance_id);
-- (Already defined in CREATE TABLE)

-- ============================================================================
-- STEP 10: Add Foreign Keys
-- ============================================================================

-- Foreign key from memberships to organizations
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Foreign key from clinician_insurance_affiliations to clinician_credentialed_insurances
ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_insurance 
    FOREIGN KEY (credentialed_insurance_id) REFERENCES clinician_credentialed_insurances(id);

-- Note: care_provider_profile_id FK will be added in PR 8

-- ============================================================================
-- STEP 11: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_admin;

-- ============================================================================
-- STEP 12: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('007_create_membership_availability_tables', 'Create membership and availability tables (memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations) with indexes and constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('memberships', 'patient_availabilities', 'clinician_availabilities', 'clinician_insurance_affiliations');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('memberships', 'patient_availabilities', 'clinician_availabilities', 'clinician_insurance_affiliations') 
-- ORDER BY tablename, indexname;

-- Verify GIN index on availability:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'patient_availabilities' AND indexdef LIKE '%GIN%';

-- Verify UNIQUE constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('memberships', 'clinician_insurance_affiliations') 
-- AND contype = 'u';

-- Verify foreign keys:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('memberships', 'clinician_insurance_affiliations') 
-- AND contype = 'f';

-- Test insert with valid data:
-- INSERT INTO memberships (user_id, organization_id)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM organizations LIMIT 1)
-- )
-- RETURNING id, user_id, organization_id;
--
-- INSERT INTO patient_availabilities (user_id, availability)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '[{"day": "Monday", "time_blocks": [{"start": "08:00:00", "duration": 60}]}]'::JSONB
-- )
-- RETURNING id, user_id, availability;
--
-- INSERT INTO clinician_availabilities (id, user_id, range_start, range_end, timezone)
-- VALUES (
--     1,
--     12345, -- healthie_id (INTEGER)
--     '2024-01-01 09:00:00'::TIMESTAMPTZ,
--     '2024-01-01 17:00:00'::TIMESTAMPTZ,
--     'America/Los_Angeles'
-- )
-- RETURNING id, user_id, range_start, range_end;
--
-- INSERT INTO clinician_insurance_affiliations (care_provider_profile_id, credentialed_insurance_id)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM clinician_credentialed_insurances LIMIT 1)
-- )
-- RETURNING id, care_provider_profile_id, credentialed_insurance_id;

-- Test UNIQUE constraint on memberships (should fail on duplicate):
-- INSERT INTO memberships (user_id, organization_id)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM organizations LIMIT 1)
-- );
-- -- Expected: ERROR: duplicate key value violates unique constraint

-- Test UNIQUE constraint on clinician_insurance_affiliations (should fail on duplicate):
-- INSERT INTO clinician_insurance_affiliations (care_provider_profile_id, credentialed_insurance_id)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM clinician_credentialed_insurances LIMIT 1)
-- );
-- -- Expected: ERROR: duplicate key value violates unique constraint

-- Test GIN index on availability JSONB:
-- SELECT * FROM patient_availabilities 
-- WHERE availability @> '[{"day": "Monday"}]'::JSONB;
--
-- -- Query using JSONB operators (uses GIN index):
-- SELECT * FROM patient_availabilities 
-- WHERE availability ? 'day';

