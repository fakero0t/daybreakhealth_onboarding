-- Import Script: patients_and_guardians
-- Description: Import patients_and_guardians_anonymized.csv into patients_and_guardians table
-- Dependencies: PR 2 (patients_and_guardians table must exist)
-- CSV File: Daybreak Health Test Cases/patients_and_guardians_anonymized.csv
--
-- Usage:
--   psql -U <username> -d daybreak_health -f scripts/import/import_patients_and_guardians.sql
--
-- Note: Update the CSV file path below if your files are in a different location

BEGIN;

-- ============================================================================
-- STEP 1: Create Staging Table
-- ============================================================================

CREATE TEMP TABLE patients_guardians_staging (LIKE patients_and_guardians INCLUDING ALL);

-- ============================================================================
-- STEP 2: Load CSV Data into Staging Table
-- ============================================================================

-- Note: Update the path to match your CSV file location
COPY patients_guardians_staging FROM '/path/to/Daybreak Health Test Cases/patients_and_guardians_anonymized.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- ============================================================================
-- STEP 3: Transform and Insert Data
-- ============================================================================

INSERT INTO patients_and_guardians (
    id, role, email, phone, first_name, preferred_name, middle_name, last_name,
    latest_ticket, title, preferred_language, preferred_pronoun, self_gender, 
    legal_gender, birthdate, profile_data, supervisor_id, clinical_associate,
    licenses, licensed_states, care_provider_status, system_labels, supabase_id,
    supabase_metadata, migration_details, address, healthie_id, openpm_reference_id,
    account_status, openpm_policyholder_id, zendesk_id, created_at, updated_at,
    _fivetran_deleted, _fivetran_synced
)
SELECT 
    id::UUID,
    role::INTEGER,
    email,
    phone,
    first_name,
    preferred_name,
    middle_name,
    last_name,
    latest_ticket,
    title,
    preferred_language,
    preferred_pronoun,
    NULLIF(self_gender, '')::INTEGER,
    NULLIF(legal_gender, '')::INTEGER,
    NULLIF(birthdate, '')::DATE,
    COALESCE(profile_data::JSONB, '{}'::JSONB),
    NULLIF(supervisor_id, '')::UUID,
    COALESCE(clinical_associate::BOOLEAN, false),
    CASE 
        WHEN licenses IS NULL OR licenses = '' THEN NULL
        ELSE string_to_array(licenses, ',')::TEXT[]
    END,
    CASE 
        WHEN licensed_states IS NULL OR licensed_states = '' THEN NULL
        ELSE string_to_array(licensed_states, ',')::TEXT[]
    END,
    COALESCE(care_provider_status::INTEGER, 0),
    CASE 
        WHEN system_labels IS NULL OR system_labels = '' THEN NULL
        ELSE string_to_array(system_labels, ',')::TEXT[]
    END,
    NULLIF(supabase_id, '')::UUID,
    COALESCE(supabase_metadata::JSONB, NULL),
    COALESCE(migration_details::JSONB, NULL),
    COALESCE(address::JSONB, NULL),
    healthie_id,
    openpm_reference_id,
    COALESCE(account_status::INTEGER, 0),
    openpm_policyholder_id,
    zendesk_id,
    COALESCE(created_at::TIMESTAMPTZ, NOW()),
    COALESCE(updated_at::TIMESTAMPTZ, NOW()),
    COALESCE(_fivetran_deleted::BOOLEAN, false),
    NULLIF(_fivetran_synced, '')::TIMESTAMPTZ
FROM patients_guardians_staging
WHERE _fivetran_deleted = false OR _fivetran_deleted IS NULL;

-- ============================================================================
-- STEP 4: Clean Up
-- ============================================================================

DROP TABLE patients_guardians_staging;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check record count
SELECT COUNT(*) as imported_count FROM patients_and_guardians;

-- Check for any NULL roles (should be 0)
SELECT COUNT(*) as null_role_count FROM patients_and_guardians WHERE role IS NULL;

\echo 'Import completed for patients_and_guardians'

