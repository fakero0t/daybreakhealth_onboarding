# Daybreak Health Database Schema & Implementation Plan

## Overview
This document outlines the PostgreSQL database schema for Daybreak Health's Parent Onboarding AI system, designed to support the onboarding process for parents seeking mental health services for their children.

## Key Requirements & Constraints

- **Single Region Deployment**: Database will be deployed in a single region (no replication)
- **New Database**: This is a new database system, not replacing an existing database
- **No Real-Time Sync**: Standard database operations only - no real-time synchronization requirements
- **CSV Data Quality**: CSV data is pre-validated - malformed JSON strings cannot be stored in CSV columns
- **CSV Structure**: CSV structure does not need to be strictly enforced during import
- **Date Standardization**: All dates must be standardized to TIMESTAMPTZ when added to database
- **PII Encryption**: Industry-standard column-level encryption using PostgreSQL's pgcrypto extension (email can be stored as plain text as well)
- **Index Optimization**: Initial indexes provided; will be updated based on API access patterns provided later
- **Market ID**: market_id can always be set to 1

## Database Schema Design

### Core User & Patient Tables

#### patients_and_guardians
Patients and guardians (from patients_and_guardians_anonymized.csv)
```sql
CREATE TABLE patients_and_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role INTEGER NOT NULL, -- 1=patient/guardian
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(255),
    preferred_name VARCHAR(255),
    middle_name VARCHAR(255),
    last_name VARCHAR(255),
    latest_ticket VARCHAR(255),
    title VARCHAR(50),
    preferred_language VARCHAR(10), -- eng, spa, yue, cmn, por, vie
    preferred_pronoun VARCHAR(50),
    self_gender INTEGER,
    legal_gender INTEGER,
    birthdate DATE,
    profile_data JSONB DEFAULT '{}',
    supervisor_id UUID, -- references clinicians(id) - FK constraint added after clinicians table
    clinical_associate BOOLEAN DEFAULT false,
    licenses TEXT[],
    licensed_states TEXT[],
    care_provider_status INTEGER DEFAULT 0,
    system_labels TEXT[], -- ['guardian', 'dependent', 'student', 'referred', 'enrolled']
    supabase_id UUID,
    supabase_metadata JSONB,
    migration_details JSONB,
    address JSONB, -- {city, state, zip_code, street_address_1, street_address_2}
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

CREATE INDEX idx_patients_guardians_email ON patients_and_guardians(email);
CREATE INDEX idx_patients_guardians_role ON patients_and_guardians(role);
CREATE INDEX idx_patients_guardians_system_labels ON patients_and_guardians USING GIN(system_labels);
CREATE INDEX idx_patients_guardians_supabase_id ON patients_and_guardians(supabase_id);
CREATE INDEX idx_patients_guardians_supervisor ON patients_and_guardians(supervisor_id);
```

#### clinicians
Clinicians (from clinicians_anonymized.csv)
```sql
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
    supervisor_id UUID, -- references clinicians(id) - self-referential FK added after table creation
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
    _fivetran_synced TIMESTAMPTZ,
    -- Note: Many additional columns exist in CSV but are not included in core schema
    -- These can be stored in profile_data JSONB or added as needed
);

CREATE INDEX idx_clinicians_email ON clinicians(email);
CREATE INDEX idx_clinicians_healthie_id ON clinicians(healthie_id);
CREATE INDEX idx_clinicians_system_labels ON clinicians USING GIN(system_labels);
CREATE INDEX idx_clinicians_supervisor ON clinicians(supervisor_id);

-- Add self-referential foreign key for supervisor_id
ALTER TABLE clinicians ADD CONSTRAINT fk_clinicians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);

-- Add foreign key constraints after both tables are created
ALTER TABLE patients_and_guardians ADD CONSTRAINT fk_patients_guardians_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);
ALTER TABLE referrals ADD CONSTRAINT fk_referrals_care_provider 
    FOREIGN KEY (care_provider_id) REFERENCES clinicians(id);
ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_clinician 
    FOREIGN KEY (care_provider_profile_id) REFERENCES clinicians(id);
```

-- Create a view for unified user queries (optional, for backward compatibility)
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
    title, preferred_language, preferred_pronoun, self_gender, legal_gender,
    birthdate, profile_data, supervisor_id, clinical_associate, licenses,
    licensed_states, care_provider_status, system_labels, NULL as supabase_id,
    NULL as supabase_metadata, address, healthie_id, NULL as openpm_reference_id,
    account_status, NULL as openpm_policyholder_id, NULL as zendesk_id, NULL as latest_ticket,
    created_at, updated_at, _fivetran_deleted, _fivetran_synced,
    2 as user_type -- 2=clinician
FROM clinicians;
```

#### kinships
Relationships between guardians and children
```sql
CREATE TABLE kinships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_0_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    user_1_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    kind INTEGER NOT NULL, -- relationship type
    user_0_label INTEGER NOT NULL, -- 1=guardian, 2=child, 12=both
    user_1_label INTEGER NOT NULL,
    guardian_can_be_contacted BOOLEAN DEFAULT false,
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_0_id, user_1_id)
);

CREATE INDEX idx_kinships_user_0 ON kinships(user_0_id);
CREATE INDEX idx_kinships_user_1 ON kinships(user_1_id);

-- Add CHECK constraints for enum-like values
ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_0_label 
    CHECK (user_0_label IN (1, 2, 12));
ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_1_label 
    CHECK (user_1_label IN (1, 2, 12));
```

### Questionnaire & Assessment Tables

#### questionnaires
Mental health assessments and intake questionnaires
```sql
CREATE TABLE questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    respondent_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    score INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    question_answers JSONB NOT NULL, -- {question_1_answer, question_2_answer, ...}
    type INTEGER NOT NULL, -- 3=standard, 4=extended
    language_of_completion VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_questionnaires_subject ON questionnaires(subject_id);
CREATE INDEX idx_questionnaires_respondent ON questionnaires(respondent_id);
CREATE INDEX idx_questionnaires_type ON questionnaires(type);
CREATE INDEX idx_questionnaires_completed_at ON questionnaires(completed_at);

-- Add CHECK constraints for enum-like values
ALTER TABLE questionnaires ADD CONSTRAINT chk_questionnaires_type 
    CHECK (type IN (3, 4));
```

### Insurance Tables

#### clinician_credentialed_insurances
Insurance companies accepted by Daybreak Health
```sql
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
    parent_credentialed_insurance_id UUID REFERENCES clinician_credentialed_insurances(id),
    open_pm_name VARCHAR(255),
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_clin_cred_insurances_name ON clinician_credentialed_insurances(name);
CREATE INDEX idx_clin_cred_insurances_state ON clinician_credentialed_insurances(state);
```

#### insurance_coverages
Patient insurance coverage information
```sql
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
    created_by UUID, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    level INTEGER DEFAULT 1,
    insurance_company_name VARCHAR(255),
    kind INTEGER NOT NULL, -- 0=non-insurance, 2=insurance
    system_labels TEXT[], -- ['in_network', 'expired', 'submitted', 'out_of_network']
    eligibility INTEGER DEFAULT 0, -- 0=unknown, 2=submitted, 4=eligible, 6=expired
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
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

CREATE INDEX idx_insurance_coverages_user ON insurance_coverages(user_id);
CREATE INDEX idx_insurance_coverages_eligibility ON insurance_coverages(eligibility);
CREATE INDEX idx_insurance_coverages_labels ON insurance_coverages USING GIN(system_labels);
CREATE INDEX idx_insurance_coverages_created_by ON insurance_coverages(created_by);
CREATE INDEX idx_insurance_coverages_company_name ON insurance_coverages(insurance_company_name);

-- Add CHECK constraints for enum-like values
ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_kind 
    CHECK (kind IN (0, 2));
ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_eligibility 
    CHECK (eligibility IN (0, 2, 4, 6));
```

### Referral & Care Request Tables

#### referrals
Care requests and referral tracking
```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    organization_id UUID NOT NULL REFERENCES organizations(id),
    service_kind INTEGER NOT NULL, -- 1=individual, 2=family, 3=onsite
    concerns TEXT,
    data JSONB DEFAULT '{}',
    contract_id UUID NOT NULL REFERENCES contracts(id),
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
    intake_id UUID REFERENCES questionnaires(id),
    tzdb VARCHAR(100),
    onboarding_completed_at TIMESTAMPTZ,
    request_rejected_at TIMESTAMPTZ,
    notes JSONB, -- {request_rejected_cause: "Not Engaged"}
    enrolled_at TIMESTAMPTZ,
    disenrolled_at TIMESTAMPTZ,
    disenrollment_category INTEGER,
    excluded_at TIMESTAMPTZ,
    initial_scheduled_sessions INTEGER,
    care_provider_id UUID, -- references clinicians(id) - FK constraint added after clinicians table
    zendesk_ticket_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_referrals_submitter ON referrals(submitter_id);
CREATE INDEX idx_referrals_organization ON referrals(organization_id);
CREATE INDEX idx_referrals_contract ON referrals(contract_id);
CREATE INDEX idx_referrals_status ON referrals USING GIN(system_labels);
CREATE INDEX idx_referrals_onboarding_completed ON referrals(onboarding_completed_at);

-- Add CHECK constraints for enum-like values
ALTER TABLE referrals ADD CONSTRAINT chk_referrals_service_kind 
    CHECK (service_kind IN (1, 2, 3));
```

#### referral_members
Links referrals to specific patients with additional context
```sql
CREATE TABLE referral_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    role INTEGER DEFAULT 0, -- 0=patient
    data JSONB DEFAULT '{}', -- {grade: "GRADE_7"}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(referral_id, user_id)
);

CREATE INDEX idx_referral_members_referral ON referral_members(referral_id);
CREATE INDEX idx_referral_members_user ON referral_members(user_id);
```

### Organization & Contract Tables

#### organizations
Schools, districts, and organizational entities
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_organization_id UUID REFERENCES organizations(id),
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

CREATE INDEX idx_orgs_parent ON organizations(parent_organization_id);
CREATE INDEX idx_orgs_kind ON organizations(kind);
CREATE INDEX idx_orgs_slug ON organizations(slug);

-- Add CHECK constraints for enum-like values
ALTER TABLE organizations ADD CONSTRAINT chk_organizations_kind 
    CHECK (kind IN (1, 2));
```

#### contracts
Service contracts between organizations and Daybreak
```sql
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

CREATE INDEX idx_contracts_dates ON contracts(effective_date, end_date);
```

#### org_contracts
Junction table linking organizations to contracts
```sql
CREATE TABLE org_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contract_id UUID NOT NULL REFERENCES contracts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, contract_id)
);

CREATE INDEX idx_org_contracts_org ON org_contracts(organization_id);
CREATE INDEX idx_org_contracts_contract ON org_contracts(contract_id);
```

#### memberships
User membership in organizations
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    organization_id UUID NOT NULL REFERENCES organizations(id),
    profile_data JSONB DEFAULT '{}',
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
```

### Scheduling & Availability Tables

#### patient_availabilities
Patient availability for scheduling
```sql
CREATE TABLE patient_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references patients_and_guardians(id) - validated at application level
    availability JSONB NOT NULL, -- [{day: "Monday", time_blocks: [{start: "08:00:00", duration: 60}]}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ
);

CREATE INDEX idx_patient_avail_user ON patient_availabilities(user_id);
CREATE INDEX idx_patient_avail_availability ON patient_availabilities USING GIN(availability);
```

#### clinician_availabilities
Clinician availability (from parquet export structure)
```sql
CREATE TABLE clinician_availabilities (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL, -- references clinicians (healthie_id)
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

CREATE INDEX idx_clinician_avail_user ON clinician_availabilities(user_id);
CREATE INDEX idx_clinician_avail_range ON clinician_availabilities(range_start, range_end);
```

#### clinician_insurance_affiliations
Clinician insurance network affiliations (junction table)
```sql
CREATE TABLE clinician_insurance_affiliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_provider_profile_id UUID NOT NULL, -- references clinicians(id) - FK constraint added after clinicians table
    credentialed_insurance_id UUID NOT NULL REFERENCES clinician_credentialed_insurances(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(care_provider_profile_id, credentialed_insurance_id)
);

CREATE INDEX idx_clin_ins_aff_clinician ON clinician_insurance_affiliations(care_provider_profile_id);
CREATE INDEX idx_clin_ins_aff_insurance ON clinician_insurance_affiliations(credentialed_insurance_id);
```

### Supporting Tables

#### documents
Legal documents and consent forms
```sql
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

CREATE INDEX idx_documents_label ON documents(label);
CREATE INDEX idx_documents_version ON documents(version);
```

## Implementation Plan

### Phase 1: Database Setup

#### 1.1 Environment Preparation
- [ ] Set up PostgreSQL 14+ database instance (single region deployment)
- [ ] Configure database connection parameters
- [ ] Set up development, staging, and production environments
- [ ] Configure backup strategy (no replication required for single region)
- [ ] Set up connection pooling (PgBouncer recommended)
- [ ] Note: This is a new database, not replacing an existing system

#### 1.2 Schema Creation
- [ ] Create database: `CREATE DATABASE daybreak_health;`
- [ ] Enable required extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search
  CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for PII encryption
  ```
- [ ] Execute schema creation script in **exact order** (respecting dependencies):
  
  **Step 1: Core user tables (no dependencies)**
  1. `patients_and_guardians` (no FKs to other tables yet)
  2. `clinicians` (no FKs to other tables yet)
  
  **Step 2: Self-referential and core relationship tables**
  3. `kinships` (references patients_and_guardians/clinicians - app-level validation)
  4. `questionnaires` (references patients_and_guardians/clinicians - app-level validation)
  
  **Step 3: Insurance tables**
  5. `clinician_credentialed_insurances` (self-referential FK added after creation)
  6. `insurance_coverages` (references patients_and_guardians/clinicians - app-level validation)
  
  **Step 4: Organization and contract tables**
  7. `organizations` (self-referential FK added after creation)
  8. `contracts` (no dependencies)
  9. `org_contracts` (references organizations, contracts)
  
  **Step 5: Referral tables (depends on organizations, contracts, questionnaires)**
  10. `referrals` (references organizations, contracts, questionnaires, clinicians)
  11. `referral_members` (references referrals, patients_and_guardians - app-level validation)
  
  **Step 6: Membership and availability tables**
  12. `memberships` (references organizations, patients_and_guardians/clinicians - app-level validation)
  13. `patient_availabilities` (references patients_and_guardians - app-level validation)
  14. `clinician_availabilities` (references clinicians.healthie_id - INTEGER, not FK)
  15. `clinician_insurance_affiliations` (references clinicians, clinician_credentialed_insurances)
  
  **Step 7: Supporting tables**
  16. `documents` (no dependencies)
  
  **Step 8: Views**
  17. Create `users` view (optional, for unified queries)
  
  **Step 9: Add cross-table foreign key constraints**
  18. `ALTER TABLE clinicians ADD CONSTRAINT fk_clinicians_supervisor FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);`
  19. `ALTER TABLE patients_and_guardians ADD CONSTRAINT fk_patients_guardians_supervisor FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);`
  20. `ALTER TABLE clinician_credentialed_insurances ADD CONSTRAINT fk_parent_insurance FOREIGN KEY (parent_credentialed_insurance_id) REFERENCES clinician_credentialed_insurances(id);`
  21. `ALTER TABLE organizations ADD CONSTRAINT fk_org_parent FOREIGN KEY (parent_organization_id) REFERENCES organizations(id);`
  22. `ALTER TABLE referrals ADD CONSTRAINT fk_referrals_care_provider FOREIGN KEY (care_provider_id) REFERENCES clinicians(id);`
  23. `ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_clinician FOREIGN KEY (care_provider_profile_id) REFERENCES clinicians(id);`
  
  **Step 10: Add CHECK constraints**
  24. Add all CHECK constraints as defined in schema sections

#### 1.3 Constraints & Triggers
- [ ] Add foreign key constraints (note: some references to users require application-level validation since they can reference either patients_and_guardians or clinicians)
- [ ] Add CHECK constraints for enum-like INTEGER values (as defined in schema)
- [ ] Add cross-table foreign keys (patients_and_guardians.supervisor_id → clinicians.id, referrals.care_provider_id → clinicians.id, clinician_insurance_affiliations.care_provider_profile_id → clinicians.id)
- [ ] Create triggers for `updated_at` timestamps:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Apply to all tables with updated_at column
  CREATE TRIGGER update_patients_guardians_updated_at BEFORE UPDATE ON patients_and_guardians
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_clinicians_updated_at BEFORE UPDATE ON clinicians
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_kinships_updated_at BEFORE UPDATE ON kinships
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_clin_cred_insurances_updated_at BEFORE UPDATE ON clinician_credentialed_insurances
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_insurance_coverages_updated_at BEFORE UPDATE ON insurance_coverages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_referral_members_updated_at BEFORE UPDATE ON referral_members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_org_contracts_updated_at BEFORE UPDATE ON org_contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_patient_availabilities_updated_at BEFORE UPDATE ON patient_availabilities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_clinician_availabilities_updated_at BEFORE UPDATE ON clinician_availabilities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_clin_ins_aff_updated_at BEFORE UPDATE ON clinician_insurance_affiliations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ```

### Phase 2: Data Migration

#### 2.1 CSV Import Strategy
- [ ] Create staging tables for CSV import
- [ ] Use `COPY` command for bulk import
- [ ] **Note**: CSV data quality ensures malformed JSON strings cannot be stored in CSV columns
- [ ] **Note**: CSV structure does not need to be strictly enforced during import
- [ ] Handle data type conversions (JSON strings to JSONB, arrays, UUIDs, dates, etc.)
- [ ] Set market_id to 1 (UUID: '00000000-0000-0000-0000-000000000001') for all records in `referrals` and `organizations` tables
- [ ] Standardize all timestamps to TIMESTAMPTZ during import
- [ ] Validate data integrity after import

**CSV File to Table Mapping:**
1. `patients_and_guardians_anonymized.csv` → `patients_and_guardians` (see example script below)
2. `clinicians_anonymized.csv` → `clinicians` (see example script below)
3. `kinships.csv` → `kinships`
4. `questionnaires.csv` → `questionnaires`
5. `clinician_credentialed_insurances.csv` → `clinician_credentialed_insurances`
6. `insurance_coverages.csv` → `insurance_coverages`
7. `referrals.csv` → `referrals`
8. `referral_members.csv` → `referral_members`
9. `orgs.csv` → `organizations`
10. `contracts.csv` → `contracts`
11. `org_contracts.csv` → `org_contracts`
12. `memberships.csv` → `memberships`
13. `patient_availabilities.csv` → `patient_availabilities`
14. `clinician_availabilities.csv` → `clinician_availabilities`
15. `documents.csv` → `documents`
16. `credentialed_insurances.csv` → (may be same as `clinician_credentialed_insurances` or legacy name)

**Import Order:** Import tables in dependency order (same as schema creation order) to maintain referential integrity. For tables with foreign keys, ensure referenced tables are imported first.

#### 2.2 Data Cleaning
- [ ] Remove duplicate records
- [ ] **Standardize all date formats when adding to database** - convert to TIMESTAMPTZ consistently
- [ ] Parse JSON strings into JSONB (CSV data is pre-validated)
- [ ] Handle NULL values appropriately
- [ ] Validate foreign key relationships

#### 2.3 Data Validation
- [ ] Verify referential integrity
- [ ] Check for orphaned records
- [ ] Validate JSONB structure
- [ ] Run data quality checks
- [ ] Execute validation queries:
  ```sql
  -- Check for orphaned records
  SELECT COUNT(*) as orphaned_kinships FROM kinships k
  WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = k.user_0_id)
    AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.id = k.user_0_id)
    AND NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = k.user_1_id)
    AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.id = k.user_1_id);
  
  SELECT COUNT(*) as orphaned_questionnaires FROM questionnaires q
  WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = q.subject_id)
    OR (NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = q.respondent_id)
        AND NOT EXISTS (SELECT 1 FROM clinicians c WHERE c.id = q.respondent_id));
  
  SELECT COUNT(*) as orphaned_referrals FROM referrals r
  WHERE NOT EXISTS (SELECT 1 FROM patients_and_guardians p WHERE p.id = r.submitter_id)
    OR NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = r.organization_id)
    OR NOT EXISTS (SELECT 1 FROM contracts c WHERE c.id = r.contract_id);
  
  -- Check for invalid enum values
  SELECT 'kinships' as table_name, COUNT(*) as invalid_count FROM kinships
  WHERE user_0_label NOT IN (1, 2, 12) OR user_1_label NOT IN (1, 2, 12)
  UNION ALL
  SELECT 'questionnaires', COUNT(*) FROM questionnaires WHERE type NOT IN (3, 4)
  UNION ALL
  SELECT 'insurance_coverages_kind', COUNT(*) FROM insurance_coverages WHERE kind NOT IN (0, 2)
  UNION ALL
  SELECT 'insurance_coverages_eligibility', COUNT(*) FROM insurance_coverages WHERE eligibility NOT IN (0, 2, 4, 6)
  UNION ALL
  SELECT 'referrals_service_kind', COUNT(*) FROM referrals WHERE service_kind NOT IN (1, 2, 3)
  UNION ALL
  SELECT 'organizations_kind', COUNT(*) FROM organizations WHERE kind NOT IN (1, 2);
  
  -- Check for NULL required fields
  SELECT 'patients_and_guardians' as table_name, COUNT(*) as null_role_count FROM patients_and_guardians WHERE role IS NULL
  UNION ALL
  SELECT 'kinships', COUNT(*) FROM kinships WHERE user_0_id IS NULL OR user_1_id IS NULL OR kind IS NULL
  UNION ALL
  SELECT 'questionnaires', COUNT(*) FROM questionnaires WHERE subject_id IS NULL OR respondent_id IS NULL OR type IS NULL
  UNION ALL
  SELECT 'referrals', COUNT(*) FROM referrals WHERE submitter_id IS NULL OR organization_id IS NULL OR contract_id IS NULL OR service_kind IS NULL;
  
  -- Validate JSONB structure (sample checks)
  SELECT COUNT(*) as invalid_jsonb FROM patients_and_guardians
  WHERE profile_data IS NOT NULL AND jsonb_typeof(profile_data) != 'object';
  ```

### Phase 3: Indexing & Performance

#### 3.1 Primary Indexes
- [ ] Create all primary key indexes (automatic)
- [ ] Create foreign key indexes (listed in schema)
- [ ] Create GIN indexes for JSONB and array columns

#### 3.2 Query Optimization
- [ ] **Note**: API access patterns will be provided later - indexes can be updated accordingly
- [ ] Create initial composite indexes for expected common queries:
  ```sql
  -- Example: Find active referrals for organization
  CREATE INDEX idx_referrals_org_status ON referrals(organization_id, system_labels) 
  WHERE _fivetran_deleted = false;
  ```
- [ ] Add partial indexes for filtered queries
- [ ] Use `EXPLAIN ANALYZE` to optimize slow queries
- [ ] Plan for index updates once API access patterns are defined

#### 3.3 Full-Text Search
- [ ] Add full-text search indexes for names, emails:
  ```sql
  CREATE INDEX idx_patients_guardians_name_search ON patients_and_guardians 
  USING GIN(to_tsvector('english', first_name || ' ' || last_name));
  CREATE INDEX idx_clinicians_name_search ON clinicians 
  USING GIN(to_tsvector('english', first_name || ' ' || last_name));
  ```

### Phase 4: Security & Access Control

#### 4.1 User Management
- [ ] Create database roles:
  - `daybreak_app` (application user)
  - `daybreak_readonly` (read-only access)
  - `daybreak_admin` (full access)
- [ ] Set up row-level security (RLS) if needed
- [ ] Configure connection limits per role

#### 4.2 Data Protection
- [ ] **Implement industry-standard PII encryption**: Use PostgreSQL's `pgcrypto` extension for column-level encryption
- [ ] **Note**: Email can be stored as plain text in addition to encrypted format
- [ ] Encrypt PII fields (phone, names, addresses, birthdates) using AES-256 encryption
- [ ] Set up encryption keys management (use environment variables or key management service)
- [ ] Implement audit logging for data changes
- [ ] Configure backup encryption
- [ ] Example encryption setup:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Encrypt sensitive columns (email can remain as plain text)
  ALTER TABLE patients_and_guardians ADD COLUMN phone_encrypted BYTEA;
  ALTER TABLE clinicians ADD COLUMN phone_encrypted BYTEA;
  -- Application layer handles encryption/decryption using pgp_sym_encrypt/pgp_sym_decrypt
  ```

#### 4.3 Access Policies
- [ ] Create views for common queries
- [ ] Implement role-based access through views
- [ ] Set up connection SSL/TLS

### Phase 5: Monitoring & Maintenance

#### 5.1 Monitoring Setup
- [ ] Configure PostgreSQL monitoring (pg_stat_statements)
- [ ] Set up slow query logging
- [ ] Create dashboards for:
  - Database size and growth
  - Query performance
  - Connection pool usage
- [ ] **Note**: Single region deployment - no replication lag monitoring needed
- [ ] **Note**: No real-time sync requirements - standard database operations only

#### 5.2 Maintenance Tasks
- [ ] Schedule VACUUM and ANALYZE jobs
- [ ] Set up automatic index maintenance
- [ ] Configure log rotation
- [ ] Plan for regular schema migrations

#### 5.3 Backup Strategy
- [ ] Set up daily full backups
- [ ] Configure WAL archiving for point-in-time recovery
- [ ] Test backup restoration procedures
- [ ] Document disaster recovery plan

## Enum Value Documentation

### Integer Enum Fields

#### patients_and_guardians.role
- `1` = patient/guardian

#### kinships.user_0_label / user_1_label
- `1` = guardian
- `2` = child
- `12` = both

#### questionnaires.type
- `3` = standard
- `4` = extended

#### insurance_coverages.kind
- `0` = non-insurance
- `2` = insurance

#### insurance_coverages.eligibility
- `0` = unknown
- `2` = submitted
- `4` = eligible
- `6` = expired

#### referrals.service_kind
- `1` = individual
- `2` = family
- `3` = onsite

#### organizations.kind
- `1` = district
- `2` = school

#### referral_members.role
- `0` = patient

## Complete Foreign Key Reference List

### Direct Foreign Keys (Database Enforced)
1. `patients_and_guardians.supervisor_id` → `clinicians.id`
2. `clinicians.supervisor_id` → `clinicians.id` (self-referential)
3. `clinician_credentialed_insurances.parent_credentialed_insurance_id` → `clinician_credentialed_insurances.id` (self-referential)
4. `referrals.organization_id` → `organizations.id`
5. `referrals.contract_id` → `contracts.id`
6. `referrals.intake_id` → `questionnaires.id`
7. `referrals.care_provider_id` → `clinicians.id`
8. `referral_members.referral_id` → `referrals.id` (ON DELETE CASCADE)
9. `org_contracts.organization_id` → `organizations.id`
10. `org_contracts.contract_id` → `contracts.id`
11. `organizations.parent_organization_id` → `organizations.id` (self-referential)
12. `memberships.organization_id` → `organizations.id`
13. `clinician_insurance_affiliations.credentialed_insurance_id` → `clinician_credentialed_insurances.id`
14. `clinician_insurance_affiliations.care_provider_profile_id` → `clinicians.id`

### Application-Level Validated Foreign Keys
These fields can reference either `patients_and_guardians` or `clinicians` and must be validated at the application level:
1. `kinships.user_0_id` → `patients_and_guardians.id` OR `clinicians.id`
2. `kinships.user_1_id` → `patients_and_guardians.id` OR `clinicians.id`
3. `questionnaires.subject_id` → `patients_and_guardians.id`
4. `questionnaires.respondent_id` → `patients_and_guardians.id` OR `clinicians.id`
5. `insurance_coverages.user_id` → `patients_and_guardians.id`
6. `insurance_coverages.created_by` → `patients_and_guardians.id` OR `clinicians.id`
7. `referrals.submitter_id` → `patients_and_guardians.id`
8. `referral_members.user_id` → `patients_and_guardians.id`
9. `memberships.user_id` → `patients_and_guardians.id` OR `clinicians.id`
10. `patient_availabilities.user_id` → `patients_and_guardians.id`
11. `clinician_availabilities.user_id` → `clinicians.healthie_id` (INTEGER, not UUID FK)

## Testing Procedures

### Unit Tests
- [ ] Test all CHECK constraints with valid and invalid values
- [ ] Test all foreign key constraints with valid and invalid references
- [ ] Test UNIQUE constraints
- [ ] Test NOT NULL constraints
- [ ] Test default values
- [ ] Test `updated_at` trigger functionality

### Integration Tests
- [ ] Test complete referral creation workflow
- [ ] Test questionnaire submission workflow
- [ ] Test insurance coverage creation workflow
- [ ] Test organization and contract relationships
- [ ] Test kinship relationship creation
- [ ] Test membership creation

### Data Integrity Tests
- [ ] Verify no orphaned records after data import
- [ ] Verify referential integrity across all relationships
- [ ] Verify enum values are within allowed ranges
- [ ] Verify JSONB fields are valid JSON
- [ ] Verify date standardization (all TIMESTAMPTZ)
- [ ] Verify market_id is set to 1 for all records

### Performance Tests
- [ ] Test query performance with indexes
- [ ] Test bulk insert performance
- [ ] Test GIN index performance on JSONB and array columns
- [ ] Test full-text search performance

## Rollback Procedures

### Schema Rollback
- [ ] Document all schema changes in version-controlled migration files
- [ ] Create rollback scripts for each migration
- [ ] Test rollback procedures in development environment
- [ ] Maintain backup of schema before each migration

### Data Rollback
- [ ] Create database backup before data import
- [ ] Document data import steps for rollback
- [ ] Test data restoration from backup
- [ ] Maintain transaction logs for point-in-time recovery

### Example Rollback Script Structure
```sql
-- Rollback migration: 001_create_tables.sql
-- Rollback script: 001_create_tables_rollback.sql

BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
-- ... (drop all triggers)

-- Drop views
DROP VIEW IF EXISTS users;

-- Drop foreign key constraints
ALTER TABLE clinician_insurance_affiliations DROP CONSTRAINT IF EXISTS fk_clin_ins_aff_clinician;
-- ... (drop all FKs)

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS clinician_insurance_affiliations CASCADE;
-- ... (drop all tables)

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop extensions (optional, may be used by other databases)
-- DROP EXTENSION IF EXISTS pgcrypto;
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;
```

## Environment Configuration

### Required Environment Variables
```bash
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=daybreak_health
DB_USER=daybreak_app
DB_PASSWORD=<secure_password>

# Encryption Key (for PII encryption)
ENCRYPTION_KEY=<32-byte-key-for-AES-256>

# Environment
NODE_ENV=development|staging|production

# Connection Pooling (PgBouncer)
POOL_SIZE=20
MAX_CLIENTS=100
```

### Database Roles Setup
```sql
-- Create roles
CREATE ROLE daybreak_app WITH LOGIN PASSWORD '<secure_password>';
CREATE ROLE daybreak_readonly WITH LOGIN PASSWORD '<secure_password>';
CREATE ROLE daybreak_admin WITH LOGIN PASSWORD '<secure_password>' SUPERUSER;

-- Grant permissions
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_app;
GRANT CONNECT ON DATABASE daybreak_health TO daybreak_readonly;
GRANT ALL PRIVILEGES ON DATABASE daybreak_health TO daybreak_admin;

-- Grant table permissions (after schema creation)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO daybreak_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO daybreak_readonly;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO daybreak_admin;

-- Grant sequence permissions (for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daybreak_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daybreak_readonly;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO daybreak_admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO daybreak_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO daybreak_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO daybreak_admin;
```

## Data Import Script Example

```sql
-- Example: Import patients_and_guardians from CSV
-- Note: CSV data is pre-validated - malformed JSON strings cannot exist in CSV columns
CREATE TEMP TABLE patients_guardians_staging (LIKE patients_and_guardians INCLUDING ALL);

COPY patients_guardians_staging FROM '/path/to/patients_and_guardians_anonymized.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Transform and insert with date standardization
INSERT INTO patients_and_guardians (
    id, role, email, phone, first_name, preferred_name, middle_name, last_name,
    latest_ticket, title, preferred_language, preferred_pronoun, self_gender, 
    legal_gender, birthdate, profile_data, supervisor_id, clinical_associate,
    licenses, licensed_states, care_provider_status, system_labels, supabase_id,
    supabase_metadata, migration_details, address, healthie_id, openpm_reference_id,
    account_status, openpm_policyholder_id, zendesk_id, created_at, updated_at
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
    self_gender::INTEGER,
    legal_gender::INTEGER,
    birthdate::DATE,
    profile_data::JSONB, -- CSV JSON is pre-validated
    supervisor_id::UUID,
    clinical_associate::BOOLEAN,
    string_to_array(licenses, ',')::TEXT[],
    string_to_array(licensed_states, ',')::TEXT[],
    care_provider_status::INTEGER,
    string_to_array(system_labels, ',')::TEXT[],
    supabase_id::UUID,
    supabase_metadata::JSONB, -- CSV JSON is pre-validated
    migration_details::JSONB, -- CSV JSON is pre-validated
    address::JSONB, -- CSV JSON is pre-validated
    healthie_id,
    openpm_reference_id,
    account_status::INTEGER,
    openpm_policyholder_id,
    zendesk_id,
    -- Standardize all timestamps to TIMESTAMPTZ
    COALESCE(created_at::TIMESTAMPTZ, NOW()),
    COALESCE(updated_at::TIMESTAMPTZ, NOW())
FROM patients_guardians_staging
WHERE _fivetran_deleted = false;

DROP TABLE patients_guardians_staging;

-- Example: Import clinicians from CSV
CREATE TEMP TABLE clinicians_staging (LIKE clinicians INCLUDING ALL);

COPY clinicians_staging FROM '/path/to/clinicians_anonymized.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Transform and insert (selecting only columns that exist in table schema)
INSERT INTO clinicians (
    id, healthie_id, account_status, email, first_name, middle_name, last_name,
    preferred_name, preferred_pronoun, title, address, phone, birthdate,
    preferred_language, legal_gender, care_provider_status, clinical_associate,
    supervisor_id, licensed_states, care_languages, care_provider_role, licenses,
    states_active, profile_data, migration_details, migration_profile_data,
    system_labels, created_at, updated_at, associate_supervisor_id
)
SELECT 
    id::UUID,
    healthie_id,
    account_status::INTEGER,
    email,
    first_name,
    middle_name,
    last_name,
    preferred_name,
    preferred_pronoun,
    title,
    address::JSONB,
    phone,
    birthdate::DATE,
    preferred_language,
    legal_gender::INTEGER,
    care_provider_status::INTEGER,
    clinical_associate::BOOLEAN,
    supervisor_id::UUID,
    string_to_array(licensed_states, ',')::TEXT[],
    string_to_array(care_languages, ',')::TEXT[],
    care_provider_role::INTEGER,
    string_to_array(licenses, ',')::TEXT[],
    string_to_array(states_active, ',')::TEXT[],
    profile_data::JSONB,
    migration_details::JSONB,
    migration_profile_data::JSONB,
    string_to_array(system_labels, ',')::TEXT[],
    COALESCE(created_at::TIMESTAMPTZ, NOW()),
    COALESCE(updated_at::TIMESTAMPTZ, NOW()),
    associate_supervisor_id::UUID
FROM clinicians_staging
WHERE _fivetran_deleted = false;

DROP TABLE clinicians_staging;
```

## Key Design Decisions

1. **UUIDs for Primary Keys**: All tables use UUIDs for better distributed system support and security
2. **Separate User Tables**: `patients_and_guardians` and `clinicians` tables match CSV file structure (from `patients_and_guardians_anonymized.csv` and `clinicians_anonymized.csv`)
3. **Users View**: Optional `users` view provides unified query interface across both user tables
4. **Cross-Table References**: Some foreign keys reference either table (validated at application level) since PostgreSQL doesn't support FKs to multiple tables
5. **JSONB for Flexible Data**: Used for profile_data, question_answers, and other variable structures
6. **Array Columns**: Used for system_labels, services, etc. with GIN indexes for fast queries
7. **Soft Deletes**: `_fivetran_deleted` flag allows data retention for analytics
8. **Audit Trail**: `created_at` and `updated_at` on all tables for change tracking
9. **Normalized Structure**: Separate tables for relationships, memberships, and junctions
10. **Single Region Deployment**: Database deployed in single region - no replication required
11. **PII Encryption**: Industry-standard column-level encryption using pgcrypto extension (email can be stored as plain text)
12. **CSV Data Quality**: CSV data is pre-validated - malformed JSON strings cannot be stored
13. **CSV Structure**: CSV structure does not need to be strictly enforced during import
14. **Date Standardization**: All dates standardized to TIMESTAMPTZ when imported to database
15. **Market ID**: market_id can always be set to 1 (UUID: '00000000-0000-0000-0000-000000000001')
16. **CHECK Constraints**: Enum-like INTEGER fields use CHECK constraints for data integrity
17. **New Database**: This is a new database system, not replacing an existing one
18. **No Real-Time Sync**: Standard database operations - no real-time synchronization requirements
19. **Index Optimization**: Initial indexes created; will be optimized based on API access patterns provided later

## Performance Considerations

1. **Indexing Strategy**: 
   - Foreign keys always indexed
   - GIN indexes for JSONB and array columns
   - Composite indexes for common query patterns

2. **Partitioning** (Future):
   - Consider partitioning `referrals` by `created_at` for large datasets
   - Partition `questionnaires` by date if volume grows

3. **Connection Pooling**:
   - Use PgBouncer for connection management
   - Configure appropriate pool sizes

4. **Query Optimization**:
   - Use prepared statements
   - Implement query result caching where appropriate
   - Monitor and optimize N+1 query patterns

## Implementation Notes & Gotchas

### Critical Implementation Details

1. **UUID Generation**: Use `gen_random_uuid()` (PostgreSQL 13+) or `uuid_generate_v4()` from `uuid-ossp` extension. The schema uses `gen_random_uuid()` by default.

2. **Date Handling**: All date/timestamp fields must be converted to TIMESTAMPTZ during import. Use `COALESCE(column::TIMESTAMPTZ, NOW())` for safety.

3. **Array Columns**: CSV arrays may be comma-separated strings. Use `string_to_array(column, ',')::TEXT[]` for conversion.

4. **JSONB Columns**: CSV JSON strings are pre-validated but must be cast: `column::JSONB`. Handle NULLs with `COALESCE(column::JSONB, '{}'::JSONB)`.

5. **Foreign Key Constraints**: Some FKs are added AFTER table creation to handle circular dependencies. Follow the exact order in Step 9 of schema creation.

6. **Application-Level Validation**: Fields that can reference either `patients_and_guardians` or `clinicians` must be validated in application code, not database constraints.

7. **clinician_availabilities.user_id**: This is INTEGER and references `clinicians.healthie_id`, NOT `clinicians.id`. This is a legacy design from parquet export.

8. **Market ID**: Always use UUID `'00000000-0000-0000-0000-000000000001'` for `market_id` in `referrals` and `organizations`.

9. **Soft Deletes**: The `_fivetran_deleted` flag is used for soft deletes. Filter with `WHERE _fivetran_deleted = false` in queries.

10. **GIN Indexes**: Create GIN indexes AFTER data import for better performance. They can be slow to build on large datasets.

11. **Transaction Management**: Wrap schema creation and data import in transactions for rollback capability.

12. **Connection Pooling**: Use PgBouncer in transaction mode for connection pooling. Set appropriate pool sizes based on expected load.

### Common Pitfalls to Avoid

- **Don't** create foreign key constraints before all referenced tables exist
- **Don't** import data in wrong order (respect dependencies)
- **Don't** forget to convert dates to TIMESTAMPTZ
- **Don't** forget to set market_id to the specified UUID
- **Don't** create indexes before data import (slower, but can be done)
- **Don't** forget to handle NULL values in JSONB and array conversions
- **Don't** assume all UUIDs in CSV are valid - validate during import

## Migration Checklist

- [ ] Review and approve schema design
- [ ] Set up development database
- [ ] Create schema creation scripts (following exact order)
- [ ] Test schema with sample data
- [ ] Create data import scripts for all 16 CSV files
- [ ] Validate data integrity using provided queries
- [ ] Set up database roles and permissions
- [ ] Configure environment variables
- [ ] Set up monitoring
- [ ] Document API/data access patterns
- [ ] Train team on schema structure
- [ ] Plan for future schema evolution
- [ ] Test rollback procedures
- [ ] Create backup strategy

