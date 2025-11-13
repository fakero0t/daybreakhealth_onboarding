/**
 * Availability Matcher
 * 
 * Matches user preferences against clinician availability data.
 * Implements scoring algorithm with day, time, date, and pattern matching.
 */

import { toZonedTime } from 'date-fns-tz'

/**
 * Calculate day of week match score
 * @param {Array<number>} userDays - User's preferred days (0-6)
 * @param {number} availabilityDay - Availability day of week (0-6)
 * @param {string} recurringPattern - Recurring pattern ("weekdays", "weekends", "daily", "none")
 * @returns {number} Match score (1.0 exact, 0.5 adjacent, 0.0 no match)
 */
function calculateDayMatchScore(userDays, availabilityDay, recurringPattern) {
  // Handle special patterns
  if (recurringPattern === 'weekdays') {
    // Weekdays = Monday-Friday (1-5)
    if (availabilityDay >= 1 && availabilityDay <= 5) {
      return 1.0
    }
    return 0.0
  }

  if (recurringPattern === 'weekends') {
    // Weekends = Sunday (0) OR Saturday (6)
    if (availabilityDay === 0 || availabilityDay === 6) {
      return 1.0
    }
    return 0.0
  }

  if (recurringPattern === 'daily') {
    return 1.0 // All days match
  }

  // Check exact match
  if (userDays.includes(availabilityDay)) {
    return 1.0
  }

  // Check adjacent days
  for (const userDay of userDays) {
    const diff = Math.abs(userDay - availabilityDay)
    // Adjacent: difference of 1, or wrap-around (Sunday=0 to Saturday=6)
    if (diff === 1 || (userDay === 0 && availabilityDay === 6) || (userDay === 6 && availabilityDay === 0)) {
      return 0.5
    }
  }

  return 0.0
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Calculate time range overlap percentage
 * @param {string} userStart - User's start time (HH:MM)
 * @param {string} userEnd - User's end time (HH:MM)
 * @param {Date} availStart - Availability start time (Date object)
 * @param {Date} availEnd - Availability end time (Date object)
 * @returns {number} Overlap percentage (0.0 to 1.0)
 */
function calculateTimeOverlap(userStart, userEnd, availStart, availEnd) {
  // Convert user times to minutes (relative to the availability date)
  const availDate = new Date(availStart)
  availDate.setHours(0, 0, 0, 0)

  const userStartMinutes = timeToMinutes(userStart)
  const userEndMinutes = timeToMinutes(userEnd)

  // Get availability times in minutes since midnight
  const availStartMinutes = availStart.getHours() * 60 + availStart.getMinutes()
  const availEndMinutes = availEnd.getHours() * 60 + availEnd.getMinutes()

  // Handle case where availability spans midnight
  let availEndAdjusted = availEndMinutes
  if (availEndMinutes < availStartMinutes) {
    // Spans midnight, add 24 hours
    availEndAdjusted = availEndMinutes + 24 * 60
  }

  // Find intersection
  const overlapStart = Math.max(userStartMinutes, availStartMinutes)
  const overlapEnd = Math.min(userEndMinutes, availEndAdjusted)

  if (overlapStart >= overlapEnd) {
    return 0.0 // No overlap
  }

  const overlapDuration = overlapEnd - overlapStart
  const userDuration = userEndMinutes - userStartMinutes
  const availDuration = availEndAdjusted - availStartMinutes

  // Calculate percentage: overlap / max(user_range, availability_range)
  const maxDuration = Math.max(userDuration, availDuration)
  return maxDuration > 0 ? overlapDuration / maxDuration : 0.0
}

/**
 * Apply 30-minute flexibility to time range
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {Object} Expanded time range {start, end}
 */
function applyTimeFlexibility(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  // Expand by 30 minutes on each side
  const flexibleStart = Math.max(0, startMinutes - 30)
  const flexibleEnd = Math.min(24 * 60 - 1, endMinutes + 30)

  const hoursStart = Math.floor(flexibleStart / 60)
  const minsStart = flexibleStart % 60
  const hoursEnd = Math.floor(flexibleEnd / 60)
  const minsEnd = flexibleEnd % 60

  return {
    start: `${String(hoursStart).padStart(2, '0')}:${String(minsStart).padStart(2, '0')}`,
    end: `${String(hoursEnd).padStart(2, '0')}:${String(minsEnd).padStart(2, '0')}`
  }
}

/**
 * Calculate date constraint score
 * @param {Date} availabilityDate - Availability date
 * @param {Object} dateConstraints - Date constraints object
 * @returns {number} Score (1.0 within range, 0.5 close, 0.0 outside)
 */
function calculateDateConstraintScore(availabilityDate, dateConstraints) {
  if (!dateConstraints || (!dateConstraints.startDate && !dateConstraints.endDate)) {
    return 1.0 // No constraints = match all
  }

  const availDate = new Date(availabilityDate)
  availDate.setHours(0, 0, 0, 0)

  let startDate = null
  let endDate = null

  if (dateConstraints.startDate) {
    startDate = new Date(dateConstraints.startDate)
    startDate.setHours(0, 0, 0, 0)
  }

  if (dateConstraints.endDate) {
    endDate = new Date(dateConstraints.endDate)
    endDate.setHours(23, 59, 59, 999)
  }

  // Check if within range
  if (startDate && endDate) {
    if (availDate >= startDate && availDate <= endDate) {
      return 1.0
    }
    // Check if within 3 days of range
    const daysBeforeStart = Math.abs((availDate - startDate) / (1000 * 60 * 60 * 24))
    const daysAfterEnd = Math.abs((availDate - endDate) / (1000 * 60 * 60 * 24))
    if (daysBeforeStart <= 3 || daysAfterEnd <= 3) {
      return 0.5
    }
  } else if (startDate) {
    if (availDate >= startDate) {
      return 1.0
    }
    const daysBefore = Math.abs((availDate - startDate) / (1000 * 60 * 60 * 24))
    if (daysBefore <= 3) {
      return 0.5
    }
  } else if (endDate) {
    if (availDate <= endDate) {
      return 1.0
    }
    const daysAfter = Math.abs((availDate - endDate) / (1000 * 60 * 60 * 24))
    if (daysAfter <= 3) {
      return 0.5
    }
  }

  return 0.0
}

/**
 * Check if date matches specific dates
 * @param {Date} availabilityDate - Availability date
 * @param {Array<string>} specificDates - Array of ISO date strings
 * @returns {boolean} True if matches
 */
function matchesSpecificDates(availabilityDate, specificDates) {
  if (!specificDates || specificDates.length === 0) {
    return true // No specific dates = match all
  }

  const availDateStr = availabilityDate.toISOString().split('T')[0]
  return specificDates.includes(availDateStr)
}

/**
 * Calculate recurring pattern match score
 * @param {string} userPattern - User's recurring pattern
 * @param {number} availabilityDay - Availability day of week
 * @returns {number} Score (1.0 if matches, 0.0 otherwise)
 */
function calculatePatternMatchScore(userPattern, availabilityDay) {
  if (!userPattern || userPattern === 'none') {
    return 1.0 // No pattern preference = match all
  }

  if (userPattern === 'weekdays') {
    return (availabilityDay >= 1 && availabilityDay <= 5) ? 1.0 : 0.0
  }

  if (userPattern === 'weekends') {
    return (availabilityDay === 0 || availabilityDay === 6) ? 1.0 : 0.0
  }

  if (userPattern === 'daily') {
    return 1.0
  }

  return 1.0 // Default: match all
}

/**
 * Match user preferences against availability data
 * @param {Object} preferences - Interpreted user preferences
 * @param {Object} availabilityData - Processed availability data
 * @param {string} userTimezone - User's timezone
 * @returns {Array} Array of matched slots with scores
 */
export function matchAvailability(preferences, availabilityData, userTimezone) {
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const matchedSlots = []

  // Get all availabilities
  const availabilities = availabilityData.all || []

  for (const avail of availabilities) {
    const availStart = new Date(avail.range_start)
    const availEnd = new Date(avail.range_end)
    
    // Convert to clinician's timezone to get correct day of week and times
    // Availability times are stored in UTC, but should be interpreted in local timezone
    const clinicianTimezone = avail.timezone || 'America/Los_Angeles'
    const zonedStart = toZonedTime(availStart, clinicianTimezone)
    const zonedEnd = toZonedTime(availEnd, clinicianTimezone)
    const availDay = zonedStart.getDay()

    // Filter by specific dates if provided
    // Also check the zoned date for specific date matching
    if (!matchesSpecificDates(zonedStart, preferences.specificDates)) {
      continue
    }

    // Calculate day match score
    const dayScore = calculateDayMatchScore(
      preferences.daysOfWeek || [],
      availDay,
      preferences.recurringPattern || 'none'
    )

    // Calculate time overlap using timezone-adjusted times
    let maxTimeOverlap = 0.0
    if (preferences.timeRanges && preferences.timeRanges.length > 0) {
      for (const timeRange of preferences.timeRanges) {
        // Apply 30-minute flexibility if time range is narrow (less than 2 hours)
        const startMinutes = timeToMinutes(timeRange.start)
        const endMinutes = timeToMinutes(timeRange.end)
        const rangeDuration = endMinutes - startMinutes

        let userStart = timeRange.start
        let userEnd = timeRange.end

        // Apply flexibility for narrow ranges
        if (rangeDuration < 120) { // Less than 2 hours
          const flexible = applyTimeFlexibility(timeRange.start, timeRange.end)
          userStart = flexible.start
          userEnd = flexible.end
        }

        // Use zoned times for accurate comparison in clinician's timezone
        const overlap = calculateTimeOverlap(userStart, userEnd, zonedStart, zonedEnd)
        maxTimeOverlap = Math.max(maxTimeOverlap, overlap)
      }
    } else {
      // No time preference = match all times
      maxTimeOverlap = 1.0
    }

    // Calculate date constraint score using zoned date
    const dateScore = calculateDateConstraintScore(zonedStart, preferences.dateConstraints)

    // Calculate pattern match score
    const patternScore = calculatePatternMatchScore(
      preferences.recurringPattern,
      availDay
    )

    // Calculate total score using weighted formula
    const totalScore = (
      dayScore * 0.3 +
      maxTimeOverlap * 0.4 +
      dateScore * 0.2 +
      patternScore * 0.1
    )

    // Only include slots with some match (score > 0)
    if (totalScore > 0) {
      matchedSlots.push({
        availabilityId: avail.id || avail.original_id || null,
        clinicianId: avail.user_id,
        startTime: availStart.toISOString(),
        endTime: availEnd.toISOString(),
        timezone: avail.timezone,
        locationId: avail.appointment_location_id,
        matchScore: totalScore,
        rawAvailability: avail, // Keep for formatting
      })
    }
  }

  // Split all slots into 30-minute increments
  const thirtyMinuteSlots = []
  for (const slot of matchedSlots) {
    const startTime = new Date(slot.startTime)
    const endTime = new Date(slot.endTime)
    const durationMinutes = (endTime - startTime) / (1000 * 60)
    
    // Split into 30-minute chunks
    const numSlots = Math.floor(durationMinutes / 30)
    
    for (let i = 0; i < numSlots; i++) {
      const slotStart = new Date(startTime.getTime() + (i * 30 * 60 * 1000))
      const slotEnd = new Date(slotStart.getTime() + (30 * 60 * 1000))
      
      thirtyMinuteSlots.push({
        availabilityId: slot.availabilityId,
        clinicianId: slot.clinicianId,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        timezone: slot.timezone,
        locationId: slot.locationId,
        matchScore: slot.matchScore,
        rawAvailability: slot.rawAvailability,
      })
    }
  }

  // Sort by score (highest first), then by date (earliest first) for ties
  thirtyMinuteSlots.sort((a, b) => {
    if (Math.abs(a.matchScore - b.matchScore) > 0.001) {
      return b.matchScore - a.matchScore // Higher score first
    }
    // Tie: prefer earlier dates
    return new Date(a.startTime) - new Date(b.startTime)
  })

  // Select top 3-5 best matches
  const topMatches = thirtyMinuteSlots.slice(0, 5)

  // If we have fewer than 3 but more than 0, return what we have
  // If we have 0, return empty array (not an error)
  return topMatches
}

