/**
 * CSV Loader Utility
 * 
 * Loads and parses clinician availability data from CSV file.
 * Handles malformed rows, duplicates, and data validation.
 */

import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
import { validateTimezone } from './timezone-utils'

// Get CSV file path - works in both development and production
const CSV_FILE_PATH = path.join(process.cwd(), 'Daybreak Health Test Cases', 'clinician_availabilities.csv')

/**
 * Parse a string value to a number
 * @param {string} value - String value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number}
 */
function parseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }
  const parsed = Number(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse a string value to a boolean
 * @param {string} value - String value to parse
 * @returns {boolean}
 */
function parseBoolean(value) {
  if (value === null || value === undefined || value === '') {
    return false
  }
  const lower = String(value).toLowerCase()
  return lower === 'true' || lower === '1'
}

/**
 * Load and parse CSV file into structured availability objects
 * @returns {Promise<Array>} Array of availability objects
 */
export async function loadAvailabilityCSV() {
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8')
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }

    const availabilities = []
    const seenIds = new Set()
    const currentDate = new Date()

    // Process each row
    for (const row of parseResult.data) {
      try {
        // Skip if missing required fields
        if (!row.id || !row.user_id || !row.range_start || !row.range_end) {
          console.warn('Skipping row with missing required fields:', row)
          continue
        }

        const id = parseNumber(row.id)
        
        // Handle duplicate IDs (keep first occurrence)
        if (seenIds.has(id)) {
          console.warn(`Skipping duplicate availability ID: ${id}`)
          continue
        }
        seenIds.add(id)

        // Parse timestamps
        const rangeStart = new Date(row.range_start)
        const rangeEnd = new Date(row.range_end)

        // Skip rows where range_start > range_end (data error)
        if (rangeStart > rangeEnd) {
          console.warn(`Skipping row with invalid time range (start > end): ID ${id}`)
          continue
        }

        // Validate and normalize timezone
        let timezone = row.timezone || 'America/Los_Angeles'
        if (!validateTimezone(timezone)) {
          console.warn(`Invalid timezone "${timezone}" for ID ${id}, falling back to America/Los_Angeles`)
          timezone = 'America/Los_Angeles'
        }

        // Build availability object
        const availability = {
          id,
          user_id: parseNumber(row.user_id),
          range_start: row.range_start, // Keep as ISO string
          range_end: row.range_end, // Keep as ISO string
          timezone,
          day_of_week: parseNumber(row.day_of_week, null),
          is_repeating: parseBoolean(row.is_repeating),
          end_on: row.end_on && row.end_on !== '' ? row.end_on : null,
          appointment_location_id: parseNumber(row.appointment_location_id, null),
          parent_organization_id: parseNumber(row.parent_organization_id),
          deleted_at: row.deleted_at && row.deleted_at !== '' ? row.deleted_at : null,
        }

        availabilities.push(availability)
      } catch (error) {
        console.error('Error processing CSV row:', error, row)
        // Continue processing other rows
      }
    }

    console.log(`Loaded ${availabilities.length} availability records from CSV`)
    return availabilities
  } catch (error) {
    console.error('Error loading CSV file:', error)
    throw new Error(`Failed to load availability CSV: ${error.message}`)
  }
}

