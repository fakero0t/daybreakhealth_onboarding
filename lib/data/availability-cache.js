/**
 * Availability Cache
 * 
 * Manages in-memory cache of processed availability data.
 * Loads CSV file once on server startup and caches parsed data.
 */

import { loadAvailabilityCSV } from '../utils/csv-loader'
import { processAvailabilityData } from '../utils/availability-processor'

// Module-level cache variable
let cachedAvailabilityData = null
let cacheLoadTime = null
let isLoading = false

/**
 * Load and cache availability data
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
    console.log('Loading availability data from CSV...')
    
    // Load CSV
    const rawData = await loadAvailabilityCSV()
    
    // Process data (filter, expand, index)
    const processedData = processAvailabilityData(rawData)
    
    // Cache the processed data
    cachedAvailabilityData = processedData
    cacheLoadTime = new Date()
    
    console.log(`Availability data loaded and cached. Total records: ${processedData.all.length}`)
    
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
 * Reloads CSV and reprocesses data
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

