/**
 * Availability Processor
 * 
 * Filters and processes availability data, including expanding repeating availabilities.
 */

import { validateTimezone } from './timezone-utils'

const ORGANIZATION_ID = 85685
const DAYS_WINDOW = 60

/**
 * Filter active availabilities based on criteria
 * @param {Array} availabilities - Raw availability data
 * @returns {Array} Filtered availabilities
 */
export function filterActiveAvailabilities(availabilities) {
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0) // Start of today
  
  const endDate = new Date(currentDate)
  endDate.setDate(endDate.getDate() + DAYS_WINDOW) // 60 days from now

  return availabilities.filter(avail => {
    // Filter by deleted_at IS NULL
    if (avail.deleted_at !== null) {
      return false
    }

    // Filter by parent_organization_id = 85685
    if (avail.parent_organization_id !== ORGANIZATION_ID) {
      return false
    }

    // Parse range_start date
    const rangeStartDate = new Date(avail.range_start)
    rangeStartDate.setHours(0, 0, 0, 0)

    // Filter: range_start >= current_date AND range_start <= current_date + 60 days
    if (rangeStartDate < currentDate || rangeStartDate > endDate) {
      return false
    }

    // For repeating availabilities, check end_on
    if (avail.is_repeating) {
      if (avail.end_on) {
        const endOnDate = new Date(avail.end_on)
        endOnDate.setHours(0, 0, 0, 0)
        // If end_on is in the past, exclude it
        if (endOnDate < currentDate) {
          return false
        }
      }
    }

    // Filter out any availabilities with range_start in the past
    const rangeStart = new Date(avail.range_start)
    if (rangeStart < currentDate) {
      return false
    }

    return true
  })
}

/**
 * Expand repeating availabilities to specific dates within 60-day window
 * @param {Array} availabilities - Filtered availability data
 * @returns {Array} Expanded availabilities (one-time + expanded repeating)
 */
export function expandRepeatingAvailabilities(availabilities) {
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0) // Start of today
  
  const endDate = new Date(currentDate)
  endDate.setDate(endDate.getDate() + DAYS_WINDOW) // 60 days from now

  const expanded = []
  const seenIds = new Set()

  for (const avail of availabilities) {
    if (!avail.is_repeating) {
      // One-time availability - add as-is
      expanded.push(avail)
      continue
    }

    // Repeating availability - expand to specific dates
    const dayOfWeek = avail.day_of_week
    if (dayOfWeek === null || dayOfWeek === undefined) {
      console.warn(`Skipping repeating availability ${avail.id} with null day_of_week`)
      continue
    }

    // Parse end_on if it exists
    let expansionEndDate = endDate
    if (avail.end_on) {
      const endOnDate = new Date(avail.end_on)
      endOnDate.setHours(23, 59, 59, 999) // End of day
      if (endOnDate < expansionEndDate) {
        expansionEndDate = endOnDate
      }
    }

    // Find all dates in the window that match this day of week
    const matchingDates = []
    const checkDate = new Date(currentDate)
    
    while (checkDate <= expansionEndDate) {
      const checkDayOfWeek = checkDate.getDay() // 0 = Sunday, 6 = Saturday
      
      if (checkDayOfWeek === dayOfWeek) {
        matchingDates.push(new Date(checkDate))
      }
      
      checkDate.setDate(checkDate.getDate() + 1)
    }

    // Create individual availability records for each matching date
    for (const matchDate of matchingDates) {
      // Parse the original range_start to get the time component
      const originalRangeStart = new Date(avail.range_start)
      const originalRangeEnd = new Date(avail.range_end)

      // Create new range_start and range_end for this specific date
      const newRangeStart = new Date(matchDate)
      newRangeStart.setHours(
        originalRangeStart.getHours(),
        originalRangeStart.getMinutes(),
        originalRangeStart.getSeconds(),
        originalRangeStart.getMilliseconds()
      )

      const newRangeEnd = new Date(matchDate)
      newRangeEnd.setHours(
        originalRangeEnd.getHours(),
        originalRangeEnd.getMinutes(),
        originalRangeEnd.getSeconds(),
        originalRangeEnd.getMilliseconds()
      )

      // Create expanded availability record
      const expandedAvail = {
        ...avail,
        id: `${avail.id}_${matchDate.toISOString().split('T')[0]}`, // Unique ID for expanded record
        original_id: avail.id, // Keep reference to original
        range_start: newRangeStart.toISOString(),
        range_end: newRangeEnd.toISOString(),
        is_repeating: false, // Expanded records are treated as one-time
        expanded_from_repeating: true,
      }

      expanded.push(expandedAvail)
    }
  }

  return expanded
}

/**
 * Pre-process and index availability data
 * @param {Array} availabilities - Expanded availability data
 * @returns {Object} Indexed availability data with day_of_week and time range indexes
 */
export function indexAvailabilityData(availabilities) {
  // Create index by day_of_week
  const dayOfWeekIndex = {}
  for (let day = 0; day <= 6; day++) {
    dayOfWeekIndex[day] = []
  }

  // Create index by time ranges (hour-based for simplicity)
  const timeRangeIndex = {
    morning: [], // 6:00 AM - 12:00 PM
    afternoon: [], // 12:00 PM - 6:00 PM
    evening: [], // 6:00 PM - 12:00 AM
    night: [], // 12:00 AM - 6:00 AM
  }

  for (const avail of availabilities) {
    // Index by day_of_week
    const dayOfWeek = new Date(avail.range_start).getDay()
    if (dayOfWeekIndex[dayOfWeek]) {
      dayOfWeekIndex[dayOfWeek].push(avail)
    }

    // Index by time range
    const rangeStart = new Date(avail.range_start)
    const hour = rangeStart.getHours()

    if (hour >= 6 && hour < 12) {
      timeRangeIndex.morning.push(avail)
    } else if (hour >= 12 && hour < 18) {
      timeRangeIndex.afternoon.push(avail)
    } else if (hour >= 18 && hour < 24) {
      timeRangeIndex.evening.push(avail)
    } else {
      timeRangeIndex.night.push(avail)
    }
  }

  return {
    all: availabilities, // Full array for general queries
    byDayOfWeek: dayOfWeekIndex,
    byTimeRange: timeRangeIndex,
  }
}

/**
 * Process availability data: filter, expand, and index
 * @param {Array} rawAvailabilities - Raw availability data from CSV
 * @returns {Object} Processed and indexed availability data
 */
export function processAvailabilityData(rawAvailabilities) {
  // Step 1: Filter active availabilities
  const filtered = filterActiveAvailabilities(rawAvailabilities)
  
  // Step 2: Expand repeating availabilities
  const expanded = expandRepeatingAvailabilities(filtered)
  
  // Step 3: Index data for fast queries
  const indexed = indexAvailabilityData(expanded)

  return indexed
}

