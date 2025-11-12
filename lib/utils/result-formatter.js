/**
 * Result Formatter
 * 
 * Formats matched availability slots for display to users.
 */

import { formatInTimeZone } from 'date-fns-tz'
import { formatTimezoneName } from './timezone-utils'

/**
 * Format a single matched slot for display
 * @param {Object} slot - Matched slot object
 * @param {string} userTimezone - User's timezone for display
 * @returns {Object} Formatted slot object
 */
function formatSlot(slot, userTimezone) {
  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)

  // Use availability's timezone for formatting
  const slotTimezone = slot.timezone || userTimezone

  // Format date: "Tuesday, October 15, 2025"
  const formattedDate = formatInTimeZone(startTime, slotTimezone, 'EEEE, MMMM d, yyyy')

  // Format time: "5:00 PM - 6:00 PM" (12-hour format)
  const formattedStartTime = formatInTimeZone(startTime, slotTimezone, 'h:mm a')
  const formattedEndTime = formatInTimeZone(endTime, slotTimezone, 'h:mm a')
  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`

  // Get user-friendly timezone name
  const timezoneName = formatTimezoneName(slotTimezone)

  return {
    availabilityId: slot.availabilityId,
    clinicianId: slot.clinicianId,
    startTime: slot.startTime,
    endTime: slot.endTime,
    timezone: slotTimezone,
    locationId: slot.locationId,
    matchScore: slot.matchScore,
    // Formatted display fields
    formattedDate,
    formattedTime,
    timezoneName,
    // Full formatted string for display
    displayText: `${formattedDate} at ${formattedTime} (${timezoneName})`,
  }
}

/**
 * Format matched slots for display
 * @param {Array} slots - Array of matched slot objects
 * @param {string} userTimezone - User's timezone for display
 * @returns {Array} Array of formatted slot objects
 */
export function formatMatchedSlots(slots, userTimezone) {
  if (!slots || slots.length === 0) {
    return []
  }

  return slots.map(slot => formatSlot(slot, userTimezone))
}

