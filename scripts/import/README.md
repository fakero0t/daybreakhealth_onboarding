# Data Import Scripts

This directory contains SQL scripts for importing CSV data into the Daybreak Health database.

## Import Order

**IMPORTANT**: Scripts must be run in this exact order to respect foreign key dependencies:

1. `import_clinician_credentialed_insurances.sql` - No dependencies
2. `import_organizations.sql` - No dependencies
3. `import_contracts.sql` - No dependencies
4. `import_org_contracts.sql` - Depends on organizations, contracts
5. `import_clinicians.sql` - No dependencies (but supervisor_id may reference other clinicians)
6. `import_patients_and_guardians.sql` - Depends on clinicians (for supervisor_id)
7. `import_kinships.sql` - Depends on patients_and_guardians, clinicians
8. `import_questionnaires.sql` - Depends on patients_and_guardians, clinicians
9. `import_insurance_coverages.sql` - Depends on patients_and_guardians, clinicians
10. `import_memberships.sql` - Depends on organizations, patients_and_guardians, clinicians
11. `import_referrals.sql` - Depends on organizations, contracts, questionnaires, clinicians
12. `import_referral_members.sql` - Depends on referrals, patients_and_guardians
13. `import_patient_availabilities.sql` - Depends on patients_and_guardians
14. `import_clinician_availabilities.sql` - Depends on clinicians (healthie_id)
15. `import_clinician_insurance_affiliations.sql` - Depends on clinicians, clinician_credentialed_insurances
16. `import_documents.sql` - No dependencies

## Usage

### Prerequisites
- All migrations (PR 1-9) must be completed
- CSV files must be in the `Daybreak Health Test Cases/` directory
- PostgreSQL user must have appropriate permissions

### Running Imports

**Option 1: SQL Scripts (Local or Server with File Access)**

For local development or when CSV files are accessible on the database server:

```bash
# Update the CSV path in the script first, then:
psql -U <username> -d daybreak_health -f scripts/import/import_clinician_credentialed_insurances.sql
```

**Option 2: Node.js Script (Recommended for Deployed Databases)**

For deployed databases where you can't easily place files on the server, use the Node.js script:

```bash
# Set environment variables
export DB_HOST=your-db-host
export DB_PORT=5432
export DB_NAME=daybreak_health
export DB_USER=daybreak_app
export DB_PASSWORD=your-password
export DB_SSL=true  # For deployed databases

# Optional: Override CSV path
export CSV_PATH=/path/to/credentialed_insurances.csv

# Run the import
node scripts/import/import-clinician-credentialed-insurances.js
```

The Node.js script:
- Reads CSV from your local filesystem or any accessible path
- Connects to the database using environment variables
- Handles all data transformations automatically
- Provides progress updates and error reporting
- Works with both local and deployed databases

**Option 3: Run all imports in order (SQL scripts)**
```bash
cd scripts/import
for script in $(cat import_order.txt); do
    psql -U <username> -d daybreak_health -f "$script"
done
```

**Option 4: Run interactively in psql**
```sql
\c daybreak_health
\i scripts/import/import_clinician_credentialed_insurances.sql
\i scripts/import/import_organizations.sql
-- ... continue with remaining scripts
```

## CSV File Paths

**SQL Scripts:**
- Default location: `../Daybreak Health Test Cases/`
- Update the `COPY` command path in each script to match your environment
- For deployed databases, upload CSV to server and update path accordingly

**Node.js Scripts:**
- Default location: `Daybreak Health Test Cases/` (relative to project root)
- Override with `CSV_PATH` environment variable
- Works with any accessible file path (local or remote)

## Data Transformations

Each import script handles:
- UUID conversions from string format
- JSONB parsing from JSON strings
- TEXT[] array conversions from comma-separated strings
- TIMESTAMPTZ standardization from various date formats
- NULL value handling
- Filtering out `_fivetran_deleted = true` records
- Setting `market_id` to `'00000000-0000-0000-0000-000000000001'` where applicable

## Validation

After importing all data, run the validation script:
```bash
psql -U <username> -d daybreak_health -f scripts/validation/validate_data.sql
```

## Troubleshooting

**Error: "relation does not exist"**
- Ensure all migrations (PR 1-9) have been run
- Check that you're connected to the correct database

**Error: "permission denied"**
- Ensure you're running as a user with INSERT permissions
- Check that the daybreak_app role has been granted appropriate permissions

**Error: "invalid input syntax for type uuid"**
- Check CSV data for malformed UUIDs
- Verify UUID format in CSV matches PostgreSQL UUID format

**Error: "invalid input syntax for type jsonb"**
- Check CSV JSON strings are valid JSON
- Note: CSV data is pre-validated, so this should be rare

**Error: "violates foreign key constraint"**
- Ensure you're importing in the correct order
- Check that referenced records exist in parent tables

## Rollback

To remove imported data (but keep schema):
```sql
TRUNCATE TABLE documents, clinician_insurance_affiliations, clinician_availabilities, 
    patient_availabilities, referral_members, referrals, memberships, 
    insurance_coverages, questionnaires, kinships, patients_and_guardians, 
    clinicians, org_contracts, contracts, organizations, clinician_credentialed_insurances 
CASCADE;
```

Note: This will delete all data but preserve the schema structure.

