-- Master Migration: Complete Daybreak Health Database Schema
-- Description: This single file contains all 9 migrations in sequential order
-- IMPORTANT: The database 'daybreak_health' must be created before running this script
-- This script should be run as a PostgreSQL superuser
--
-- Usage:
--   1. Create database: CREATE DATABASE daybreak_health;
--   2. Run this script: psql -U <superuser> -d daybreak_health -f migrations/000_master_migration.sql
--   3. Update passwords for roles before production use

BEGIN;

-- ============================================================================
-- PR 1: Database Initialization and Extensions
-- ============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Database Roles
CREATE ROLE daybreak_app WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
CREATE ROLE daybreak_readonly WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
CREATE ROLE daybreak_admin WITH LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION' SUPERUSER;

-- Grant Initial Database Permissions
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_app;
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_readonly;
GRANT ALL PRIVILEGES ON DATABASE daybreak_health TO daybreak_admin;

-- Create Migration Tracking Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT
);

GRANT SELECT ON schema_migrations TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON schema_migrations TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('001_initialize_database', 'Initialize database with extensions, roles, and migration tracking')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 2: Core User Tables
-- ============================================================================

CREATE TABLE patients_and_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role INTEGER NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(255),
    preferred_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    latest_ticket VARCHAR(255),
    title VARCHAR(50),
    preferred_language VARCHAR(10),
    preferred_pronoun VARCHAR(50),
    self_gender INTEGER,
    legal_gender INTEGER,
    birthdate DATE,
    profile_data JSONB DEFAULT '{}',
    supervisor_id UUID,
    clinical_associate BOOLEAN DEFAULT false,
    licenses TEXT[],
    licensed_states TEXT[],
    care_provider_status INTEGER DEFAULT 0,
    system_labels TEXT[],
    supabase_id UUID,
    supabase_metadata JSONB,
    migration_details JSONB,
    address JSONB,
    healthie_id VARCHAR(50),
    openpm_reference_id VARCHAR(50),
    account_status INTEGER DEFAULT 0,
    openpm_policyholder_id VARCHAR(50),
    zendesk_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE TABLE clinicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthie_id VARCHAR(50),
    account_status INTEGER,
    email VARCHAR(255),
    first_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    preferred_name VARCHAR(255),
    preferred_pronoun VARCHAR(50),
    title VARCHAR(50),
    address JSONB,
    phone VARCHAR(50),
    birthdate DATE,
    preferred_language VARCHAR(10),
    legal_gender INTEGER,
    care_provider_status INTEGER,
    clinical_associate BOOLEAN,
    supervisor_id UUID,
    licensed_states TEXT[],
    care_languages TEXT[],
    care_provider_role INTEGER,
    licenses TEXT[],
    states_active TEXT[],
    profile_data JSONB,
    migration_details JSONB,
    migration_profile_data JSONB,
    system_labels TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    associate_supervisor_id UUID,
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_patients_guardians_email ON patients_and_guardians(email);
CREATE INDEX idx_patients_guardians_role ON patients_and_guardians(role);
CREATE INDEX idx_patients_guardians_system_labels ON patients_and_guardians USING GIN(system_labels);
CREATE INDEX idx_patients_guardians_supabase_id ON patients_and_guardians(supabase_id);
CREATE INDEX idx_patients_guardians_supervisor ON patients_and_guardians(supervisor_id);

CREATE INDEX idx_clinicians_email ON clinicians(email);
CREATE INDEX idx_clinicians_healthie_id ON clinicians(healthie_id);
CREATE INDEX idx_clinicians_system_labels ON clinicians USING GIN(system_labels);
CREATE INDEX idx_clinicians_supervisor ON clinicians(supervisor_id);

ALTER TABLE patients_and_guardians ADD CONSTRAINT chk_patients_guardians_role 
    CHECK (role = 1);

GRANT SELECT, INSERT, UPDATE, DELETE ON patients_and_guardians, clinicians TO daybreak_app;
GRANT SELECT ON patients_and_guardians, clinicians TO daybreak_readonly;
GRANT ALL PRIVILEGES ON patients_and_guardians, clinicians TO daybreak_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('002_create_core_user_tables', 'Create core user tables (patients_and_guardians, clinicians) with indexes and permissions')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 3: Relationship and Assessment Tables
-- ============================================================================

CREATE TABLE kinships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_0_id UUID NOT NULL,
    user_1_id UUID NOT NULL,
    kind INTEGER NOT NULL,
    user_0_label INTEGER NOT NULL,
    user_1_label INTEGER NOT NULL,
    guardian_can_be_contacted BOOLEAN DEFAULT false,
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_0_id, user_1_id)
);

CREATE TABLE questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL,
    respondent_id UUID NOT NULL,
    score INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    question_answers JSONB NOT NULL,
    type INTEGER NOT NULL,
    language_of_completion VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_kinships_user_0 ON kinships(user_0_id);
CREATE INDEX idx_kinships_user_1 ON kinships(user_1_id);
CREATE INDEX idx_questionnaires_subject ON questionnaires(subject_id);
CREATE INDEX idx_questionnaires_respondent ON questionnaires(respondent_id);
CREATE INDEX idx_questionnaires_type ON questionnaires(type);
CREATE INDEX idx_questionnaires_completed_at ON questionnaires(completed_at);

ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_0_label 
    CHECK (user_0_label IN (1, 2, 12));
ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_1_label 
    CHECK (user_1_label IN (1, 2, 12));
ALTER TABLE questionnaires ADD CONSTRAINT chk_questionnaires_type 
    CHECK (type IN (3, 4));

GRANT SELECT, INSERT, UPDATE, DELETE ON kinships, questionnaires TO daybreak_app;
GRANT SELECT ON kinships, questionnaires TO daybreak_readonly;
GRANT ALL PRIVILEGES ON kinships, questionnaires TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('003_create_relationship_assessment_tables', 'Create relationship and assessment tables (kinships, questionnaires) with indexes and constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 4: Insurance Tables
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
    parent_credentialed_insurance_id UUID,
    open_pm_name VARCHAR(255),
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

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
    created_by UUID,
    level INTEGER DEFAULT 1,
    insurance_company_name VARCHAR(255),
    kind INTEGER NOT NULL,
    system_labels TEXT[],
    eligibility INTEGER DEFAULT 0,
    user_id UUID NOT NULL,
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

CREATE INDEX idx_clin_cred_insurances_name ON clinician_credentialed_insurances(name);
CREATE INDEX idx_clin_cred_insurances_state ON clinician_credentialed_insurances(state);
CREATE INDEX idx_insurance_coverages_user ON insurance_coverages(user_id);
CREATE INDEX idx_insurance_coverages_eligibility ON insurance_coverages(eligibility);
CREATE INDEX idx_insurance_coverages_labels ON insurance_coverages USING GIN(system_labels);
CREATE INDEX idx_insurance_coverages_created_by ON insurance_coverages(created_by);
CREATE INDEX idx_insurance_coverages_company_name ON insurance_coverages(insurance_company_name);

ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_kind 
    CHECK (kind IN (0, 2));
ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_eligibility 
    CHECK (eligibility IN (0, 2, 4, 6));
ALTER TABLE clinician_credentialed_insurances ADD CONSTRAINT fk_parent_insurance 
    FOREIGN KEY (parent_credentialed_insurance_id) REFERENCES clinician_credentialed_insurances(id);

GRANT SELECT, INSERT, UPDATE, DELETE ON clinician_credentialed_insurances, insurance_coverages TO daybreak_app;
GRANT SELECT ON clinician_credentialed_insurances, insurance_coverages TO daybreak_readonly;
GRANT ALL PRIVILEGES ON clinician_credentialed_insurances, insurance_coverages TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('004_create_insurance_tables', 'Create insurance tables (clinician_credentialed_insurances, insurance_coverages) with indexes, constraints, and self-referential FK')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 5: Organization and Contract Tables
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_organization_id UUID,
    kind INTEGER NOT NULL,
    slug VARCHAR(255) UNIQUE,
    tzdb VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    config JSONB DEFAULT '{}',
    market_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    internal_name VARCHAR(255),
    enabled_at TIMESTAMPTZ,
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_date DATE NOT NULL,
    end_date DATE,
    services TEXT[] NOT NULL,
    terms JSONB NOT NULL,
    contract_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE TABLE org_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    contract_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, contract_id)
);

CREATE INDEX idx_orgs_parent ON organizations(parent_organization_id);
CREATE INDEX idx_orgs_kind ON organizations(kind);
CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_contracts_dates ON contracts(effective_date, end_date);
CREATE INDEX idx_org_contracts_org ON org_contracts(organization_id);
CREATE INDEX idx_org_contracts_contract ON org_contracts(contract_id);

ALTER TABLE organizations ADD CONSTRAINT chk_organizations_kind 
    CHECK (kind IN (1, 2));
ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_contract 
    FOREIGN KEY (contract_id) REFERENCES contracts(id);
ALTER TABLE organizations ADD CONSTRAINT fk_org_parent 
    FOREIGN KEY (parent_organization_id) REFERENCES organizations(id);

GRANT SELECT, INSERT, UPDATE, DELETE ON organizations, contracts, org_contracts TO daybreak_app;
GRANT SELECT ON organizations, contracts, org_contracts TO daybreak_readonly;
GRANT ALL PRIVILEGES ON organizations, contracts, org_contracts TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('005_create_organization_contract_tables', 'Create organization and contract tables (organizations, contracts, org_contracts) with indexes, constraints, and foreign keys')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 6: Referral Tables
-- ============================================================================

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    service_kind INTEGER NOT NULL,
    concerns TEXT,
    data JSONB DEFAULT '{}',
    contract_id UUID NOT NULL,
    market_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    terms_kind INTEGER DEFAULT 1,
    appointment_kind INTEGER,
    planned_sessions INTEGER DEFAULT 12,
    collect_coverage BOOLEAN DEFAULT true,
    allowed_coverage TEXT[],
    collection_rule INTEGER DEFAULT 0,
    self_responsibility_required BOOLEAN DEFAULT true,
    care_provider_requirements TEXT[],
    referred_at TIMESTAMPTZ,
    ready_for_scheduling_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    system_labels TEXT[],
    intake_id UUID,
    tzdb VARCHAR(100),
    onboarding_completed_at TIMESTAMPTZ,
    request_rejected_at TIMESTAMPTZ,
    notes JSONB,
    enrolled_at TIMESTAMPTZ,
    disenrolled_at TIMESTAMPTZ,
    disenrollment_category INTEGER,
    excluded_at TIMESTAMPTZ,
    initial_scheduled_sessions INTEGER,
    care_provider_id UUID,
    zendesk_ticket_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE TABLE referral_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(referral_id, user_id)
);

CREATE INDEX idx_referrals_submitter ON referrals(submitter_id);
CREATE INDEX idx_referrals_organization ON referrals(organization_id);
CREATE INDEX idx_referrals_contract ON referrals(contract_id);
CREATE INDEX idx_referrals_status ON referrals USING GIN(system_labels);
CREATE INDEX idx_referrals_onboarding_completed ON referrals(onboarding_completed_at);
CREATE INDEX idx_referral_members_referral ON referral_members(referral_id);
CREATE INDEX idx_referral_members_user ON referral_members(user_id);

ALTER TABLE referrals ADD CONSTRAINT chk_referrals_service_kind 
    CHECK (service_kind IN (1, 2, 3));
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_contract 
    FOREIGN KEY (contract_id) REFERENCES contracts(id);
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_intake 
    FOREIGN KEY (intake_id) REFERENCES questionnaires(id);
ALTER TABLE referral_members ADD CONSTRAINT fk_referral_members_referral 
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON referrals, referral_members TO daybreak_app;
GRANT SELECT ON referrals, referral_members TO daybreak_readonly;
GRANT ALL PRIVILEGES ON referrals, referral_members TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('006_create_referral_tables', 'Create referral tables (referrals, referral_members) with indexes, constraints, and foreign keys')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 7: Membership and Availability Tables
-- ============================================================================

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    profile_data JSONB DEFAULT '{}',
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_id, organization_id)
);

CREATE TABLE patient_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    availability JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE TABLE clinician_availabilities (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    range_start TIMESTAMPTZ NOT NULL,
    range_end TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    day_of_week INTEGER,
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

CREATE TABLE clinician_insurance_affiliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_provider_profile_id UUID NOT NULL,
    credentialed_insurance_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(care_provider_profile_id, credentialed_insurance_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_patient_avail_user ON patient_availabilities(user_id);
CREATE INDEX idx_patient_avail_availability ON patient_availabilities USING GIN(availability);
CREATE INDEX idx_clinician_avail_user ON clinician_availabilities(user_id);
CREATE INDEX idx_clinician_avail_range ON clinician_availabilities(range_start, range_end);
CREATE INDEX idx_clin_ins_aff_clinician ON clinician_insurance_affiliations(care_provider_profile_id);
CREATE INDEX idx_clin_ins_aff_insurance ON clinician_insurance_affiliations(credentialed_insurance_id);

ALTER TABLE memberships ADD CONSTRAINT fk_memberships_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_insurance 
    FOREIGN KEY (credentialed_insurance_id) REFERENCES clinician_credentialed_insurances(id);

GRANT SELECT, INSERT, UPDATE, DELETE ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_app;
GRANT SELECT ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_readonly;
GRANT ALL PRIVILEGES ON memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations TO daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('007_create_membership_availability_tables', 'Create membership and availability tables (memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations) with indexes and constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 8: Supporting Tables, Views, and Cross-Table Constraints
-- ============================================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL DEFAULT 1,
    label VARCHAR(255) NOT NULL,
    checkboxes TEXT[],
    version_date DATE,
    urls JSONB,
    names JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_documents_label ON documents(label);
CREATE INDEX idx_documents_version ON documents(version);

CREATE VIEW users AS
SELECT 
    id, role, email, phone, first_name, preferred_name, middle_name, last_name,
    title, preferred_language, preferred_pronoun, self_gender, legal_gender,
    birthdate, profile_data, supervisor_id, clinical_associate, licenses,
    licensed_states, care_provider_status, system_labels, supabase_id,
    supabase_metadata, address, healthie_id, openpm_reference_id,
    account_status, openpm_policyholder_id, zendesk_id, latest_ticket,
    created_at, updated_at, _fivetran_deleted, _fivetran_synced,
    1 as user_type
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
    2 as user_type
FROM clinicians;

ALTER TABLE clinicians ADD CONSTRAINT fk_clinicians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);
ALTER TABLE patients_and_guardians ADD CONSTRAINT fk_patients_guardians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_care_provider 
    FOREIGN KEY (care_provider_id) REFERENCES clinicians(id);
ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_clinician 
    FOREIGN KEY (care_provider_profile_id) REFERENCES clinicians(id);

GRANT SELECT, INSERT, UPDATE, DELETE ON documents TO daybreak_app;
GRANT SELECT ON documents TO daybreak_readonly;
GRANT ALL PRIVILEGES ON documents TO daybreak_admin;
GRANT SELECT ON users TO daybreak_app, daybreak_readonly, daybreak_admin;

INSERT INTO schema_migrations (version, description)
VALUES ('008_create_supporting_tables_views_constraints', 'Create supporting tables (documents), users view, and cross-table foreign key constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- PR 9: Triggers and Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patients_guardians_updated_at 
    BEFORE UPDATE ON patients_and_guardians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinicians_updated_at 
    BEFORE UPDATE ON clinicians
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kinships_updated_at 
    BEFORE UPDATE ON kinships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questionnaires_updated_at 
    BEFORE UPDATE ON questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clin_cred_insurances_updated_at 
    BEFORE UPDATE ON clinician_credentialed_insurances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_coverages_updated_at 
    BEFORE UPDATE ON insurance_coverages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at 
    BEFORE UPDATE ON referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_members_updated_at 
    BEFORE UPDATE ON referral_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at 
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_contracts_updated_at 
    BEFORE UPDATE ON org_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at 
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_availabilities_updated_at 
    BEFORE UPDATE ON patient_availabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinician_availabilities_updated_at 
    BEFORE UPDATE ON clinician_availabilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clin_ins_aff_updated_at 
    BEFORE UPDATE ON clinician_insurance_affiliations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT EXECUTE ON FUNCTION update_updated_at_column() TO daybreak_app;

INSERT INTO schema_migrations (version, description)
VALUES ('009_create_triggers', 'Create trigger function and apply updated_at triggers to all 16 tables')
ON CONFLICT (version) DO NOTHING;

COMMIT;

