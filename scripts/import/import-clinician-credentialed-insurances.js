/**
 * Import Script: clinician_credentialed_insurances
 * Description: Import credentialed_insurances.csv into clinician_credentialed_insurances table
 * Dependencies: PR 4 (clinician_credentialed_insurances table must exist)
 * 
 * Usage:
 *   Local: node scripts/import/import-clinician-credentialed-insurances.js
 *   Deployed: node scripts/import/import-clinician-credentialed-insurances.js
 * 
 * Environment Variables:
 *   - DB_HOST (default: localhost)
 *   - DB_PORT (default: 5432)
 *   - DB_NAME (default: daybreak_health)
 *   - DB_USER (default: daybreak_app)
 *   - DB_PASSWORD (required)
 *   - DB_SSL (default: false, set to 'true' for deployed)
 * 
 * CSV File Path:
 *   Default: 'Daybreak Health Test Cases/credentialed_insurances.csv'
 *   Override with: CSV_PATH environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { query, transaction } from '../../lib/db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get CSV file path
const csvPath = process.env.CSV_PATH || path.join(__dirname, '../../Daybreak Health Test Cases/credentialed_insurances.csv');

/**
 * Parse legacy_names JSON string to TEXT[] array
 */
function parseLegacyNames(legacyNamesStr) {
  if (!legacyNamesStr || legacyNamesStr.trim() === '' || legacyNamesStr.trim() === '{}') {
    return null;
  }
  try {
    const parsed = JSON.parse(legacyNamesStr);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`Failed to parse legacy_names: ${legacyNamesStr}`, error.message);
    return null;
  }
}

/**
 * Parse migration_details JSON string
 */
function parseMigrationDetails(migrationDetailsStr) {
  if (!migrationDetailsStr || migrationDetailsStr.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(migrationDetailsStr);
  } catch (error) {
    console.warn(`Failed to parse migration_details: ${migrationDetailsStr}`, error.message);
    return null;
  }
}

/**
 * Convert string boolean to boolean
 */
function parseBoolean(value) {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed === 'true' || trimmed === '1';
}

/**
 * Import a single record
 */
async function importRecord(record) {
  const sql = `
    INSERT INTO clinician_credentialed_insurances (
      id, name, country, state, line_of_business, legacy_names, network_status,
      associates_allowed, legacy_id, parent_credentialed_insurance_id,
      open_pm_name, migration_details, created_at, updated_at,
      _fivetran_deleted, _fivetran_synced
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      state = EXCLUDED.state,
      line_of_business = EXCLUDED.line_of_business,
      legacy_names = EXCLUDED.legacy_names,
      network_status = EXCLUDED.network_status,
      associates_allowed = EXCLUDED.associates_allowed,
      legacy_id = EXCLUDED.legacy_id,
      parent_credentialed_insurance_id = EXCLUDED.parent_credentialed_insurance_id,
      open_pm_name = EXCLUDED.open_pm_name,
      migration_details = EXCLUDED.migration_details,
      updated_at = EXCLUDED.updated_at,
      _fivetran_deleted = EXCLUDED._fivetran_deleted,
      _fivetran_synced = EXCLUDED._fivetran_synced
  `;

  const params = [
    record.id || null,
    record.name || null,
    record.country?.trim() || 'US',
    record.state?.trim() || null,
    record.line_of_business?.trim() ? parseInt(record.line_of_business) : null,
    parseLegacyNames(record.legacy_names),
    record.network_status?.trim() ? parseInt(record.network_status) : 0,
    record.associates_allowed?.trim() ? parseInt(record.associates_allowed) : 0,
    record.legacy_id?.trim() || null,
    record.parent_credentialed_insurance_id?.trim() || null,
    record.open_pm_name?.trim() || null,
    parseMigrationDetails(record.migration_details),
    record.created_at?.trim() || new Date().toISOString(),
    record.updated_at?.trim() || new Date().toISOString(),
    parseBoolean(record._fivetran_deleted),
    record._fivetran_synced?.trim() || null
  ];

  await query(sql, params);
}

/**
 * Main import function
 */
async function importData() {
  console.log('Starting import of clinician_credentialed_insurances...');
  console.log(`CSV file: ${csvPath}`);

  // Check if table exists
  const tableCheck = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clinician_credentialed_insurances'
    )
  `);
  
  if (!tableCheck.rows[0].exists) {
    throw new Error(
      'Table clinician_credentialed_insurances does not exist.\n' +
      'Please run migration 004_create_insurance_tables.sql first.\n' +
      'You can find it in: migrations/004_create_insurance_tables.sql'
    );
  }

  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  // Read and parse CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parseResult = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });

  if (parseResult.errors.length > 0) {
    console.warn('CSV parsing warnings:', parseResult.errors);
  }

  const records = parseResult.data;
  console.log(`Found ${records.length} records in CSV`);

  // Filter out deleted records
  const activeRecords = records.filter(record => {
    const deleted = record._fivetran_deleted?.trim().toLowerCase();
    return !deleted || deleted === 'false' || deleted === '';
  });

  console.log(`Importing ${activeRecords.length} active records (excluding deleted)`);

  // Import in transaction
  let imported = 0;
  let errors = 0;

  await transaction(async (client) => {
    for (const record of activeRecords) {
      try {
        await importRecord(record);
        imported++;
        if (imported % 50 === 0) {
          process.stdout.write(`\rImported ${imported}/${activeRecords.length} records...`);
        }
      } catch (error) {
        errors++;
        console.error(`\nError importing record ${record.id} (${record.name}):`, error.message);
        // Continue with other records
      }
    }
  });

  console.log(`\n\nImport completed!`);
  console.log(`  - Total records processed: ${activeRecords.length}`);
  console.log(`  - Successfully imported: ${imported}`);
  console.log(`  - Errors: ${errors}`);

  // Verification query
  const countResult = await query('SELECT COUNT(*) as count FROM clinician_credentialed_insurances');
  console.log(`\nTotal records in table: ${countResult.rows[0].count}`);
}

// Run import
importData()
  .then(() => {
    console.log('\n✅ Import script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import script failed:', error);
    process.exit(1);
  });

