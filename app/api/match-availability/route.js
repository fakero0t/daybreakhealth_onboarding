import { NextResponse } from 'next/server'
import { getAvailabilityData } from '@/lib/data/availability-cache'
import { matchAvailability } from '@/lib/utils/availability-matcher'
import { formatMatchedSlots } from '@/lib/utils/result-formatter'
import { validateInterpretedPreferences } from '@/lib/utils/interpretation-validator'
import { detectUserTimezone } from '@/lib/utils/timezone-utils'

// Simple in-memory rate limiting store
const rateLimitStore = new Map()

/**
 * Rate limiting: max 10 requests per minute per IP
 */
function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const record = rateLimitStore.get(ip)

  // Reset if window has passed
  if (now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return false
  }

  // Increment count
  record.count++
  return true
}

/**
 * Get client IP address
 */
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

/**
 * Validate request body
 */
function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object', code: 'INVALID_REQUEST' }
  }

  const { interpretedPreferences, organizationId } = body

  // Validate interpretedPreferences
  if (!interpretedPreferences || typeof interpretedPreferences !== 'object') {
    return { valid: false, error: 'interpretedPreferences must be an object', code: 'INVALID_PREFERENCES' }
  }

  // Validate using interpretation validator
  const validationErrors = validateInterpretedPreferences(interpretedPreferences)
  if (validationErrors.length > 0) {
    return {
      valid: false,
      error: `Invalid preferences: ${validationErrors.join(', ')}`,
      code: 'INVALID_PREFERENCES'
    }
  }

  // Validate organizationId
  if (typeof organizationId !== 'number' || isNaN(organizationId)) {
    return { valid: false, error: 'organizationId must be a number', code: 'INVALID_ORGANIZATION_ID' }
  }

  return { valid: true }
}

/**
 * POST handler for availability matching
 */
export async function POST(request) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)

  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Service temporarily unavailable. Please try again in a moment.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      { status: 503 }
    )
  }

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(body)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: validation.code
        },
        { status: 400 }
      )
    }

    const { interpretedPreferences, organizationId } = body

    // Get availability data from cache
    let availabilityData
    try {
      availabilityData = await getAvailabilityData()
    } catch (error) {
      console.error('Error loading availability data:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to load availability data. Please try again later.',
          code: 'DATA_LOAD_ERROR'
        },
        { status: 500 }
      )
    }

    // Detect user timezone (fallback to availability timezone if needed)
    let userTimezone = 'America/Los_Angeles' // Default fallback
    // Try to get from preferences if available
    if (interpretedPreferences.timeRanges && interpretedPreferences.timeRanges.length > 0) {
      userTimezone = interpretedPreferences.timeRanges[0].timezone || userTimezone
    }

    // Match availability
    const matchedSlots = matchAvailability(interpretedPreferences, availabilityData, userTimezone)

    // Format results
    const formattedSlots = formatMatchedSlots(matchedSlots, userTimezone)

    // Log analytics
    const duration = Date.now() - startTime
    console.log('Analytics:', {
      event: 'matching_success',
      duration,
      matchesFound: formattedSlots.length,
      organizationId,
      timestamp: new Date().toISOString()
    })

    // Return results (empty array is valid - no matches found)
    return NextResponse.json({
      success: true,
      matchedSlots: formattedSlots
    })

  } catch (error) {
    // Unexpected errors
    const duration = Date.now() - startTime
    console.error('Unexpected error in match-availability:', error)
    console.log('Analytics:', {
      event: 'matching_error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to match availability. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

