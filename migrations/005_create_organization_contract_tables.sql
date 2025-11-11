-- PR 5: Organization and Contract Tables
-- Description: Create tables for organizations, contracts, and their relationships
-- Dependencies: PR 2 (core user tables)
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/005_create_organization_contract_tables.sql

-- ============================================================================
-- STEP 1: Create organizations Table
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_organization_id UUID, -- self-referential FK added below
    kind INTEGER NOT NULL, -- 1=district, 2=school
    slug VARCHAR(255) UNIQUE,
    tzdb VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}',
    market_id UUID DEFAULT '00000000-0000-0000-0000-000000000001', -- Always set to 1
    internal_name VARCHAR(255),
    enabled_at TIMESTAMPTZ,
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create contracts Table
-- ============================================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_date DATE NOT NULL,
    end_date DATE,
    services TEXT[] NOT NULL, -- ['onsite_care', 'family_therapy', 'individual_therapy', ...]
    terms JSONB NOT NULL, -- contract terms configuration
    contract_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

-- ============================================================================
-- STEP 3: Create org_contracts Junction Table
-- ============================================================================

CREATE TABLE org_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- FK added below
    contract_id UUID NOT NULL, -- FK added below
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, contract_id)
);

-- ============================================================================
-- STEP 4: Create Indexes for organizations
-- ============================================================================

-- Index on parent_organization_id for hierarchical queries
CREATE INDEX idx_orgs_parent ON organizations(parent_organization_id);

-- Index on kind for filtering by organization type
CREATE INDEX idx_orgs_kind ON organizations(kind);

-- Index on slug for lookups by slug
CREATE INDEX idx_orgs_slug ON organizations(slug);

-- ============================================================================
-- STEP 5: Create Indexes for contracts
-- ============================================================================

-- Composite index on dates for date range queries
CREATE INDEX idx_contracts_dates ON contracts(effective_date, end_date);

-- ============================================================================
-- STEP 6: Create Indexes for org_contracts
-- ============================================================================

-- Index on organization_id for finding contracts by organization
CREATE INDEX idx_org_contracts_org ON org_contracts(organization_id);

-- Index on contract_id for finding organizations by contract
CREATE INDEX idx_org_contracts_contract ON org_contracts(contract_id);

-- ============================================================================
-- STEP 7: Add CHECK Constraints
-- ============================================================================

-- CHECK constraint for organizations.kind: 1=district, 2=school
ALTER TABLE organizations ADD CONSTRAINT chk_organizations_kind 
    CHECK (kind IN (1, 2));

-- ============================================================================
-- STEP 8: Add Foreign Keys
-- ============================================================================

-- Foreign key from org_contracts to organizations
ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Foreign key from org_contracts to contracts
ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_contract 
    FOREIGN KEY (contract_id) REFERENCES contracts(id);

-- Self-referential foreign key for parent organizations (districts contain schools)
ALTER TABLE organizations ADD CONSTRAINT fk_org_parent 
    FOREIGN KEY (parent_organization_id) REFERENCES organizations(id);

-- ============================================================================
-- STEP 9: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations, contracts, org_contracts TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON organizations, contracts, org_contracts TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON organizations, contracts, org_contracts TO daybreak_admin;

-- ============================================================================
-- STEP 10: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('005_create_organization_contract_tables', 'Create organization and contract tables (organizations, contracts, org_contracts) with indexes, constraints, and foreign keys')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('organizations', 'contracts', 'org_contracts');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('organizations', 'contracts', 'org_contracts') 
-- ORDER BY tablename, indexname;

-- Verify CHECK constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'organizations' 
-- AND contype = 'c';

-- Verify UNIQUE constraint on org_contracts:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'org_contracts' 
-- AND contype = 'u';

-- Verify foreign keys:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('organizations', 'org_contracts') 
-- AND contype = 'f';

-- Test insert with valid enum values:
-- INSERT INTO organizations (kind, name, slug)
-- VALUES (1, 'Test School District', 'test-district')
-- RETURNING id, kind, name, market_id;
--
-- INSERT INTO contracts (effective_date, services, terms)
-- VALUES (
--     '2024-01-01'::DATE,
--     ARRAY['individual_therapy', 'family_therapy']::TEXT[],
--     '{"max_sessions": 12}'::JSONB
-- )
-- RETURNING id, effective_date, services;

-- Test self-referential FK (parent organization):
-- INSERT INTO organizations (kind, name, slug, parent_organization_id)
-- VALUES (
--     2, -- school
--     'Test Elementary School',
--     'test-elementary',
--     (SELECT id FROM organizations WHERE slug = 'test-district' LIMIT 1)
-- )
-- RETURNING id, kind, name, parent_organization_id;

-- Test org_contracts junction table:
-- INSERT INTO org_contracts (organization_id, contract_id)
-- VALUES (
--     (SELECT id FROM organizations WHERE slug = 'test-district' LIMIT 1),
--     (SELECT id FROM contracts LIMIT 1)
-- )
-- RETURNING id, organization_id, contract_id;

-- Test invalid enum values (should fail):
-- INSERT INTO organizations (kind, name, slug)
-- VALUES (99, 'Invalid Org', 'invalid-org');
-- -- Expected: ERROR: new row for relation "organizations" violates check constraint "chk_organizations_kind"

-- Test UNIQUE constraint on org_contracts (should fail on duplicate):
-- INSERT INTO org_contracts (organization_id, contract_id)
-- VALUES (
--     (SELECT id FROM organizations WHERE slug = 'test-district' LIMIT 1),
--     (SELECT id FROM contracts LIMIT 1)
-- );
-- -- Expected: ERROR: duplicate key value violates unique constraint

