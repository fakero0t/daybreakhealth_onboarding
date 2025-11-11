-- PR 8: Supporting Tables, Views, and Cross-Table Constraints
-- Description: Create documents table, users view, and add remaining foreign key constraints
-- Dependencies: PR 2 (core user tables), PR 4 (insurance tables), PR 6 (referrals), PR 7 (memberships)
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/008_create_supporting_tables_views_constraints.sql

-- ============================================================================
-- STEP 1: Create documents Table
-- ============================================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    label VARCHAR(255) NOT NULL, -- privacy_policy, informed_consent, etc.
    checkboxes TEXT[],
    version_date DATE,
    urls JSONB, -- {eng: "url", spa: "url"}
    names JSONB, -- {eng: "name", spa: "name"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create Indexes for documents
-- ============================================================================

-- Index on label for document lookups
CREATE INDEX idx_documents_label ON documents(label);

-- Index on version for version queries
CREATE INDEX idx_documents_version ON documents(version);

-- ============================================================================
-- STEP 3: Create users View
-- ============================================================================

-- Optional view for unified user queries across patients_and_guardians and clinicians
CREATE VIEW users AS
SELECT 
    id, role, email, phone, first_name, preferred_name, middle_name, last_name,
    title, preferred_language, preferred_pronoun, self_gender, legal_gender,
    birthdate, profile_data, supervisor_id, clinical_associate, licenses,
    licensed_states, care_provider_status, system_labels, supabase_id,
    supabase_metadata, address, healthie_id, openpm_reference_id,
    account_status, openpm_policyholder_id, zendesk_id, latest_ticket,
    created_at, updated_at, _fivetran_deleted, _fivetran_synced,
    1 as user_type -- 1=patient/guardian
FROM patients_and_guardians
UNION ALL
SELECT 
    id, 2 as role, email, phone, first_name, preferred_name, NULL as middle_name, last_name,
    title, preferred_language, preferred_pronoun, NULL as self_gender, legal_gender,
    birthdate, profile_data, supervisor_id, clinical_associate, licenses,
    licensed_states, care_provider_status, system_labels, NULL as supabase_id,
    NULL as supabase_metadata, address, healthie_id, NULL as openpm_reference_id,
    account_status, NULL as openpm_policyholder_id, NULL as zendesk_id, NULL as latest_ticket,
    created_at, updated_at, _fivetran_deleted, _fivetran_synced,
    2 as user_type -- 2=clinician
FROM clinicians;

-- ============================================================================
-- STEP 4: Add Cross-Table Foreign Key Constraints
-- ============================================================================

-- Self-referential foreign key for clinicians.supervisor_id
ALTER TABLE clinicians ADD CONSTRAINT fk_clinicians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);

-- Cross-table foreign key: patients_and_guardians.supervisor_id → clinicians.id
ALTER TABLE patients_and_guardians ADD CONSTRAINT fk_patients_guardians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);

-- Cross-table foreign key: referrals.care_provider_id → clinicians.id
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_care_provider 
    FOREIGN KEY (care_provider_id) REFERENCES clinicians(id);

-- Cross-table foreign key: clinician_insurance_affiliations.care_provider_profile_id → clinicians.id
ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_clinician 
    FOREIGN KEY (care_provider_profile_id) REFERENCES clinicians(id);

-- ============================================================================
-- STEP 5: Grant Table and View Permissions
-- ============================================================================

-- Grant permissions on documents table
GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO daybreak_app;
GRANT SELECT ON documents TO daybreak_readonly;
GRANT ALL PRIVILEGES ON documents TO daybreak_admin;

-- Grant permissions on users view
GRANT SELECT ON users TO daybreak_app, daybreak_readonly, daybreak_admin;

-- ============================================================================
-- STEP 6: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('008_create_supporting_tables_views_constraints', 'Create supporting tables (documents), users view, and cross-table foreign key constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify documents table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'documents';

-- Verify indexes on documents:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename = 'documents' 
-- ORDER BY indexname;

-- Verify users view exists:
-- SELECT table_name, table_type FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'users';

-- Verify all foreign keys were added:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname IN (
--     'fk_clinicians_supervisor',
--     'fk_patients_guardians_supervisor',
--     'fk_referrals_care_provider',
--     'fk_clin_ins_aff_clinician'
-- )
-- ORDER BY conname;

-- Test insert into documents:
-- INSERT INTO documents (label, version, urls, names)
-- VALUES (
--     'privacy_policy',
--     1,
--     '{"eng": "https://example.com/privacy-en", "spa": "https://example.com/privacy-es"}'::JSONB,
--     '{"eng": "Privacy Policy", "spa": "Política de Privacidad"}'::JSONB
-- )
-- RETURNING id, label, version, urls, names;

-- Test users view:
-- SELECT id, role, email, first_name, last_name, user_type FROM users LIMIT 5;

-- Test self-referential FK on clinicians:
-- INSERT INTO clinicians (email, first_name, last_name, supervisor_id)
-- VALUES (
--     'supervisor@example.com',
--     'Supervisor',
--     'Clinician',
--     NULL
-- )
-- RETURNING id, email, supervisor_id;
--
-- INSERT INTO clinicians (email, first_name, last_name, supervisor_id)
-- VALUES (
--     'supervised@example.com',
--     'Supervised',
--     'Clinician',
--     (SELECT id FROM clinicians WHERE email = 'supervisor@example.com' LIMIT 1)
-- )
-- RETURNING id, email, supervisor_id;

-- Test cross-table FK: patients_and_guardians.supervisor_id → clinicians.id
-- INSERT INTO patients_and_guardians (role, email, first_name, last_name, supervisor_id)
-- VALUES (
--     1,
--     'patient@example.com',
--     'Patient',
--     'User',
--     (SELECT id FROM clinicians LIMIT 1)
-- )
-- RETURNING id, email, supervisor_id;

-- Test invalid FK (should fail):
-- INSERT INTO patients_and_guardians (role, email, first_name, last_name, supervisor_id)
-- VALUES (
--     1,
--     'invalid@example.com',
--     'Invalid',
--     'User',
--     '00000000-0000-0000-0000-000000000000'::UUID
-- );
-- -- Expected: ERROR: insert or update on table "patients_and_guardians" violates foreign key constraint

