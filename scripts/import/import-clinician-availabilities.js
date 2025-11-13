/**
 * Import Script: clinician_availabilities
 * Description: Import clinician_availabilities.csv into clinician_availabilities table
 * Dependencies: PR 7 (clinician_availabilities table must exist)
 * 
 * Usage:
 *   Local: node scripts/import/import-clinician-availabilities.js
 *   Deployed: node scripts/import/import-clinician-availabilities.js
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
 *   Default: 'Daybreak Health Test Cases/clinician_availabilities.csv'
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
const csvPath = process.env.CSV_PATH || path.join(__dirname, '../../Daybreak Health Test Cases/clinician_availabilities.csv');

/**
 * Parse a string value to a number
 */
function parseNumber(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse a string value to a boolean
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
  // Skip if missing required fields
  if (!record.id || !record.user_id || !record.range_start || !record.range_end) {
    return null; // Skip this record
  }

  const sql = `
    INSERT INTO clinician_availabilities (
      id, user_id, range_start, range_end, timezone, day_of_week,
      is_repeating, contact_type_id, appointment_location_id,
      deleted_at, end_on, parent_organization_id, created_at, updated_at, tx_commit_time
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      range_start = EXCLUDED.range_start,
      range_end = EXCLUDED.range_end,
      timezone = EXCLUDED.timezone,
      day_of_week = EXCLUDED.day_of_week,
      is_repeating = EXCLUDED.is_repeating,
      contact_type_id = EXCLUDED.contact_type_id,
      appointment_location_id = EXCLUDED.appointment_location_id,
      deleted_at = EXCLUDED.deleted_at,
      end_on = EXCLUDED.end_on,
      parent_organization_id = EXCLUDED.parent_organization_id,
      updated_at = EXCLUDED.updated_at,
      tx_commit_time = EXCLUDED.tx_commit_time
  `;

  // Validate timezone, default to America/Los_Angeles
  let timezone = record.timezone?.trim() || 'America/Los_Angeles';
  if (!timezone || timezone === '') {
    timezone = 'America/Los_Angeles';
  }

  // Validate range_start <= range_end
  const rangeStart = new Date(record.range_start);
  const rangeEnd = new Date(record.range_end);
  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime()) || rangeStart > rangeEnd) {
    return null; // Skip invalid time range
  }

  const params = [
    parseNumber(record.id),
    parseNumber(record.user_id),
    record.range_start?.trim() || null,
    record.range_end?.trim() || null,
    timezone,
    parseNumber(record.day_of_week, null),
    parseBoolean(record.is_repeating),
    parseNumber(record.contact_type_id, null),
    parseNumber(record.appointment_location_id, null),
    record.deleted_at?.trim() || null,
    record.end_on?.trim() || null,
    parseNumber(record.parent_organization_id, null),
    record.created_at?.trim() || null,
    record.updated_at?.trim() || null,
    record.tx_commit_time?.trim() || null
  ];

  await query(sql, params);
  return true;
}

/**
 * Main import function
 */
async function importData() {
  console.log('Starting import of clinician_availabilities...');
  console.log(`CSV file: ${csvPath}`);

  // Check if table exists
  const tableCheck = await query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clinician_availabilities'
    )
  `);
  
  if (!tableCheck.rows[0].exists) {
    throw new Error(
      'Table clinician_availabilities does not exist.\n' +
      'Please run migration 007_create_membership_availability_tables.sql first.'
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

  // Filter out deleted records and invalid rows
  const activeRecords = records.filter(record => {
    const deleted = record._fivetran_deleted?.trim().toLowerCase();
    return (!deleted || deleted === 'false' || deleted === '') &&
           record.id && record.user_id && record.range_start && record.range_end;
  });

  console.log(`Importing ${activeRecords.length} active records (excluding deleted and invalid)`);

  // Import in transaction
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  await transaction(async (client) => {
    for (const record of activeRecords) {
      try {
        const result = await importRecord(record);
        if (result) {
          imported++;
          if (imported % 50 === 0) {
            process.stdout.write(`\rImported ${imported}/${activeRecords.length} records...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`\nError importing record ${record.id}:`, error.message);
        // Continue with other records
      }
    }
  });

  console.log(`\n\nImport completed!`);
  console.log(`  - Total records processed: ${activeRecords.length}`);
  console.log(`  - Successfully imported: ${imported}`);
  console.log(`  - Skipped (invalid): ${skipped}`);
  console.log(`  - Errors: ${errors}`);

  // Verification query
  const countResult = await query('SELECT COUNT(*) as count FROM clinician_availabilities');
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

