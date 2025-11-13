-- Import Script: clinician_credentialed_insurances
-- Description: Import credentialed_insurances.csv into clinician_credentialed_insurances table
-- Dependencies: PR 4 (clinician_credentialed_insurances table must exist)
-- CSV File: Daybreak Health Test Cases/credentialed_insurances.csv
--
-- Usage:
--   Local: psql -U <username> -d daybreak_health -f scripts/import/import_clinician_credentialed_insurances.sql
--   Deployed: Upload CSV to server, then run: psql -U <username> -d daybreak_health -f scripts/import/import_clinician_credentialed_insurances.sql
--
-- Note: For deployed databases, ensure the CSV file is accessible to the PostgreSQL server.
--       Update the CSV file path below to match your environment.

-- ============================================================================
-- PRE-CHECK: Verify table exists
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clinician_credentialed_insurances'
    ) THEN
        RAISE EXCEPTION 'Table clinician_credentialed_insurances does not exist. Please run migration 004_create_insurance_tables.sql first.';
    END IF;
END $$;

BEGIN;

-- ============================================================================
-- STEP 1: Create Staging Table
-- ============================================================================

-- Use TEXT columns for staging to handle CSV import more flexibly
CREATE TEMP TABLE clinician_credentialed_insurances_staging (
    id TEXT,
    name TEXT,
    country TEXT,
    state TEXT,
    line_of_business TEXT,
    legacy_names TEXT,
    network_status TEXT,
    associates_allowed TEXT,
    legacy_id TEXT,
    created_at TEXT,
    updated_at TEXT,
    _fivetran_deleted TEXT,
    _fivetran_synced TEXT,
    parent_credentialed_insurance_id TEXT,
    open_pm_name TEXT,
    migration_details TEXT
);

-- ============================================================================
-- STEP 2: Load CSV Data into Staging Table
-- ============================================================================

-- IMPORTANT: Update this path to match your environment
-- 
-- Option A: COPY command (requires file on database server)
-- For local: Use absolute path like '/Users/ary/Desktop/daybreakhealth_onboarding/Daybreak Health Test Cases/credentialed_insurances.csv'
-- For deployed: Use server path where CSV is uploaded, e.g., '/tmp/credentialed_insurances.csv'
COPY clinician_credentialed_insurances_staging FROM '/path/to/Daybreak Health Test Cases/credentialed_insurances.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');
--
-- Option B: \copy command (works with client-side files - uncomment and use this instead)
-- This works when the CSV is on your local machine, not on the database server
-- \copy clinician_credentialed_insurances_staging FROM 'Daybreak Health Test Cases/credentialed_insurances.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');
--
-- Option C: For deployed databases, use the Node.js script instead:
-- node scripts/import/import-clinician-credentialed-insurances.js

-- ============================================================================
-- STEP 3: Transform and Insert Data
-- ============================================================================

INSERT INTO clinician_credentialed_insurances (
    id, name, country, state, line_of_business, legacy_names, network_status,
    associates_allowed, legacy_id, parent_credentialed_insurance_id,
    open_pm_name, migration_details, created_at, updated_at,
    _fivetran_deleted, _fivetran_synced
)
SELECT 
    id::UUID,
    name,
    COALESCE(NULLIF(TRIM(country), ''), 'US'),
    NULLIF(TRIM(state), ''),
    NULLIF(TRIM(line_of_business), '')::INTEGER,
    -- Convert JSON string array to TEXT[] array
    -- CSV format: ["Molina UT"] needs to be parsed as JSONB then cast to TEXT[]
    CASE 
        WHEN legacy_names IS NULL OR TRIM(legacy_names) = '' OR TRIM(legacy_names) = '{}' THEN NULL
        ELSE (TRIM(legacy_names)::JSONB)::TEXT[]
    END,
    COALESCE(NULLIF(TRIM(network_status), '')::INTEGER, 0),
    COALESCE(NULLIF(TRIM(associates_allowed), '')::INTEGER, 0),
    NULLIF(TRIM(legacy_id), ''),
    NULLIF(TRIM(parent_credentialed_insurance_id), '')::UUID,
    NULLIF(TRIM(open_pm_name), ''),
    -- Handle migration_details JSONB
    CASE 
        WHEN migration_details IS NULL OR TRIM(migration_details) = '' THEN NULL
        ELSE TRIM(migration_details)::JSONB
    END,
    COALESCE(TRIM(created_at)::TIMESTAMPTZ, NOW()),
    COALESCE(TRIM(updated_at)::TIMESTAMPTZ, NOW()),
    -- Handle boolean conversion (CSV has 'false'/'true' as strings)
    CASE 
        WHEN TRIM(_fivetran_deleted) = 'true' THEN true
        WHEN TRIM(_fivetran_deleted) = 'false' THEN false
        ELSE false
    END,
    NULLIF(TRIM(_fivetran_synced), '')::TIMESTAMPTZ
FROM clinician_credentialed_insurances_staging
WHERE TRIM(_fivetran_deleted) = 'false' OR _fivetran_deleted IS NULL OR TRIM(_fivetran_deleted) = '';

-- ============================================================================
-- STEP 4: Clean Up
-- ============================================================================

DROP TABLE clinician_credentialed_insurances_staging;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check record count
SELECT COUNT(*) as imported_count FROM clinician_credentialed_insurances;

\echo 'Import completed for clinician_credentialed_insurances'

