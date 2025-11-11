# Database Migrations

This directory contains SQL migration scripts for the Daybreak Health database schema.

## Setup Instructions

### Prerequisites
- PostgreSQL 14+ installed and running
- PostgreSQL superuser access (typically `postgres` user)

### Initial Setup

1. **Connect to PostgreSQL as superuser:**
   ```bash
   psql -U postgres
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE daybreak_health;
   ```

3. **Connect to the new database:**
   ```sql
   \c daybreak_health
   ```

4. **Run the migrations:**
   
   **Option A: Run all migrations at once (Recommended)**
   ```bash
   psql -U <superuser> -d daybreak_health -f migrations/000_master_migration.sql
   ```
   
   **Option B: Run interactively in psql**
   ```sql
   \i migrations/000_master_migration.sql
   ```

### Running Migrations

**Option 1: Run all migrations at once (Recommended)**

```bash
# From the project root directory
psql -U <superuser> -d daybreak_health -f migrations/000_master_migration.sql
```

This single command runs all 9 migrations in the correct order.

**Option 2: Run migrations individually**

Migrations should be run in sequential order:

```bash
# From the project root directory
psql -U <superuser> -d daybreak_health -f migrations/001_initialize_database.sql
psql -U <superuser> -d daybreak_health -f migrations/002_create_core_user_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/003_create_relationship_assessment_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/004_create_insurance_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/005_create_organization_contract_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/006_create_referral_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/007_create_membership_availability_tables.sql
psql -U <superuser> -d daybreak_health -f migrations/008_create_supporting_tables_views_constraints.sql
psql -U <superuser> -d daybreak_health -f migrations/009_create_triggers.sql
```

Or interactively in psql:

```sql
\c daybreak_health
\i migrations/001_initialize_database.sql
\i migrations/002_create_core_user_tables.sql
-- ... continue with remaining migrations
```

### Important Security Notes

⚠️ **BEFORE PRODUCTION USE:**

1. **Update all role passwords** in `001_initialize_database.sql`:
   - Replace `'CHANGE_ME_IN_PRODUCTION'` with secure passwords
   - Use environment variables or a secrets manager in production

2. **Review and adjust permissions** as needed for your security requirements

3. **Test migrations in a development/staging environment first**

### Verification

After running migrations, verify the setup:

```sql
-- Check extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'pgcrypto');

-- Check roles
SELECT rolname, rolsuper, rolcanlogin FROM pg_roles WHERE rolname LIKE 'daybreak%';

-- Check migration history
SELECT * FROM schema_migrations ORDER BY applied_at;
```

### Migration Order

Migrations must be run in this exact order:

1. `001_initialize_database.sql` - Database setup and extensions
2. `002_create_core_user_tables.sql` - Core user tables
3. `003_create_relationship_assessment_tables.sql` - Relationships and assessments
4. `004_create_insurance_tables.sql` - Insurance tables
5. `005_create_organization_contract_tables.sql` - Organizations and contracts
6. `006_create_referral_tables.sql` - Referral tables
7. `007_create_membership_availability_tables.sql` - Memberships and availability
8. `008_create_supporting_tables_views_constraints.sql` - Supporting tables and views
9. `009_create_triggers.sql` - Triggers and functions
10. (Data import scripts will be in `scripts/import/` directory)

### Troubleshooting

**Error: "database does not exist"**
- Make sure you've created the database first: `CREATE DATABASE daybreak_health;`

**Error: "permission denied"**
- Make sure you're running migrations as a PostgreSQL superuser

**Error: "extension already exists"**
- This is normal if re-running migrations. The `IF NOT EXISTS` clause prevents errors.

**Error: "role already exists"**
- If you need to recreate roles, drop them first: `DROP ROLE IF EXISTS daybreak_app;`

