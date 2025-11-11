-- Data Validation Script
-- Description: Comprehensive validation queries to check data integrity after import
-- Usage: psql -U <username> -d daybreak_health -f scripts/validation/validate_data.sql

\echo '========================================'
\echo 'Data Validation Report'
\echo '========================================'
\echo ''

-- ============================================================================
-- ORPHANED RECORDS CHECKS
-- ============================================================================

\echo 'Checking for orphaned records...'
\echo ''

-- Orphaned kinships (user_0_id or user_1_id don't exist in patients_and_guardians or clinicians)
SELECT 
    'kinships' as table_name,
    COUNT(*) as orphaned_count
FROM kinships k
WHERE NOT EXISTS (
    SELECT 1 FROM patients_and_guardians p WHERE p.id = k.user_0_id
    UNION
    SELECT 1 FROM clinicians c WHERE c.id = k.user_0_id
)
OR NOT EXISTS (
    SELECT 1 FROM patients_and_guardians p WHERE p.id = k.user_1_id
    UNION
    SELECT 1 FROM clinicians c WHERE c.id = k.user_1_id
);

-- Orphaned questionnaires
SELECT 
    'questionnaires' as table_name,
    COUNT(*) as orphaned_count
FROM questionnaires q
WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = q.subject_id)
OR (
    NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = q.respondent_id)
    AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.id = q.respondent_id)
);

-- Orphaned referrals
SELECT 
    'referrals' as table_name,
    COUNT(*) as orphaned_count
FROM referrals r
WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = r.submitter_id)
OR NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = r.organization_id)
OR NOT EXISTS (SELECT 1 FROM contracts c WHERE c.id = r.contract_id);

-- Orphaned referral_members
SELECT 
    'referral_members' as table_name,
    COUNT(*) as orphaned_count
FROM referral_members rm
WHERE NOT EXISTS (SELECT 1 FROM referrals r WHERE r.id = rm.referral_id)
OR NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = rm.user_id);

-- Orphaned insurance_coverages
SELECT 
    'insurance_coverages' as table_name,
    COUNT(*) as orphaned_count
FROM insurance_coverages ic
WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = ic.user_id);

-- Orphaned memberships
SELECT 
    'memberships' as table_name,
    COUNT(*) as orphaned_count
FROM memberships m
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = m.organization_id)
OR (
    NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = m.user_id)
    AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.id = m.user_id)
);

-- Orphaned patient_availabilities
SELECT 
    'patient_availabilities' as table_name,
    COUNT(*) as orphaned_count
FROM patient_availabilities pa
WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = pa.user_id);

-- Orphaned org_contracts
SELECT 
    'org_contracts' as table_name,
    COUNT(*) as orphaned_count
FROM org_contracts oc
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = oc.organization_id)
OR NOT EXISTS (SELECT 1 FROM contracts c WHERE c.id = oc.contract_id);

\echo ''
\echo '========================================'
\echo 'INVALID ENUM VALUES CHECKS'
\echo '========================================'
\echo ''

-- Check for invalid enum values
SELECT 'kinships' as table_name, COUNT(*) as invalid_count 
FROM kinships
WHERE user_0_label NOT IN (1, 2, 12) OR user_1_label NOT IN (1, 2, 12)

UNION ALL

SELECT 'questionnaires', COUNT(*) 
FROM questionnaires 
WHERE type NOT IN (3, 4)

UNION ALL

SELECT 'insurance_coverages_kind', COUNT(*) 
FROM insurance_coverages 
WHERE kind NOT IN (0, 2)

UNION ALL

SELECT 'insurance_coverages_eligibility', COUNT(*) 
FROM insurance_coverages 
WHERE eligibility NOT IN (0, 2, 4, 6)

UNION ALL

SELECT 'referrals_service_kind', COUNT(*) 
FROM referrals 
WHERE service_kind NOT IN (1, 2, 3)

UNION ALL

SELECT 'organizations_kind', COUNT(*) 
FROM organizations 
WHERE kind NOT IN (1, 2);

\echo ''
\echo '========================================'
\echo 'NULL REQUIRED FIELDS CHECKS'
\echo '========================================'
\echo ''

-- Check for NULL required fields
SELECT 'patients_and_guardians' as table_name, COUNT(*) as null_count 
FROM patients_and_guardians 
WHERE role IS NULL

UNION ALL

SELECT 'kinships', COUNT(*) 
FROM kinships 
WHERE user_0_id IS NULL OR user_1_id IS NULL OR kind IS NULL

UNION ALL

SELECT 'questionnaires', COUNT(*) 
FROM questionnaires 
WHERE subject_id IS NULL OR respondent_id IS NULL OR type IS NULL

UNION ALL

SELECT 'referrals', COUNT(*) 
FROM referrals 
WHERE submitter_id IS NULL OR organization_id IS NULL OR contract_id IS NULL OR service_kind IS NULL

UNION ALL

SELECT 'insurance_coverages', COUNT(*) 
FROM insurance_coverages 
WHERE user_id IS NULL OR kind IS NULL

UNION ALL

SELECT 'referral_members', COUNT(*) 
FROM referral_members 
WHERE referral_id IS NULL OR user_id IS NULL

UNION ALL

SELECT 'memberships', COUNT(*) 
FROM memberships 
WHERE user_id IS NULL OR organization_id IS NULL

UNION ALL

SELECT 'patient_availabilities', COUNT(*) 
FROM patient_availabilities 
WHERE user_id IS NULL OR availability IS NULL

UNION ALL

SELECT 'organizations', COUNT(*) 
FROM organizations 
WHERE kind IS NULL OR name IS NULL

UNION ALL

SELECT 'contracts', COUNT(*) 
FROM contracts 
WHERE effective_date IS NULL OR services IS NULL OR terms IS NULL;

\echo ''
\echo '========================================'
\echo 'JSONB VALIDATION CHECKS'
\echo '========================================'
\echo ''

-- Validate JSONB structure
SELECT 
    'patients_and_guardians.profile_data' as column_name,
    COUNT(*) as invalid_count
FROM patients_and_guardians
WHERE profile_data IS NOT NULL AND jsonb_typeof(profile_data) != 'object'

UNION ALL

SELECT 'patients_and_guardians.address', COUNT(*)
FROM patients_and_guardians
WHERE address IS NOT NULL AND jsonb_typeof(address) != 'object'

UNION ALL

SELECT 'questionnaires.question_answers', COUNT(*)
FROM questionnaires
WHERE question_answers IS NOT NULL AND jsonb_typeof(question_answers) != 'object'

UNION ALL

SELECT 'patient_availabilities.availability', COUNT(*)
FROM patient_availabilities
WHERE availability IS NOT NULL AND jsonb_typeof(availability) != 'array';

\echo ''
\echo '========================================'
\echo 'DATE STANDARDIZATION CHECKS'
\echo '========================================'
\echo ''

-- Verify all timestamps are TIMESTAMPTZ (should all be 0 if standardized correctly)
SELECT 
    'created_at columns' as check_type,
    COUNT(*) as non_timestamptz_count
FROM (
    SELECT created_at::text FROM patients_and_guardians
    UNION ALL
    SELECT created_at::text FROM clinicians
    UNION ALL
    SELECT created_at::text FROM referrals
) all_dates
WHERE created_at::text NOT LIKE '%+%' AND created_at::text NOT LIKE '%-%:%';

\echo ''
\echo '========================================'
\echo 'MARKET_ID VALIDATION'
\echo '========================================'
\echo ''

-- Verify market_id is set to 1 where applicable
SELECT 
    'referrals' as table_name,
    COUNT(*) as incorrect_market_id_count
FROM referrals
WHERE market_id != '00000000-0000-0000-0000-000000000001'::UUID

UNION ALL

SELECT 'organizations', COUNT(*)
FROM organizations
WHERE market_id != '00000000-0000-0000-0000-000000000001'::UUID;

\echo ''
\echo '========================================'
\echo 'DATA SUMMARY'
\echo '========================================'
\echo ''

-- Record counts by table
SELECT 'patients_and_guardians' as table_name, COUNT(*) as record_count FROM patients_and_guardians WHERE _fivetran_deleted = false
UNION ALL
SELECT 'clinicians', COUNT(*) FROM clinicians WHERE _fivetran_deleted = false
UNION ALL
SELECT 'kinships', COUNT(*) FROM kinships WHERE _fivetran_deleted = false
UNION ALL
SELECT 'questionnaires', COUNT(*) FROM questionnaires WHERE _fivetran_deleted = false
UNION ALL
SELECT 'clinician_credentialed_insurances', COUNT(*) FROM clinician_credentialed_insurances WHERE _fivetran_deleted = false
UNION ALL
SELECT 'insurance_coverages', COUNT(*) FROM insurance_coverages WHERE _fivetran_deleted = false
UNION ALL
SELECT 'referrals', COUNT(*) FROM referrals WHERE _fivetran_deleted = false
UNION ALL
SELECT 'referral_members', COUNT(*) FROM referral_members WHERE _fivetran_deleted = false
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations WHERE _fivetran_deleted = false
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts WHERE _fivetran_deleted = false
UNION ALL
SELECT 'org_contracts', COUNT(*) FROM org_contracts
UNION ALL
SELECT 'memberships', COUNT(*) FROM memberships WHERE _fivetran_deleted = false
UNION ALL
SELECT 'patient_availabilities', COUNT(*) FROM patient_availabilities WHERE _fivetran_deleted = false
UNION ALL
SELECT 'clinician_availabilities', COUNT(*) FROM clinician_availabilities WHERE deleted_at IS NULL
UNION ALL
SELECT 'clinician_insurance_affiliations', COUNT(*) FROM clinician_insurance_affiliations WHERE _fivetran_deleted = false
UNION ALL
SELECT 'documents', COUNT(*) FROM documents WHERE _fivetran_deleted = false
ORDER BY table_name;

\echo ''
\echo '========================================'
\echo 'Validation Complete'
\echo '========================================'
\echo ''
\echo 'Review the results above. All counts should be 0 for:'
\echo '  - Orphaned records'
\echo '  - Invalid enum values'
\echo '  - NULL required fields'
\echo '  - Invalid JSONB structures'
\echo '  - Incorrect market_id values'
\echo ''

