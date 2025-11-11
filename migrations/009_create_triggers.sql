-- PR 9: Triggers and Functions
-- Description: Create trigger function and apply it to all tables with updated_at columns
-- Dependencies: PR 2, PR 3, PR 4, PR 5, PR 6, PR 7, PR 8 (all tables must exist)
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/009_create_triggers.sql

-- ============================================================================
-- STEP 1: Create Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- STEP 2: Create Triggers for All Tables with updated_at Column
-- ============================================================================

-- Trigger for patients_and_guardians
CREATE TRIGGER update_patients_guardians_updated_at 
    BEFORE UPDATE ON patients_and_guardians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for clinicians
CREATE TRIGGER update_clinicians_updated_at 
    BEFORE UPDATE ON clinicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for kinships
CREATE TRIGGER update_kinships_updated_at 
    BEFORE UPDATE ON kinships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for questionnaires
CREATE TRIGGER update_questionnaires_updated_at 
    BEFORE UPDATE ON questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for clinician_credentialed_insurances
CREATE TRIGGER update_clin_cred_insurances_updated_at 
    BEFORE UPDATE ON clinician_credentialed_insurances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for insurance_coverages
CREATE TRIGGER update_insurance_coverages_updated_at 
    BEFORE UPDATE ON insurance_coverages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referrals
CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referral_members
CREATE TRIGGER update_referral_members_updated_at 
    BEFORE UPDATE ON referral_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contracts
CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for org_contracts
CREATE TRIGGER update_org_contracts_updated_at 
    BEFORE UPDATE ON org_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for memberships
CREATE TRIGGER update_memberships_updated_at 
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for patient_availabilities
CREATE TRIGGER update_patient_availabilities_updated_at 
    BEFORE UPDATE ON patient_availabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for clinician_availabilities
CREATE TRIGGER update_clinician_availabilities_updated_at 
    BEFORE UPDATE ON clinician_availabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for clinician_insurance_affiliations
CREATE TRIGGER update_clin_ins_aff_updated_at 
    BEFORE UPDATE ON clinician_insurance_affiliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for documents
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 3: Grant Execute Permission on Function
-- ============================================================================

-- Grant execute permission to application role
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO daybreak_app;

-- ============================================================================
-- STEP 4: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('009_create_triggers', 'Create trigger function and apply updated_at triggers to all 16 tables')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_updated_at_column';

-- Verify all triggers exist:
-- SELECT tgname, tgrelid::regclass, tgenabled 
-- FROM pg_trigger 
-- WHERE tgname LIKE '%updated_at%' 
-- ORDER BY tgrelid::regclass::text;

-- Test trigger functionality:
-- -- Insert a test record
-- INSERT INTO patients_and_guardians (role, email, first_name, last_name)
-- VALUES (1, 'trigger_test@example.com', 'Test', 'User')
-- RETURNING id, created_at, updated_at;
--
-- -- Wait a moment, then update the record
-- UPDATE patients_and_guardians 
-- SET first_name = 'Updated'
-- WHERE email = 'trigger_test@example.com'
-- RETURNING id, created_at, updated_at;
--
-- -- Verify created_at didn't change but updated_at did
-- SELECT id, created_at, updated_at, first_name 
-- FROM patients_and_guardians 
-- WHERE email = 'trigger_test@example.com';
--
-- -- Clean up
-- DELETE FROM patients_and_guardians WHERE email = 'trigger_test@example.com';

-- Test with all tables (example for a few):
-- -- Test clinicians
-- INSERT INTO clinicians (email, first_name, last_name)
-- VALUES ('trigger_clinician@example.com', 'Test', 'Clinician')
-- RETURNING id, created_at, updated_at;
--
-- UPDATE clinicians SET first_name = 'Updated' WHERE email = 'trigger_clinician@example.com'
-- RETURNING id, created_at, updated_at;
--
-- DELETE FROM clinicians WHERE email = 'trigger_clinician@example.com';

-- Verify function permissions:
-- SELECT proname, proacl FROM pg_proc WHERE proname = 'update_updated_at_column';

