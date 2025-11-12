import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getSystemPrompt, getUserPrompt } from '@/lib/prompts/scheduling-prompt'
import { validateInterpretedPreferences } from '@/lib/utils/interpretation-validator'
import { validateTimezone, detectUserTimezone } from '@/lib/utils/timezone-utils'
import { formatInTimeZone } from 'date-fns-tz'

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

  const { userInput, userTimezone } = body

  // Validate userInput
  if (typeof userInput !== 'string') {
    return { valid: false, error: 'userInput must be a string', code: 'INVALID_INPUT' }
  }

  const inputLength = userInput.length
  if (inputLength < 10) {
    return { valid: false, error: 'userInput must be at least 10 characters', code: 'INPUT_TOO_SHORT' }
  }

  if (inputLength > 500) {
    return { valid: false, error: 'userInput must be at most 500 characters', code: 'INPUT_TOO_LONG' }
  }

  // Validate userTimezone
  if (typeof userTimezone !== 'string') {
    return { valid: false, error: 'userTimezone must be a string', code: 'INVALID_TIMEZONE' }
  }

  if (!validateTimezone(userTimezone)) {
    return { valid: false, error: 'userTimezone must be a valid IANA timezone', code: 'INVALID_TIMEZONE' }
  }

  return { valid: true }
}

/**
 * Retry OpenAI API call with exponential backoff
 */
async function callOpenAIWithRetry(openai, messages, maxRetries = 3) {
  let lastError = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      ])

      return completion
    } catch (error) {
      lastError = error

      // Don't retry on timeout or rate limit - return immediately
      if (error.message === 'Request timeout') {
        throw error
      }

      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        throw error
      }

      // Exponential backoff: wait 2^attempt seconds
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * POST handler for scheduling interpretation
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

    const { userInput, userTimezone } = body

    // Create OpenAI client
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable. Please try again in a moment.',
          code: 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 5000, // 5 seconds
    })

    // Get current date and time in user's timezone
    const now = new Date()
    const currentDate = formatInTimeZone(now, userTimezone, 'yyyy-MM-dd')
    const currentTime = formatInTimeZone(now, userTimezone, 'HH:mm')

    // Build prompts
    const systemPrompt = getSystemPrompt()
    const userPrompt = getUserPrompt(userInput, currentDate, currentTime, userTimezone)

    // Call OpenAI API with retry logic
    let completion
    try {
      completion = await callOpenAIWithRetry(openai, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])
    } catch (error) {
      const duration = Date.now() - startTime

      if (error.message === 'Request timeout') {
        console.log('Analytics:', {
          event: 'interpretation_timeout',
          duration,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Request took too long. Please try again.',
            code: 'TIMEOUT'
          },
          { status: 504 }
        )
      }

      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        console.log('Analytics:', {
          event: 'interpretation_rate_limited',
          duration,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Service temporarily unavailable. Please try again in a moment.',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          { status: 503 }
        )
      }

      // Network or other API errors
      console.log('Analytics:', {
        event: 'interpretation_api_error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to connect. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR'
        },
        { status: 500 }
      )
    }

    // Parse response
    let interpretedData
    try {
      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }
      interpretedData = JSON.parse(content)
    } catch (error) {
      const duration = Date.now() - startTime
      console.log('Analytics:', {
        event: 'interpretation_parse_error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process input. Please try rephrasing your availability.',
          code: 'PARSE_ERROR'
        },
        { status: 400 }
      )
    }

    // Validate interpreted preferences structure
    const validationErrors = validateInterpretedPreferences(interpretedData)
    if (validationErrors.length > 0) {
      const duration = Date.now() - startTime
      console.log('Analytics:', {
        event: 'interpretation_validation_error',
        errors: validationErrors,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process input. Please try rephrasing your availability.',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }

    // Log metadata (sanitized, no PII)
    const duration = Date.now() - startTime
    const tokenUsage = completion.usage || {}
    console.log('Analytics:', {
      event: 'interpretation_success',
      model: completion.model,
      duration,
      inputLength: userInput.length,
      tokens: {
        prompt: tokenUsage.prompt_tokens || 0,
        completion: tokenUsage.completion_tokens || 0,
        total: tokenUsage.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    })

    // Return validated response
    return NextResponse.json({
      success: true,
      interpretedPreferences: interpretedData
    })

  } catch (error) {
    // Unexpected errors
    const duration = Date.now() - startTime
    console.error('Unexpected error in interpret-scheduling:', error)
    console.log('Analytics:', {
      event: 'interpretation_error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to process input. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

