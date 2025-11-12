/**
 * Interpretation Validator
 * 
 * Validates the structure of interpreted scheduling preferences from OpenAI.
 */

import { validateTimezone } from './timezone-utils'

/**
 * Validate time string in 24-hour format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {boolean} True if valid
 */
function isValidTimeFormat(time) {
  if (typeof time !== 'string') {
    return false
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

/**
 * Validate ISO date string (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDateFormat(date) {
  if (typeof date !== 'string') {
    return false
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }
  // Check if it's a valid date
  const parsed = new Date(date)
  return !isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
}

/**
 * Validate interpreted preferences structure
 * @param {Object} preferences - Interpreted preferences object
 * @returns {Array<string>} Array of validation errors (empty if valid)
 */
export function validateInterpretedPreferences(preferences) {
  const errors = []

  if (!preferences || typeof preferences !== 'object') {
    errors.push('Preferences must be an object')
    return errors
  }

  // Validate daysOfWeek
  if (!Array.isArray(preferences.daysOfWeek)) {
    errors.push('daysOfWeek must be an array')
  } else {
    for (const day of preferences.daysOfWeek) {
      if (typeof day !== 'number' || day < 0 || day > 6 || !Number.isInteger(day)) {
        errors.push(`daysOfWeek must contain numbers 0-6, found: ${day}`)
        break
      }
    }
  }

  // Validate timeRanges
  if (!Array.isArray(preferences.timeRanges)) {
    errors.push('timeRanges must be an array')
  } else {
    for (let i = 0; i < preferences.timeRanges.length; i++) {
      const range = preferences.timeRanges[i]
      if (!range || typeof range !== 'object') {
        errors.push(`timeRanges[${i}] must be an object`)
        continue
      }

      if (!isValidTimeFormat(range.start)) {
        errors.push(`timeRanges[${i}].start must be in 24-hour format (HH:MM)`)
      }

      if (!isValidTimeFormat(range.end)) {
        errors.push(`timeRanges[${i}].end must be in 24-hour format (HH:MM)`)
      }

      if (!range.timezone || !validateTimezone(range.timezone)) {
        errors.push(`timeRanges[${i}].timezone must be a valid IANA timezone`)
      }
    }
  }

  // Validate dateConstraints
  if (preferences.dateConstraints !== null && preferences.dateConstraints !== undefined) {
    if (typeof preferences.dateConstraints !== 'object') {
      errors.push('dateConstraints must be an object or null')
    } else {
      if (preferences.dateConstraints.startDate !== null && preferences.dateConstraints.startDate !== undefined) {
        if (!isValidDateFormat(preferences.dateConstraints.startDate)) {
          errors.push('dateConstraints.startDate must be an ISO date string (YYYY-MM-DD) or null')
        }
      }

      if (preferences.dateConstraints.endDate !== null && preferences.dateConstraints.endDate !== undefined) {
        if (!isValidDateFormat(preferences.dateConstraints.endDate)) {
          errors.push('dateConstraints.endDate must be an ISO date string (YYYY-MM-DD) or null')
        }
      }

      if (preferences.dateConstraints.relative !== null && preferences.dateConstraints.relative !== undefined) {
        if (typeof preferences.dateConstraints.relative !== 'string') {
          errors.push('dateConstraints.relative must be a string or null')
        }
      }
    }
  }

  // Validate specificDates
  if (!Array.isArray(preferences.specificDates)) {
    errors.push('specificDates must be an array')
  } else {
    for (const date of preferences.specificDates) {
      if (!isValidDateFormat(date)) {
        errors.push(`specificDates must contain ISO date strings (YYYY-MM-DD), found: ${date}`)
        break
      }
    }
  }

  // Validate recurringPattern
  const validPatterns = ['weekdays', 'weekends', 'daily', 'none']
  if (typeof preferences.recurringPattern !== 'string') {
    errors.push('recurringPattern must be a string')
  } else if (!validPatterns.includes(preferences.recurringPattern)) {
    errors.push(`recurringPattern must be one of: ${validPatterns.join(', ')}, found: ${preferences.recurringPattern}`)
  }

  return errors
}

