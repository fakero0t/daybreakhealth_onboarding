# Import Script Template

All import scripts follow this general pattern. Use this as a template when creating additional import scripts.

## Standard Pattern

```sql
BEGIN;

-- STEP 1: Create Staging Table
CREATE TEMP TABLE <table_name>_staging (LIKE <table_name> INCLUDING ALL);

-- STEP 2: Load CSV Data
COPY <table_name>_staging FROM '/path/to/CSV/file.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- STEP 3: Transform and Insert
INSERT INTO <table_name> (
    -- List all columns
)
SELECT 
    -- Transform data types:
    -- UUID: id::UUID or NULLIF(id, '')::UUID
    -- INTEGER: value::INTEGER or NULLIF(value, '')::INTEGER
    -- JSONB: COALESCE(value::JSONB, '{}'::JSONB) or COALESCE(value::JSONB, NULL)
    -- TEXT[]: string_to_array(value, ',')::TEXT[] (handle NULL/empty)
    -- TIMESTAMPTZ: COALESCE(value::TIMESTAMPTZ, NOW())
    -- BOOLEAN: COALESCE(value::BOOLEAN, false)
    -- DATE: NULLIF(value, '')::DATE
FROM <table_name>_staging
WHERE _fivetran_deleted = false OR _fivetran_deleted IS NULL;

-- STEP 4: Clean Up
DROP TABLE <table_name>_staging;

COMMIT;
```

## Key Transformations

### UUID Fields
```sql
NULLIF(column_name, '')::UUID
```

### JSONB Fields
```sql
-- For fields with default '{}'
COALESCE(column_name::JSONB, '{}'::JSONB)

-- For nullable JSONB fields
COALESCE(column_name::JSONB, NULL)
```

### Array Fields (TEXT[])
```sql
CASE 
    WHEN column_name IS NULL OR column_name = '' THEN NULL
    ELSE string_to_array(column_name, ',')::TEXT[]
END
```

### Timestamp Fields
```sql
COALESCE(column_name::TIMESTAMPTZ, NOW())
```

### Date Fields
```sql
NULLIF(column_name, '')::DATE
```

### Boolean Fields
```sql
COALESCE(column_name::BOOLEAN, false)
```

### Integer Fields
```sql
NULLIF(column_name, '')::INTEGER
-- or with default
COALESCE(column_name::INTEGER, 0)
```

## Special Cases

### market_id
Always set to: `'00000000-0000-0000-0000-000000000001'::UUID`
```sql
COALESCE(market_id::UUID, '00000000-0000-0000-0000-000000000001'::UUID)
```

### Filtering Deleted Records
Always include:
```sql
WHERE _fivetran_deleted = false OR _fivetran_deleted IS NULL
```

## Remaining Import Scripts Needed

Based on the import order in README.md, create scripts for:

1. ✅ `import_clinician_credentialed_insurances.sql` - Example provided
2. ✅ `import_organizations.sql` - Example provided  
3. `import_contracts.sql`
4. `import_org_contracts.sql`
5. `import_clinicians.sql`
6. ✅ `import_patients_and_guardians.sql` - Example provided
7. `import_kinships.sql`
8. `import_questionnaires.sql`
9. `import_insurance_coverages.sql`
10. `import_memberships.sql`
11. `import_referrals.sql`
12. `import_referral_members.sql`
13. `import_patient_availabilities.sql`
14. `import_clinician_availabilities.sql` (Note: INTEGER id/user_id)
15. `import_clinician_insurance_affiliations.sql`
16. `import_documents.sql`

Each script should follow the pattern above, adapting column names and transformations as needed.

