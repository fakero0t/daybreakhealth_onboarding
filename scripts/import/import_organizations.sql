-- Import Script: organizations
-- Description: Import orgs.csv into organizations table
-- Dependencies: PR 5 (organizations table must exist)
-- CSV File: Daybreak Health Test Cases/orgs.csv
--
-- Usage:
--   psql -U <username> -d daybreak_health -f scripts/import/import_organizations.sql
--
-- Note: Update the CSV file path below if your files are in a different location

BEGIN;

-- ============================================================================
-- STEP 1: Create Staging Table
-- ============================================================================

CREATE TEMP TABLE organizations_staging (LIKE organizations INCLUDING ALL);

-- ============================================================================
-- STEP 2: Load CSV Data into Staging Table
-- ============================================================================

-- Note: Update the path to match your CSV file location
COPY organizations_staging FROM '/path/to/Daybreak Health Test Cases/orgs.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- ============================================================================
-- STEP 3: Transform and Insert Data
-- ============================================================================

INSERT INTO organizations (
    id, parent_organization_id, kind, slug, tzdb, name, config, market_id,
    internal_name, enabled_at, migration_details, created_at, updated_at,
    _fivetran_deleted, _fivetran_synced
)
SELECT 
    id::UUID,
    NULLIF(parent_organization_id, '')::UUID,
    kind::INTEGER,
    slug,
    tzdb,
    name,
    COALESCE(config::JSONB, '{}'::JSONB),
    COALESCE(market_id::UUID, '00000000-0000-0000-0000-000000000001'::UUID), -- Always set to 1
    internal_name,
    NULLIF(enabled_at, '')::TIMESTAMPTZ,
    COALESCE(migration_details::JSONB, NULL),
    COALESCE(created_at::TIMESTAMPTZ, NOW()),
    COALESCE(updated_at::TIMESTAMPTZ, NOW()),
    COALESCE(_fivetran_deleted::BOOLEAN, false),
    NULLIF(_fivetran_synced, '')::TIMESTAMPTZ
FROM organizations_staging
WHERE _fivetran_deleted = false OR _fivetran_deleted IS NULL;

-- ============================================================================
-- STEP 4: Clean Up
-- ============================================================================

DROP TABLE organizations_staging;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check record count
SELECT COUNT(*) as imported_count FROM organizations;

-- Verify market_id is set correctly
SELECT COUNT(*) as incorrect_market_id FROM organizations 
WHERE market_id != '00000000-0000-0000-0000-000000000001'::UUID;

\echo 'Import completed for organizations'

