/**
 * Master Seed Script
 * 
 * Runs all database migrations and seed/import scripts in the correct order.
 * 
 * Usage:
 *   node scripts/seed.js
 * 
 * Environment Variables:
 *   - DB_HOST (default: localhost)
 *   - DB_PORT (default: 5432)
 *   - DB_NAME (default: daybreak_health)
 *   - DB_USER (default: postgres for migrations, daybreak_app for imports)
 *   - DB_PASSWORD (required)
 *   - DB_SSL (default: false)
 *   - SKIP_MIGRATIONS (set to 'true' to skip migrations and only run seeds)
 *   - MIGRATION_USER (default: postgres, user with superuser privileges for migrations)
 * 
 * Prerequisites:
 *   - PostgreSQL 14+ installed and running
 *   - Database 'daybreak_health' must exist (or will be created if using superuser)
 *   - CSV files in 'Daybreak Health Test Cases/' directory
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { query, healthCheck } from '../lib/db/client.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Configuration
const config = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '5432',
  dbName: process.env.DB_NAME || 'daybreak_health',
  dbUser: process.env.DB_USER || 'daybreak_app',
  dbPassword: process.env.DB_PASSWORD,
  dbSSL: process.env.DB_SSL === 'true',
  skipMigrations: process.env.SKIP_MIGRATIONS === 'true',
  migrationUser: process.env.MIGRATION_USER || 'postgres',
};

// Import scripts in order (only JavaScript files that exist)
const importScripts = [
  'import-clinician-credentialed-insurances.js',
  'import-clinician-availabilities.js',
];

/**
 * Check if database exists
 */
async function checkDatabaseExists() {
  try {
    const checkCmd = `psql -h ${config.dbHost} -p ${config.dbPort} -U ${config.migrationUser} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${config.dbName}'"`;
    
    try {
      const { stdout } = await execAsync(checkCmd, {
        env: { ...process.env, PGPASSWORD: config.dbPassword || '' }
      });
      return stdout.trim() === '1';
    } catch (error) {
      // If we can't check, assume it doesn't exist or we don't have permissions
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  console.log('Checking if database exists...');
  const exists = await checkDatabaseExists();
  
  if (exists) {
    console.log(`✅ Database '${config.dbName}' already exists`);
    return;
  }

  console.log(`Creating database '${config.dbName}'...`);
  const createCmd = `psql -h ${config.dbHost} -p ${config.dbPort} -U ${config.migrationUser} -d postgres -c "CREATE DATABASE ${config.dbName}"`;
  
  try {
    await execAsync(createCmd, {
      env: { ...process.env, PGPASSWORD: config.dbPassword || '' }
    });
    console.log(`✅ Database '${config.dbName}' created successfully`);
  } catch (error) {
    console.error(`❌ Failed to create database: ${error.message}`);
    throw error;
  }
}

/**
 * Run migrations using psql
 */
async function runMigrations() {
  if (config.skipMigrations) {
    console.log('⏭️  Skipping migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  console.log('\n📦 Running database migrations...');
  
  const migrationFile = path.join(projectRoot, 'migrations', '000_master_migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  console.log(`Running: ${migrationFile}`);
  
  const migrationCmd = `psql -h ${config.dbHost} -p ${config.dbPort} -U ${config.migrationUser} -d ${config.dbName} -f "${migrationFile}"`;
  
  try {
    const { stdout, stderr } = await execAsync(migrationCmd, {
      env: { ...process.env, PGPASSWORD: config.dbPassword || '' }
    });
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('Migration warnings:', stderr);
    }
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    // Check if it's just a "already exists" error
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('⚠️  Some objects already exist (this is normal if re-running)');
      console.log('✅ Migrations completed (with some existing objects)');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }
}

/**
 * Check if migrations have been run
 */
async function checkMigrationsRun() {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM schema_migrations
    `);
    return result.rows[0].count > 0;
  } catch (error) {
    // Table doesn't exist, migrations haven't been run
    return false;
  }
}

/**
 * Run a single import script
 */
async function runImportScript(scriptName) {
  const scriptPath = path.join(__dirname, 'import', scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️  Import script not found: ${scriptName} (skipping)`);
    return;
  }

  console.log(`\n📥 Running import: ${scriptName}`);
  
  return new Promise((resolve, reject) => {
    const childProcess = exec(`node "${scriptPath}"`, {
      cwd: projectRoot,
      env: {
        ...process.env,
        DB_HOST: config.dbHost,
        DB_PORT: config.dbPort,
        DB_NAME: config.dbName,
        DB_USER: config.dbUser,
        DB_PASSWORD: config.dbPassword,
        DB_SSL: config.dbSSL ? 'true' : 'false',
      }
    });

    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${scriptName} failed with exit code ${code}`);
        reject(new Error(`${scriptName} failed with exit code ${code}`));
      }
    });

    childProcess.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

/**
 * Run all import scripts
 */
async function runImports() {
  console.log('\n📥 Running data import scripts...');
  
  for (const script of importScripts) {
    try {
      await runImportScript(script);
    } catch (error) {
      console.error(`Failed to run ${script}:`, error.message);
      // Continue with other scripts
    }
  }
  
  console.log('\n✅ All import scripts completed');
}

/**
 * Verify database connection
 */
async function verifyConnection() {
  console.log('\n🔍 Verifying database connection...');
  
  try {
    const isHealthy = await healthCheck();
    if (isHealthy) {
      console.log('✅ Database connection verified');
      return true;
    } else {
      console.error('❌ Database health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed process...\n');
  console.log('Configuration:');
  console.log(`  Database: ${config.dbName}`);
  console.log(`  Host: ${config.dbHost}:${config.dbPort}`);
  console.log(`  User: ${config.dbUser}`);
  console.log(`  Skip Migrations: ${config.skipMigrations}\n`);

  try {
    // Step 1: Create database if needed (requires superuser)
    if (!config.skipMigrations) {
      try {
        await createDatabase();
      } catch (error) {
        console.log('⚠️  Could not create database (may already exist or need manual creation)');
        console.log(`   Please ensure database '${config.dbName}' exists`);
      }
    }

    // Step 2: Verify connection
    const connected = await verifyConnection();
    if (!connected) {
      throw new Error('Cannot connect to database. Please check your connection settings.');
    }

    // Step 3: Run migrations
    if (!config.skipMigrations) {
      const migrationsRun = await checkMigrationsRun();
      if (migrationsRun) {
        console.log('⚠️  Migrations appear to have been run already');
        console.log('⏭️  Skipping migrations (use SKIP_MIGRATIONS=false to force re-run)');
      } else {
        await runMigrations();
      }
    }

    // Step 4: Run import scripts
    await runImports();

    console.log('\n🎉 Seed process completed successfully!');
    console.log('\nNext steps:');
    console.log('  - Verify data: psql -d daybreak_health -f scripts/validation/validate_data.sql');
    console.log('  - Start the application: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Seed process failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run seed if called directly
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { seed };

