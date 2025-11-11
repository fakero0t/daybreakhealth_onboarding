-- PR 3: Relationship and Assessment Tables
-- Description: Create tables for user relationships and mental health assessments
-- Dependencies: PR 2 (core user tables)
--
-- IMPORTANT: The user_0_id and user_1_id in kinships, and subject_id/respondent_id
-- in questionnaires can reference either patients_and_guardians or clinicians.
-- These are validated at the application level since PostgreSQL doesn't support
-- foreign keys to multiple tables.
--
-- Usage:
--   psql -U <superuser> -d daybreak_health -f migrations/003_create_relationship_assessment_tables.sql

-- ============================================================================
-- STEP 1: Create kinships Table
-- ============================================================================

CREATE TABLE kinships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_0_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    user_1_id UUID NOT NULL, -- references patients_and_guardians(id) or clinicians(id) - validated at application level
    kind INTEGER NOT NULL, -- relationship type
    user_0_label INTEGER NOT NULL, -- 1=guardian, 2=child, 12=both
    user_1_label INTEGER NOT NULL, -- 1=guardian, 2=child, 12=both
    guardian_can_be_contacted BOOLEAN DEFAULT false,
    migration_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    _fivetran_deleted BOOLEAN DEFAULT false,
    _fivetran_synced TIMESTAMPTZ,
    UNIQUE(user_0_id, user_1_id)
);

-- ============================================================================
-- STEP 2: Create questionnaires Table
-- ============================================================================

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

-- ============================================================================
-- STEP 3: Create Indexes for kinships
-- ============================================================================

-- Index on user_0_id for relationship lookups
CREATE INDEX idx_kinships_user_0 ON kinships(user_0_id);

-- Index on user_1_id for relationship lookups
CREATE INDEX idx_kinships_user_1 ON kinships(user_1_id);

-- ============================================================================
-- STEP 4: Create Indexes for questionnaires
-- ============================================================================

-- Index on subject_id for finding questionnaires by subject
CREATE INDEX idx_questionnaires_subject ON questionnaires(subject_id);

-- Index on respondent_id for finding questionnaires by respondent
CREATE INDEX idx_questionnaires_respondent ON questionnaires(respondent_id);

-- Index on type for filtering by questionnaire type
CREATE INDEX idx_questionnaires_type ON questionnaires(type);

-- Index on completed_at for finding completed questionnaires by date
CREATE INDEX idx_questionnaires_completed_at ON questionnaires(completed_at);

-- ============================================================================
-- STEP 5: Add CHECK Constraints
-- ============================================================================

-- CHECK constraint for user_0_label enum values: 1=guardian, 2=child, 12=both
ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_0_label 
    CHECK (user_0_label IN (1, 2, 12));

-- CHECK constraint for user_1_label enum values: 1=guardian, 2=child, 12=both
ALTER TABLE kinships ADD CONSTRAINT chk_kinships_user_1_label 
    CHECK (user_1_label IN (1, 2, 12));

-- CHECK constraint for questionnaire type: 3=standard, 4=extended
ALTER TABLE questionnaires ADD CONSTRAINT chk_questionnaires_type 
    CHECK (type IN (3, 4));

-- ============================================================================
-- STEP 6: Grant Table Permissions
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT, UPDATE, DELETE ON kinships, questionnaires TO daybreak_app;

-- Grant read-only permissions
GRANT SELECT ON kinships, questionnaires TO daybreak_readonly;

-- Grant all permissions to admin role
GRANT ALL PRIVILEGES ON kinships, questionnaires TO daybreak_admin;

-- ============================================================================
-- STEP 7: Record Migration
-- ============================================================================

INSERT INTO schema_migrations (version, description)
VALUES ('003_create_relationship_assessment_tables', 'Create relationship and assessment tables (kinships, questionnaires) with indexes and constraints')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('kinships', 'questionnaires');

-- Verify indexes exist:
-- SELECT indexname, tablename FROM pg_indexes 
-- WHERE tablename IN ('kinships', 'questionnaires') 
-- ORDER BY tablename, indexname;

-- Verify CHECK constraints:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text IN ('kinships', 'questionnaires') 
-- AND contype = 'c';

-- Verify UNIQUE constraint on kinships:
-- SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid::regclass::text = 'kinships' 
-- AND contype = 'u';

-- Test insert with valid enum values (requires existing user IDs):
-- INSERT INTO kinships (user_0_id, user_1_id, kind, user_0_label, user_1_label)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID,
--     1,
--     1, -- guardian
--     2  -- child
-- ) RETURNING id, created_at;
--
-- INSERT INTO questionnaires (subject_id, respondent_id, type, question_answers)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID,
--     3, -- standard
--     '{"question_1": "answer_1"}'::JSONB
-- ) RETURNING id, created_at;

-- Test invalid enum values (should fail):
-- INSERT INTO kinships (user_0_id, user_1_id, kind, user_0_label, user_1_label)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID,
--     1,
--     99, -- invalid value
--     2
-- );
-- -- Expected: ERROR: new row for relation "kinships" violates check constraint

-- Test UNIQUE constraint (should fail on duplicate):
-- INSERT INTO kinships (user_0_id, user_1_id, kind, user_0_label, user_1_label)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID,
--     1,
--     1,
--     2
-- );
-- -- Expected: ERROR: duplicate key value violates unique constraint

-- Test JSONB column:
-- INSERT INTO questionnaires (subject_id, respondent_id, type, question_answers)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001'::UUID,
--     '00000000-0000-0000-0000-000000000002'::UUID,
--     4, -- extended
--     '{"question_1": "answer_1", "question_2": "answer_2", "nested": {"key": "value"}}'::JSONB
-- ) RETURNING question_answers;
--
-- -- Query JSONB:
-- SELECT question_answers->'question_1' as q1_answer FROM questionnaires WHERE type = 4;

