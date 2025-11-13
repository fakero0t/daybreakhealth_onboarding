/**
 * Database Client
 * 
 * PostgreSQL database connection and query utilities.
 * Uses pg (node-postgres) library for database interactions.
 */

import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'daybreak_health',
  user: process.env.DB_USER || 'daybreak_app',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection can't be established
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * Execute a SQL query
 * @param {string} text - SQL query text
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (>1 second)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      error: error.message,
      query: text.substring(0, 100),
      params: params
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transaction support
 * @returns {Promise<object>} Database client
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Execute multiple queries in a transaction
 * @param {function} callback - Async function that receives a client
 * @returns {Promise<any>} Result of callback
 */
export async function transaction(callback) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database pool
 * Should be called when shutting down the application
 */
export async function close() {
  await pool.end();
}

/**
 * Check if database connection is healthy
 * @returns {Promise<boolean>} True if healthy
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Export the pool for advanced use cases
export const db = {
  query,
  getClient,
  transaction,
  close,
  healthCheck,
  pool
};

export default db;

