-- PR 6: Referral Tables
-- Description: Create tables for care requests and referral tracking
-- Dependencies: PR 2 (core user tables), PR 3 (questionnaires), PR 5 (organizations, contracts)
--
-- IMPORTANT: The submitter_id in referrals and user_id in referral_members can reference
-- patients_and_guardians. The care_provider_id will have its FK added in PR 8.
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/006_create_referral_tables.sql

-- ============================================================================
-- STEP 1: Create referrals Table
-- ============================================================================

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    organization_id UUID NOT NULL, -- FK added below
    service_kind INTEGER NOT NULL, -- 1=individual, 2=family, 3=onsite
    concerns TEXT,
    data JSONB DEFAULT '{}',
    contract_id UUID NOT NULL, -- FK added below
    market_id UUID DEFAULT '00000000-0000-0000-0000-000000000001', -- Always set to 1
    terms_kind INTEGER DEFAULT 1,
    appointment_kind INTEGER,
    planned_sessions INTEGER DEFAULT 12,
    collect_coverage BOOLEAN DEFAULT true,
    allowed_coverage TEXT[], -- ['insurance', 'self_pay', 'none']
    collection_rule INTEGER DEFAULT 0,
    self_responsibility_required BOOLEAN DEFAULT true,
    care_provider_requirements TEXT[],
    referred_at TIMESTAMPTZ,
    ready_for_scheduling_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    system_labels TEXT[], -- ['referred', 'onboarding_completed', 'ready_for_scheduling', 'scheduled', 'enrolled', 'request_rejected']
    intake_id UUID, -- FK added below
    tzdb VARCHAR(100),
    onboarding_completed_at TIMESTAMPTZ,
    request_rejected_at TIMESTAMPTZ,
    notes JSONB, -- {request_rejected_cause: "Not Engaged"}
    enrolled_at TIMESTAMPTZ,
    disenrolled_at TIMESTAMPTZ,
    disenrollment_category INTEGER,
    excluded_at TIMESTAMPTZ,
    initial_scheduled_sessions INTEGER,
    care_provider_id UUID, -- references clinicians(id) - FK constraint added in PR 8
    zendesk_ticket_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create referral_members Table
-- ============================================================================

CREATE TABLE referral_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL, -- FK added below with ON DELETE CASCADE
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    role INTEGER DEFAULT 0, -- 0=patient
    data JSONB DEFAULT '{}', -- {grade: "GRADE_7"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(referral_id, user_id)
);

-- ============================================================================
-- STEP 3: Create Indexes for referrals
-- ============================================================================

-- Index on submitter_id for finding referrals by submitter
CREATE INDEX idx_referrals_submitter ON referrals(submitter_id);

-- Index on organization_id for finding referrals by organization
CREATE INDEX idx_referrals_organization ON referrals(organization_id);

-- Index on contract_id for finding referrals by contract
CREATE INDEX idx_referrals_contract ON referrals(contract_id);

-- GIN index on system_labels array for array operations
CREATE INDEX idx_referrals_status ON referrals USING GIN(system_labels);

-- Index on onboarding_completed_at for finding completed referrals by date
CREATE INDEX idx_referrals_onboarding_completed ON referrals(onboarding_completed_at);

-- ============================================================================
-- STEP 4: Create Indexes for referral_members
-- ============================================================================

-- Index on referral_id for finding members by referral
CREATE INDEX idx_referral_members_referral ON referral_members(referral_id);

-- Index on user_id for finding referrals by user
CREATE INDEX idx_referral_members_user ON referral_members(user_id);

-- ============================================================================
-- STEP 5: Add CHECK Constraints
-- ============================================================================

-- CHECK constraint for referrals.service_kind: 1=individual, 2=family, 3=onsite
ALTER TABLE referrals ADD CONSTRAINT chk_referrals_service_kind 
    CHECK (service_kind IN (1, 2, 3));

-- ============================================================================
-- STEP 6: Add Foreign Keys
-- ============================================================================

-- Foreign key from referrals to organizations
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Foreign key from referrals to contracts
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_contract 
    FOREIGN KEY (contract_id) REFERENCES contracts(id);

-- Foreign key from referrals to questionnaires (intake)
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_intake 
    FOREIGN KEY (intake_id) REFERENCES questionnaires(id);

-- Foreign key from referral_members to referrals with CASCADE delete
ALTER TABLE referral_members ADD CONSTRAINT fk_referral_members_referral 
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 7: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON referrals, referral_members TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON referrals, referral_members TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON referrals, referral_members TO daybreak_admin;

-- ============================================================================
-- STEP 8: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('006_create_referral_tables', 'Create referral tables (referrals, referral_members) with indexes, constraints, and foreign keys')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('referrals', 'referral_members');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('referrals', 'referral_members') 
-- ORDER BY tablename, indexname;

-- Verify GIN index on system_labels:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'referrals' AND indexdef LIKE '%GIN%';

-- Verify CHECK constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'referrals' 
-- AND contype = 'c';

-- Verify UNIQUE constraint on referral_members:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'referral_members' 
-- AND contype = 'u';

-- Verify foreign keys:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('referrals', 'referral_members') 
-- AND contype = 'f';

-- Test insert with valid enum values (requires existing org, contract, questionnaire):
-- INSERT INTO referrals (submitter_id, organization_id, contract_id, service_kind)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM organizations LIMIT 1),
--     (SELECT id FROM contracts LIMIT 1),
--     1 -- individual
-- )
-- RETURNING id, service_kind, market_id;

-- Test referral_members:
-- INSERT INTO referral_members (referral_id, user_id, role, data)
-- VALUES (
--     (SELECT id FROM referrals LIMIT 1),
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     0, -- patient
--     '{"grade": "GRADE_7"}'::JSONB
-- )
-- RETURNING id, referral_id, user_id, data;

-- Test invalid enum values (should fail):
-- INSERT INTO referrals (submitter_id, organization_id, contract_id, service_kind)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM organizations LIMIT 1),
--     (SELECT id FROM contracts LIMIT 1),
--     99 -- invalid service_kind
-- );
-- -- Expected: ERROR: new row for relation "referrals" violates check constraint "chk_referrals_service_kind"

-- Test UNIQUE constraint on referral_members (should fail on duplicate):
-- INSERT INTO referral_members (referral_id, user_id)
-- VALUES (
--     (SELECT id FROM referrals LIMIT 1),
--     '00000000-0000-0000-0000-000000000001'::UUID
-- );
-- -- Expected: ERROR: duplicate key value violates unique constraint

-- Test ON DELETE CASCADE:
-- DELETE FROM referrals WHERE id = (SELECT id FROM referrals LIMIT 1);
-- -- Verify referral_members are also deleted:
-- SELECT COUNT(*) FROM referral_members WHERE referral_id = <deleted_referral_id>;
-- -- Expected: 0

-- Test GIN index on system_labels:
-- INSERT INTO referrals (submitter_id, organization_id, contract_id, service_kind, system_labels)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     (SELECT id FROM organizations LIMIT 1),
--     (SELECT id FROM contracts LIMIT 1),
--     1,
--     ARRAY['referred', 'onboarding_completed']::TEXT[]
-- );
--
-- -- Query using array contains (uses GIN index):
-- SELECT * FROM referrals WHERE 'onboarding_completed' = ANY(system_labels);

