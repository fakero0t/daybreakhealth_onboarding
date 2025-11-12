/**
 * Timezone Utilities
 * 
 * Provides functions for timezone detection, validation, and formatting.
 * Uses date-fns-tz for timezone handling.
 */

import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'

// Common timezone name mappings
const TIMEZONE_NAMES = {
  'America/Los_Angeles': 'Pacific Time',
  'America/Denver': 'Mountain Time',
  'America/Chicago': 'Central Time',
  'America/New_York': 'Eastern Time',
  'America/Phoenix': 'Mountain Time (Arizona)',
  'America/Anchorage': 'Alaska Time',
  'Pacific/Honolulu': 'Hawaii Time',
}

/**
 * Detect user's timezone from browser
 * @returns {string} IANA timezone string
 */
export function detectUserTimezone() {
  if (typeof window === 'undefined') {
    return getTimezoneFallback()
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (validateTimezone(timezone)) {
      return timezone
    }
  } catch (error) {
    console.warn('Error detecting timezone:', error)
  }

  return getTimezoneFallback()
}

/**
 * Validate IANA timezone string
 * @param {string} timezone - IANA timezone string to validate
 * @returns {boolean} True if valid
 */
export function validateTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return false
  }

  try {
    // Try to create a date in the timezone to validate it
    const testDate = new Date()
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Convert IANA timezone string to user-friendly name
 * @param {string} timezone - IANA timezone string
 * @returns {string} User-friendly timezone name
 */
export function formatTimezoneName(timezone) {
  if (!timezone || typeof timezone !== 'string') {
    return 'Pacific Time'
  }

  // Check if we have a mapping
  if (TIMEZONE_NAMES[timezone]) {
    return TIMEZONE_NAMES[timezone]
  }

  // Try to extract a readable name from the IANA string
  // e.g., "America/Los_Angeles" -> "Pacific Time"
  const parts = timezone.split('/')
  if (parts.length >= 2) {
    const region = parts[0]
    const city = parts[1].replace(/_/g, ' ')
    
    // Basic mapping for common regions
    if (region === 'America') {
      if (city.includes('Los Angeles') || city.includes('Vancouver') || city.includes('Tijuana')) {
        return 'Pacific Time'
      }
      if (city.includes('Denver') || city.includes('Phoenix')) {
        return 'Mountain Time'
      }
      if (city.includes('Chicago') || city.includes('Dallas')) {
        return 'Central Time'
      }
      if (city.includes('New York') || city.includes('Miami') || city.includes('Toronto')) {
        return 'Eastern Time'
      }
    }
  }

  // Fallback: return formatted IANA string
  return timezone.replace(/_/g, ' ')
}

/**
 * Get timezone fallback
 * @returns {string} Default timezone (America/Los_Angeles)
 */
export function getTimezoneFallback() {
  return 'America/Los_Angeles'
}

/**
 * Convert UTC date to timezone
 * @param {Date|string} date - UTC date
 * @param {string} timezone - Target timezone
 * @returns {Date} Date in target timezone
 */
export function convertToTimezone(date, timezone) {
  if (!validateTimezone(timezone)) {
    timezone = getTimezoneFallback()
  }
  return toZonedTime(date, timezone)
}

/**
 * Convert timezone date to UTC
 * @param {Date|string} date - Date in timezone
 * @param {string} timezone - Source timezone
 * @returns {Date} Date in UTC
 */
export function convertToUTC(date, timezone) {
  if (!validateTimezone(timezone)) {
    timezone = getTimezoneFallback()
  }
  return fromZonedTime(date, timezone)
}

/**
 * Format date in timezone
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string (date-fns format)
 * @param {string} timezone - Target timezone
 * @returns {string} Formatted date string
 */
export function formatInTimezone(date, formatString, timezone) {
  if (!validateTimezone(timezone)) {
    timezone = getTimezoneFallback()
  }
  return formatInTimeZone(date, timezone, formatString)
}

