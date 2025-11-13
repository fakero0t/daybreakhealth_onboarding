-- PR 10: Demographics Table
-- Description: Create demographics table for patient intake form data
-- Dependencies: PR 2 (patients_and_guardians table)
--
-- IMPORTANT: This migration creates the demographics table to store patient
-- demographic information collected during the onboarding process.
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/010_create_demographics_table.sql

-- ============================================================================
-- STEP 1: Create demographics Table
-- ============================================================================

CREATE TABLE demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients_and_guardians(id) ON DELETE CASCADE,
    
    -- Basic Information
    legal_name VARCHAR(100),
    preferred_name VARCHAR(100),
    gender_assigned_at_birth VARCHAR(50),
    gender_other_text VARCHAR(100),
    pronouns VARCHAR(50),
    
    -- Guardian Information
    guardian_name VARCHAR(100),
    shared_parenting_agreement VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    shared_parenting_details TEXT CHECK (char_length(shared_parenting_details) <= 500),
    custody_concerns VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    custody_concerns_details TEXT CHECK (char_length(custody_concerns_details) <= 500),
    
    -- Education
    school_name VARCHAR(200),
    current_grade VARCHAR(50),
    has_iep_504 VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    iep_504_details TEXT CHECK (char_length(iep_504_details) <= 500),
    behavioral_academic_concerns VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    behavioral_academic_details TEXT CHECK (char_length(behavioral_academic_details) <= 500),
    
    -- Developmental History
    complications_prior_birth VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    complications_prior_details TEXT CHECK (char_length(complications_prior_details) <= 500),
    complications_at_birth VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    complications_birth_details TEXT CHECK (char_length(complications_birth_details) <= 500),
    milestones_met VARCHAR(50), -- 'yes', 'no', 'prefer_not_to_answer', null
    milestones_details TEXT CHECK (char_length(milestones_details) <= 500),
    
    -- Life Changes (stored as JSON array)
    life_changes JSONB DEFAULT '[]', -- Array of selected options
    life_changes_other_text TEXT CHECK (char_length(life_changes_other_text) <= 500),
    
    -- Activities and Interests
    has_part_time_job BOOLEAN,
    has_extracurriculars BOOLEAN,
    extracurriculars_details TEXT CHECK (char_length(extracurriculars_details) <= 500),
    fun_activities TEXT CHECK (char_length(fun_activities) <= 500),
    spirituality VARCHAR(50), -- 'yes', 'no', 'complicated', 'prefer_not_to_answer', null
    
    -- Metadata
    completed BOOLEAN DEFAULT false,
    sections_completed JSONB DEFAULT '[]', -- Array of completed section names
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID, -- Could reference patients_and_guardians or clinicians
    updated_by UUID -- Could reference patients_and_guardians or clinicians
);

-- ============================================================================
-- STEP 2: Create Indexes
-- ============================================================================

-- Index on patient_id for foreign key lookups (most common query pattern)
CREATE INDEX idx_demographics_patient_id ON demographics(patient_id);

-- Index on completed for filtering incomplete forms
CREATE INDEX idx_demographics_completed ON demographics(completed);

-- Index on updated_at for sorting by recency
CREATE INDEX idx_demographics_updated_at ON demographics(updated_at DESC);

-- GIN index on life_changes for JSON queries
CREATE INDEX idx_demographics_life_changes ON demographics USING GIN(life_changes);

-- GIN index on sections_completed for JSON queries
CREATE INDEX idx_demographics_sections_completed ON demographics USING GIN(sections_completed);

-- Unique constraint to ensure one demographics record per patient
CREATE UNIQUE INDEX idx_demographics_patient_unique ON demographics(patient_id);

-- ============================================================================
-- STEP 3: Create Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_demographics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_demographics_updated_at
    BEFORE UPDATE ON demographics
    FOR EACH ROW
    EXECUTE FUNCTION update_demographics_updated_at();

-- ============================================================================
-- STEP 4: Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE demographics IS 'Stores demographic and background information collected during patient onboarding';
COMMENT ON COLUMN demographics.patient_id IS 'References the patient this demographic data belongs to';
COMMENT ON COLUMN demographics.life_changes IS 'JSON array of selected life change events (e.g., ["frequent_moves", "death_of_relative"])';
COMMENT ON COLUMN demographics.sections_completed IS 'JSON array of completed section names for tracking progress (e.g., ["basic_information", "education"])';
COMMENT ON COLUMN demographics.completed IS 'Indicates if the entire demographics form has been completed';
COMMENT ON COLUMN demographics.gender_assigned_at_birth IS 'Can be "male", "female", "intersex", "prefer_not_to_answer", or "other"';
COMMENT ON COLUMN demographics.pronouns IS 'Can be "she/hers", "he/his", "they/them", "ze/zer", "ask me", or "prefer_not_to_answer"';

-- ============================================================================
-- STEP 5: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON demographics TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON demographics TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON demographics TO daybreak_admin;

-- Grant sequence permissions for UUID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO daybreak_app, daybreak_readonly;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO daybreak_admin;

-- ============================================================================
-- STEP 6: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('010_create_demographics_table', 'Create demographics table for patient intake form with indexes, triggers, and permissions')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'demographics';

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename = 'demographics' 
-- ORDER BY indexname;

-- Verify trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'demographics';

-- Verify constraints:
-- SELECT conname, contype FROM pg_constraint 
-- WHERE conrelid = 'demographics'::regclass;

-- Test insert (remove after testing):
-- INSERT INTO demographics (patient_id, legal_name, preferred_name, completed) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test Patient', 'Testy', false) 
-- RETURNING id, created_at, updated_at;
--
-- Test update trigger:
-- UPDATE demographics SET legal_name = 'Updated Test' 
-- WHERE legal_name = 'Test Patient' 
-- RETURNING id, updated_at;
--
-- Clean up test data:
-- DELETE FROM demographics WHERE legal_name IN ('Test Patient', 'Updated Test');


