# Daybreak Health Database Implementation - Task List

This document breaks down the database PRD into pull request-sized implementation tasks that can be executed in sequential order. Each PR is designed to be independently reviewable and testable.

---

## PR 1: Database Initialization and Extensions

**PR Title**: `feat(db): Initialize database and enable required extensions`

**Description**: Set up the PostgreSQL database instance with all required extensions and initial configuration.

**Implementation Details**:
- Create database: `CREATE DATABASE daybreak_health;`
- Enable required extensions:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search
  CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for PII encryption
  ```
- Create database roles:
  ```sql
  CREATE ROLE daybreak_app WITH LOGIN PASSWORD '<secure_password>';
  CREATE ROLE daybreak_readonly WITH LOGIN PASSWORD '<secure_password>';
  CREATE ROLE daybreak_admin WITH LOGIN PASSWORD '<secure_password>' SUPERUSER;
  ```
- Grant initial permissions:
  ```sql
  GRANT CONNECT ON DATABASE daybreak_health TO daybreak_app;
  GRANT CONNECT ON DATABASE daybreak_health TO daybreak_readonly;
  GRANT ALL PRIVILEGES ON DATABASE daybreak_health TO daybreak_admin;
  ```
- Create migration tracking table (optional, for future migrations):
  ```sql
  CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

**Files to Create**:
- `migrations/001_initialize_database.sql`

**Acceptance Criteria**:
- [ ] Database `daybreak_health` created successfully
- [ ] All three extensions enabled and verified
- [ ] All three database roles created
- [ ] Initial permissions granted
- [ ] Can connect to database with each role
- [ ] Migration tracking table created (if included)

**Testing**:
- Verify extensions are available: `SELECT * FROM pg_extension;`
- Verify roles exist: `SELECT rolname FROM pg_roles WHERE rolname LIKE 'daybreak%';`
- Test connection with each role

---

## PR 2: Core User Tables

**PR Title**: `feat(db): Create core user tables (patients_and_guardians, clinicians)`

**Description**: Create the two primary user tables with all columns, indexes, and basic constraints.

**Implementation Details**:
- Create `patients_and_guardians` table with all columns from PRD
- Create `clinicians` table with all columns from PRD
- Create all indexes for both tables:
  - `idx_patients_guardians_email`
  - `idx_patients_guardians_role`
  - `idx_patients_guardians_system_labels` (GIN)
  - `idx_patients_guardians_supabase_id`
  - `idx_patients_guardians_supervisor`
  - `idx_clinicians_email`
  - `idx_clinicians_healthie_id`
  - `idx_clinicians_system_labels` (GIN)
  - `idx_clinicians_supervisor`
- Add CHECK constraint for `patients_and_guardians.role` (if needed, though only value is 1)
- Grant table permissions to roles:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON patients_and_guardians, clinicians TO daybreak_app;
  GRANT SELECT ON patients_and_guardians, clinicians TO daybreak_readonly;
  GRANT ALL PRIVILEGES ON patients_and_guardians, clinicians TO daybreak_admin;
  ```

**Files to Create**:
- `migrations/002_create_core_user_tables.sql`

**Dependencies**: PR 1

**Acceptance Criteria**:
- [ ] `patients_and_guardians` table created with all columns
- [ ] `clinicians` table created with all columns
- [ ] All indexes created successfully
- [ ] GIN indexes created for array columns
- [ ] Table permissions granted
- [ ] Can insert test records into both tables
- [ ] UUIDs generate automatically
- [ ] Default values work correctly

**Testing**:
- Insert test records into both tables
- Verify UUID generation
- Verify default values (created_at, updated_at, _fivetran_deleted)
- Test index performance with sample queries
- Verify GIN indexes work for array searches

---

## PR 3: Relationship and Assessment Tables

**PR Title**: `feat(db): Create relationship and assessment tables (kinships, questionnaires)`

**Description**: Create tables for user relationships and mental health assessments.

**Implementation Details**:
- Create `kinships` table with all columns
- Create `questionnaires` table with all columns
- Create indexes:
  - `idx_kinships_user_0`
  - `idx_kinships_user_1`
  - `idx_questionnaires_subject`
  - `idx_questionnaires_respondent`
  - `idx_questionnaires_type`
  - `idx_questionnaires_completed_at`
- Add CHECK constraints:
  ```sql
  ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_0_label 
      CHECK (user_0_label IN (1, 2, 12));
  ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_1_label 
      CHECK (user_1_label IN (1, 2, 12));
  ALTER TABLE questionnaires ADD CONSTRAINT chk_questionnaires_type 
      CHECK (type IN (3, 4));
  ```
- Add UNIQUE constraint on `kinships(user_0_id, user_1_id)`
- Grant table permissions

**Files to Create**:
- `migrations/003_create_relationship_assessment_tables.sql`

**Dependencies**: PR 2

**Acceptance Criteria**:
- [ ] `kinships` table created with all columns
- [ ] `questionnaires` table created with all columns
- [ ] All indexes created
- [ ] CHECK constraints added and enforced
- [ ] UNIQUE constraint on kinships works
- [ ] Can insert test records
- [ ] Invalid enum values are rejected

**Testing**:
- Insert valid test records
- Attempt to insert invalid enum values (should fail)
- Test UNIQUE constraint on kinships
- Verify JSONB columns accept valid JSON
- Test indexes with sample queries

---

## PR 4: Insurance Tables

**PR Title**: `feat(db): Create insurance tables (clinician_credentialed_insurances, insurance_coverages)`

**Description**: Create tables for insurance companies and patient insurance coverage.

**Implementation Details**:
- Create `clinician_credentialed_insurances` table with all columns
- Create `insurance_coverages` table with all columns
- Create indexes:
  - `idx_clin_cred_insurances_name`
  - `idx_clin_cred_insurances_state`
  - `idx_insurance_coverages_user`
  - `idx_insurance_coverages_eligibility`
  - `idx_insurance_coverages_labels` (GIN)
  - `idx_insurance_coverages_created_by`
  - `idx_insurance_coverages_company_name`
- Add CHECK constraints:
  ```sql
  ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_kind 
      CHECK (kind IN (0, 2));
  ALTER TABLE insurance_coverages ADD CONSTRAINT chk_insurance_coverages_eligibility 
      CHECK (eligibility IN (0, 2, 4, 6));
  ```
- Add self-referential foreign key on `clinician_credentialed_insurances`:
  ```sql
  ALTER TABLE clinician_credentialed_insurances ADD CONSTRAINT fk_parent_insurance 
      FOREIGN KEY (parent_credentialed_insurance_id) 
      REFERENCES clinician_credentialed_insurances(id);
  ```
- Grant table permissions

**Files to Create**:
- `migrations/004_create_insurance_tables.sql`

**Dependencies**: PR 2

**Acceptance Criteria**:
- [ ] `clinician_credentialed_insurances` table created
- [ ] `insurance_coverages` table created
- [ ] All indexes created (including GIN for system_labels)
- [ ] CHECK constraints added and enforced
- [ ] Self-referential FK on clinician_credentialed_insurances works
- [ ] Can insert test records
- [ ] Invalid enum values are rejected

**Testing**:
- Insert valid test records
- Test self-referential FK (parent insurance)
- Attempt to insert invalid enum values (should fail)
- Test GIN index on system_labels
- Verify JSONB columns work correctly

---

## PR 5: Organization and Contract Tables

**PR Title**: `feat(db): Create organization and contract tables (organizations, contracts, org_contracts)`

**Description**: Create tables for organizations, contracts, and their relationships.

**Implementation Details**:
- Create `organizations` table with all columns
- Create `contracts` table with all columns
- Create `org_contracts` junction table
- Create indexes:
  - `idx_orgs_parent`
  - `idx_orgs_kind`
  - `idx_orgs_slug`
  - `idx_contracts_dates`
  - `idx_org_contracts_org`
  - `idx_org_contracts_contract`
- Add CHECK constraint:
  ```sql
  ALTER TABLE organizations ADD CONSTRAINT chk_organizations_kind 
      CHECK (kind IN (1, 2));
  ```
- Add UNIQUE constraint on `org_contracts(organization_id, contract_id)`
- Add foreign keys:
  ```sql
  ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_org 
      FOREIGN KEY (organization_id) REFERENCES organizations(id);
  ALTER TABLE org_contracts ADD CONSTRAINT fk_org_contracts_contract 
      FOREIGN KEY (contract_id) REFERENCES contracts(id);
  ```
- Add self-referential FK on organizations (after table creation):
  ```sql
  ALTER TABLE organizations ADD CONSTRAINT fk_org_parent 
      FOREIGN KEY (parent_organization_id) REFERENCES organizations(id);
  ```
- Grant table permissions

**Files to Create**:
- `migrations/005_create_organization_contract_tables.sql`

**Dependencies**: PR 2

**Acceptance Criteria**:
- [ ] `organizations` table created
- [ ] `contracts` table created
- [ ] `org_contracts` junction table created
- [ ] All indexes created
- [ ] CHECK constraint on organizations.kind enforced
- [ ] UNIQUE constraint on org_contracts works
- [ ] Foreign keys work correctly
- [ ] Self-referential FK on organizations works
- [ ] Can insert test records

**Testing**:
- Insert test organizations (districts and schools)
- Insert test contracts
- Link organizations to contracts via org_contracts
- Test self-referential relationship (parent organizations)
- Verify UNIQUE constraint prevents duplicates
- Test invalid enum values are rejected

---

## PR 6: Referral Tables

**PR Title**: `feat(db): Create referral tables (referrals, referral_members)`

**Description**: Create tables for care requests and referral tracking.

**Implementation Details**:
- Create `referrals` table with all columns
- Create `referral_members` table with all columns
- Create indexes:
  - `idx_referrals_submitter`
  - `idx_referrals_organization`
  - `idx_referrals_contract`
  - `idx_referrals_status` (GIN)
  - `idx_referrals_onboarding_completed`
  - `idx_referral_members_referral`
  - `idx_referral_members_user`
- Add CHECK constraint:
  ```sql
  ALTER TABLE referrals ADD CONSTRAINT chk_referrals_service_kind 
      CHECK (service_kind IN (1, 2, 3));
  ```
- Add UNIQUE constraint on `referral_members(referral_id, user_id)`
- Add foreign keys:
  ```sql
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_organization 
      FOREIGN KEY (organization_id) REFERENCES organizations(id);
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_contract 
      FOREIGN KEY (contract_id) REFERENCES contracts(id);
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_intake 
      FOREIGN KEY (intake_id) REFERENCES questionnaires(id);
  ALTER TABLE referral_members ADD CONSTRAINT fk_referral_members_referral 
      FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE;
  ```
- Grant table permissions

**Files to Create**:
- `migrations/006_create_referral_tables.sql`

**Dependencies**: PR 2, PR 3, PR 5

**Acceptance Criteria**:
- [ ] `referrals` table created
- [ ] `referral_members` table created
- [ ] All indexes created (including GIN for system_labels)
- [ ] CHECK constraint enforced
- [ ] UNIQUE constraint on referral_members works
- [ ] Foreign keys work correctly
- [ ] ON DELETE CASCADE works on referral_members
- [ ] Can insert test records

**Testing**:
- Insert test referrals linked to organizations and contracts
- Link referrals to questionnaires (intake_id)
- Add referral members
- Test ON DELETE CASCADE (delete referral, verify members deleted)
- Test GIN index on system_labels
- Verify invalid enum values are rejected

---

## PR 7: Membership and Availability Tables

**PR Title**: `feat(db): Create membership and availability tables (memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations)`

**Description**: Create tables for user memberships, availability, and clinician insurance affiliations.

**Implementation Details**:
- Create `memberships` table with all columns
- Create `patient_availabilities` table with all columns
- Create `clinician_availabilities` table with all columns (note: INTEGER id and user_id)
- Create `clinician_insurance_affiliations` junction table
- Create indexes:
  - `idx_memberships_user`
  - `idx_memberships_org`
  - `idx_patient_avail_user`
  - `idx_patient_avail_availability` (GIN)
  - `idx_clinician_avail_user`
  - `idx_clinician_avail_range`
  - `idx_clin_ins_aff_clinician`
  - `idx_clin_ins_aff_insurance`
- Add UNIQUE constraints:
  ```sql
  ALTER TABLE memberships ADD CONSTRAINT uk_memberships_user_org 
      UNIQUE(user_id, organization_id);
  ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT uk_clin_ins_aff 
      UNIQUE(care_provider_profile_id, credentialed_insurance_id);
  ```
- Add foreign keys:
  ```sql
  ALTER TABLE memberships ADD CONSTRAINT fk_memberships_org 
      FOREIGN KEY (organization_id) REFERENCES organizations(id);
  ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_insurance 
      FOREIGN KEY (credentialed_insurance_id) REFERENCES clinician_credentialed_insurances(id);
  ```
- Grant table permissions

**Files to Create**:
- `migrations/007_create_membership_availability_tables.sql`

**Dependencies**: PR 2, PR 4, PR 5

**Acceptance Criteria**:
- [ ] `memberships` table created
- [ ] `patient_availabilities` table created
- [ ] `clinician_availabilities` table created (with INTEGER types)
- [ ] `clinician_insurance_affiliations` table created
- [ ] All indexes created (including GIN for availability JSONB)
- [ ] UNIQUE constraints work
- [ ] Foreign keys work correctly
- [ ] Can insert test records

**Testing**:
- Insert test memberships
- Insert test availability records (JSONB)
- Insert clinician availabilities (note INTEGER user_id references healthie_id)
- Link clinicians to insurances via affiliations
- Test GIN index on availability JSONB
- Verify UNIQUE constraints prevent duplicates
- Test foreign key relationships

---

## PR 8: Supporting Tables, Views, and Cross-Table Constraints

**PR Title**: `feat(db): Create supporting tables, users view, and cross-table foreign keys`

**Description**: Create documents table, users view, and add remaining foreign key constraints.

**Implementation Details**:
- Create `documents` table with all columns
- Create indexes:
  - `idx_documents_label`
  - `idx_documents_version`
- Create `users` view (optional, for unified queries):
  ```sql
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
      title, preferred_language, preferred_pronoun, self_gender, legal_gender,
      birthdate, profile_data, supervisor_id, clinical_associate, licenses,
      licensed_states, care_provider_status, system_labels, NULL as supabase_id,
      NULL as supabase_metadata, address, healthie_id, NULL as openpm_reference_id,
      account_status, NULL as openpm_policyholder_id, NULL as zendesk_id, NULL as latest_ticket,
      created_at, updated_at, _fivetran_deleted, _fivetran_synced,
      2 as user_type
  FROM clinicians;
  ```
- Add cross-table foreign key constraints:
  ```sql
  -- Self-referential FKs
  ALTER TABLE clinicians ADD CONSTRAINT fk_clinicians_supervisor 
      FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);
  
  -- Cross-table FKs
  ALTER TABLE patients_and_guardians ADD CONSTRAINT fk_patients_guardians_supervisor 
      FOREIGN KEY (supervisor_id) REFERENCES clinicians(id);
  ALTER TABLE referrals ADD CONSTRAINT fk_referrals_care_provider 
      FOREIGN KEY (care_provider_id) REFERENCES clinicians(id);
  ALTER TABLE clinician_insurance_affiliations ADD CONSTRAINT fk_clin_ins_aff_clinician 
      FOREIGN KEY (care_provider_profile_id) REFERENCES clinicians(id);
  ```
- Grant permissions on documents table and users view

**Files to Create**:
- `migrations/008_create_supporting_tables_views_constraints.sql`

**Dependencies**: PR 2, PR 4, PR 6, PR 7

**Acceptance Criteria**:
- [ ] `documents` table created
- [ ] All indexes on documents created
- [ ] `users` view created and queryable
- [ ] All cross-table foreign keys added
- [ ] Self-referential FK on clinicians works
- [ ] Can query users view successfully
- [ ] Foreign key constraints enforce referential integrity

**Testing**:
- Insert test documents
- Query users view and verify it returns data from both tables
- Test cross-table foreign keys (e.g., set supervisor_id to valid clinician)
- Attempt to set invalid foreign keys (should fail)
- Test self-referential relationship on clinicians

---

## PR 9: Triggers and Functions

**PR Title**: `feat(db): Create triggers for updated_at timestamps`

**Description**: Create trigger function and apply it to all tables with updated_at columns.

**Implementation Details**:
- Create trigger function:
  ```sql
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
  END;
  $$ language 'plpgsql';
  ```
- Create triggers for all 16 tables:
  ```sql
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
- Grant execute permission on function:
  ```sql
  GRANT EXECUTE ON FUNCTION update_updated_at_column() TO daybreak_app;
  ```

**Files to Create**:
- `migrations/009_create_triggers.sql`

**Dependencies**: PR 2, PR 3, PR 4, PR 5, PR 6, PR 7, PR 8

**Acceptance Criteria**:
- [ ] Trigger function created
- [ ] All 16 triggers created
- [ ] Function has execute permissions
- [ ] Triggers fire on UPDATE
- [ ] updated_at column updates automatically
- [ ] created_at remains unchanged on update

**Testing**:
- Insert test records
- Update records and verify updated_at changes
- Verify created_at does not change
- Test with all 16 tables
- Verify triggers work with daybreak_app role

---

## PR 10: Data Import Scripts and Validation

**PR Title**: `feat(db): Create data import scripts and validation queries`

**Description**: Create comprehensive CSV import scripts for all 16 tables and data validation queries.

**Implementation Details**:
- Create import script template/function for each CSV file:
  - `patients_and_guardians_anonymized.csv` → `patients_and_guardians`
  - `clinicians_anonymized.csv` → `clinicians`
  - `kinships.csv` → `kinships`
  - `questionnaires.csv` → `questionnaires`
  - `clinician_credentialed_insurances.csv` → `clinician_credentialed_insurances`
  - `insurance_coverages.csv` → `insurance_coverages`
  - `referrals.csv` → `referrals`
  - `referral_members.csv` → `referral_members`
  - `orgs.csv` → `organizations`
  - `contracts.csv` → `contracts`
  - `org_contracts.csv` → `org_contracts`
  - `memberships.csv` → `memberships`
  - `patient_availabilities.csv` → `patient_availabilities`
  - `clinician_availabilities.csv` → `clinician_availabilities`
  - `documents.csv` → `documents`
- Each import script should:
  - Create staging table
  - Use COPY command to load CSV
  - Transform data types (UUID, JSONB, TEXT[], TIMESTAMPTZ)
  - Handle NULL values
  - Set market_id to '00000000-0000-0000-0000-000000000001' where applicable
  - Filter out _fivetran_deleted = true records
  - Insert into target table
  - Drop staging table
- Create validation queries script:
  ```sql
  -- Orphaned records checks
  -- Invalid enum values checks
  -- NULL required fields checks
  -- JSONB validation checks
  -- Referential integrity checks
  ```
- Create import order documentation (respecting dependencies)
- Create rollback script template

**Files to Create**:
- `scripts/import/import_patients_and_guardians.sql`
- `scripts/import/import_clinicians.sql`
- `scripts/import/import_kinships.sql`
- `scripts/import/import_questionnaires.sql`
- `scripts/import/import_clinician_credentialed_insurances.sql`
- `scripts/import/import_insurance_coverages.sql`
- `scripts/import/import_referrals.sql`
- `scripts/import/import_referral_members.sql`
- `scripts/import/import_organizations.sql`
- `scripts/import/import_contracts.sql`
- `scripts/import/import_org_contracts.sql`
- `scripts/import/import_memberships.sql`
- `scripts/import/import_patient_availabilities.sql`
- `scripts/import/import_clinician_availabilities.sql`
- `scripts/import/import_documents.sql`
- `scripts/validation/validate_data.sql`
- `scripts/import/README.md` (import order and instructions)

**Dependencies**: PR 2, PR 3, PR 4, PR 5, PR 6, PR 7, PR 8, PR 9

**Acceptance Criteria**:
- [ ] Import scripts created for all 16 CSV files
- [ ] Each script handles data type conversions correctly
- [ ] Date standardization to TIMESTAMPTZ works
- [ ] JSONB parsing works
- [ ] Array conversions work
- [ ] market_id set correctly
- [ ] Validation queries created
- [ ] Import order documented
- [ ] Scripts can be run in correct order

**Testing**:
- Run import scripts in order with test CSV files
- Verify all data imports correctly
- Run validation queries and verify no errors
- Test with sample data
- Verify data types are correct
- Verify foreign key relationships maintained
- Test rollback procedures

---

## Implementation Order Summary

1. **PR 1**: Database initialization and extensions
2. **PR 2**: Core user tables (patients_and_guardians, clinicians)
3. **PR 3**: Relationship and assessment tables (kinships, questionnaires)
4. **PR 4**: Insurance tables (clinician_credentialed_insurances, insurance_coverages)
5. **PR 5**: Organization and contract tables (organizations, contracts, org_contracts)
6. **PR 6**: Referral tables (referrals, referral_members)
7. **PR 7**: Membership and availability tables (memberships, patient_availabilities, clinician_availabilities, clinician_insurance_affiliations)
8. **PR 8**: Supporting tables, views, and cross-table constraints (documents, users view, FKs)
9. **PR 9**: Triggers and functions (updated_at triggers)
10. **PR 10**: Data import scripts and validation

Each PR builds on previous PRs and can be reviewed and merged independently. The final PR includes all data import capabilities and validation tools needed for production use.
