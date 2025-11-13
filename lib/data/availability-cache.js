/**
 * Availability Cache
 * 
 * Manages availability data from database.
 * Queries clinician_availabilities table and processes data.
 */

import { query } from '../db/client'
import { processAvailabilityData } from '../utils/availability-processor'

// Module-level cache variable
let cachedAvailabilityData = null
let cacheLoadTime = null
let isLoading = false

/**
 * Load availability data from database
 * @returns {Promise<Object>} Processed availability data
 */
export async function loadAvailabilityData() {
  // If already loading, wait for it
  if (isLoading) {
    // Wait a bit and retry
    await new Promise(resolve => setTimeout(resolve, 100))
    if (cachedAvailabilityData) {
      return cachedAvailabilityData
    }
    // If still loading, throw error
    throw new Error('Availability data is still loading')
  }

  // If already cached, return cached data
  if (cachedAvailabilityData !== null) {
    return cachedAvailabilityData
  }

  isLoading = true

  try {
    console.log('Loading availability data from database...')
    
    // Query database for active availabilities
    // This replicates the filtering logic from availability-processor.js
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + 60) // 60 days from now

    const result = await query(`
      SELECT 
        id,
        user_id,
        range_start,
        range_end,
        timezone,
        day_of_week,
        is_repeating,
        contact_type_id,
        appointment_location_id,
        deleted_at,
        end_on,
        parent_organization_id
      FROM clinician_availabilities
      WHERE deleted_at IS NULL
        AND parent_organization_id = $1
        AND range_start >= $2
        AND range_start <= $3
        AND (
          is_repeating = false
          OR (is_repeating = true AND (end_on IS NULL OR end_on >= $2))
        )
      ORDER BY range_start ASC
    `, [
      85685, // ORGANIZATION_ID
      currentDate.toISOString(),
      endDate.toISOString()
    ])

    const rawAvailabilities = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      range_start: row.range_start instanceof Date ? row.range_start.toISOString() : row.range_start,
      range_end: row.range_end instanceof Date ? row.range_end.toISOString() : row.range_end,
      timezone: row.timezone || 'America/Los_Angeles',
      day_of_week: row.day_of_week,
      is_repeating: row.is_repeating,
      end_on: row.end_on ? (row.end_on instanceof Date ? row.end_on.toISOString() : row.end_on) : null,
      appointment_location_id: row.appointment_location_id,
      parent_organization_id: row.parent_organization_id,
      deleted_at: row.deleted_at ? (row.deleted_at instanceof Date ? row.deleted_at.toISOString() : row.deleted_at) : null,
    }))
    
    console.log(`Loaded ${rawAvailabilities.length} availability records from database`)
    
    // Process data (expand repeating, index)
    const processedData = processAvailabilityData(rawAvailabilities)
    
    // Cache the processed data
    cachedAvailabilityData = processedData
    cacheLoadTime = new Date()
    
    console.log(`Availability data processed and cached. Total records: ${processedData.all.length}`)
    
    return processedData
  } catch (error) {
    console.error('Error loading availability data:', error)
    throw error
  } finally {
    isLoading = false
  }
}

/**
 * Get cached availability data
 * Loads data if not yet cached
 * @returns {Promise<Object>} Processed availability data
 */
export async function getAvailabilityData() {
  if (cachedAvailabilityData === null) {
    return await loadAvailabilityData()
  }
  return cachedAvailabilityData
}

/**
 * Refresh availability data cache
 * Reloads from database and reprocesses data
 * @returns {Promise<Object>} Fresh processed availability data
 */
export async function refreshAvailabilityData() {
  console.log('Refreshing availability data cache...')
  
  // Clear cache
  cachedAvailabilityData = null
  cacheLoadTime = null
  
  // Reload data
  return await loadAvailabilityData()
}

/**
 * Get cache metadata
 * @returns {Object} Cache metadata (load time, record count)
 */
export function getCacheMetadata() {
  return {
    isCached: cachedAvailabilityData !== null,
    loadTime: cacheLoadTime,
    recordCount: cachedAvailabilityData ? cachedAvailabilityData.all.length : 0,
  }
}

/**
 * Clear cache (for testing or manual refresh)
 */
export function clearCache() {
  cachedAvailabilityData = null
  cacheLoadTime = null
  console.log('Availability cache cleared')
}

