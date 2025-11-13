import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { sanitizeInput } from '@/lib/utils/sanitization'
import { validateInsuranceData } from '@/lib/utils/insurance-validation'

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
 * System prompt for insurance card extraction
 */
const SYSTEM_PROMPT = `You are an expert at extracting structured data from US health insurance cards. 
Extract all visible information from the insurance card image and return as JSON 
matching this exact schema. If a field is not visible or unclear, use null or 
empty string. For dates, use YYYY-MM-DD format. For state, use 2-letter 
abbreviation (e.g., "CA", "TX"). For gender, use 0=unknown, 1=male, 2=female.
Country should always be "US" for US insurance cards.

Include a confidence level: "high" if all key fields are clear, "medium" if 
most fields are clear, "low" if image is unclear or many fields missing.

Return JSON in this exact format:
{
  "insurance_company_name": "string or null",
  "member_id": "string or null",
  "group_id": "string or null",
  "plan_holder_first_name": "string or null",
  "plan_holder_last_name": "string or null",
  "plan_holder_dob": "YYYY-MM-DD or null",
  "plan_holder_country": "US",
  "plan_holder_state": "XX or null",
  "plan_holder_city": "string or null",
  "plan_holder_zip_code": "string or null",
  "plan_holder_legal_gender": 0|1|2 or null,
  "confidence": "high|medium|low",
  "extracted_fields": ["field1", "field2"]
}`

/**
 * Validate file type and size
 */
function validateFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, or PDF file.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File is too large. Maximum size is 10MB.' }
  }

  return { valid: true }
}

/**
 * Convert file to base64
 */
async function fileToBase64(file) {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer)
    // Convert Buffer to base64
    return buffer.toString('base64')
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error.message}`)
  }
}

/**
 * Sanitize extracted insurance data
 */
function sanitizeInsuranceData(data) {
  const sanitized = {}

  // Sanitize string fields
  const stringFields = [
    'insurance_company_name',
    'member_id',
    'group_id',
    'plan_holder_first_name',
    'plan_holder_last_name',
    'plan_holder_city',
    'plan_holder_zip_code'
  ]

  for (const field of stringFields) {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      sanitized[field] = sanitizeInput(String(data[field]), 255)
    } else {
      sanitized[field] = null
    }
  }

  // Date field - validate format
  if (data.plan_holder_dob !== null && data.plan_holder_dob !== undefined && data.plan_holder_dob !== '') {
    sanitized.plan_holder_dob = String(data.plan_holder_dob)
  } else {
    sanitized.plan_holder_dob = null
  }

  // Country - always US
  sanitized.plan_holder_country = 'US'

  // State - validate and uppercase
  if (data.plan_holder_state !== null && data.plan_holder_state !== undefined && data.plan_holder_state !== '') {
    sanitized.plan_holder_state = String(data.plan_holder_state).toUpperCase().trim()
  } else {
    sanitized.plan_holder_state = null
  }

  // Legal gender - validate
  if (data.plan_holder_legal_gender !== null && data.plan_holder_legal_gender !== undefined) {
    const gender = Number(data.plan_holder_legal_gender)
    if ([0, 1, 2].includes(gender)) {
      sanitized.plan_holder_legal_gender = gender
    } else {
      sanitized.plan_holder_legal_gender = null
    }
  } else {
    sanitized.plan_holder_legal_gender = null
  }

  // Confidence
  if (data.confidence) {
    const conf = String(data.confidence).toLowerCase()
    if (['high', 'medium', 'low'].includes(conf)) {
      sanitized.confidence = conf
    } else {
      sanitized.confidence = 'low'
    }
  } else {
    sanitized.confidence = 'low'
  }

  // Extracted fields array
  if (Array.isArray(data.extracted_fields)) {
    sanitized.extracted_fields = data.extracted_fields
      .filter(field => typeof field === 'string')
      .map(field => sanitizeInput(field, 100))
  } else {
    sanitized.extracted_fields = []
  }

  return sanitized
}

/**
 * POST handler for insurance card extraction
 */
export async function POST(request) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)

  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Please wait a moment and try again' },
      { status: 503 }
    )
  }

  try {
    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const fileValidation = validateFile(file)
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      )
    }

    // Convert file to base64
    let base64Image
    try {
      base64Image = await fileToBase64(file)
    } catch (error) {
      console.error('Error converting file to base64:', error)
      return NextResponse.json(
        { error: 'Unable to process image. Please enter information manually.' },
        { status: 400 }
      )
    }

    // Create OpenAI client
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        { error: 'Unable to process image. Please enter information manually.' },
        { status: 503 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60 seconds
    })

    // Determine image MIME type
    const mimeType = file.type === 'application/pdf' ? 'application/pdf' : file.type

    // Call OpenAI Vision API
    let completion
    try {
      completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: SYSTEM_PROMPT },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Low temperature for consistent extraction
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 60000)
        )
      ])
    } catch (error) {
      if (error.message === 'Request timeout') {
        const duration = Date.now() - startTime
        console.log('Analytics:', {
          event: 'extraction_timeout',
          duration,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Processing took too long. Please try again or enter information manually.' },
          { status: 504 }
        )
      }

      // Handle OpenAI API errors
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        const duration = Date.now() - startTime
        console.log('Analytics:', {
          event: 'extraction_rate_limited',
          duration,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Please wait a moment and try again' },
          { status: 503 }
        )
      }

      // Handle image clarity errors
      if (error.message && (
        error.message.includes('unclear') ||
        error.message.includes('blurry') ||
        error.message.includes('cannot read')
      )) {
        const duration = Date.now() - startTime
        console.log('Analytics:', {
          event: 'extraction_image_unclear',
          duration,
          timestamp: new Date().toISOString()
        })
        return NextResponse.json(
          { error: 'Image is unclear. Please retake photo or enter information manually.' },
          { status: 400 }
        )
      }

      // Network or other API errors
      const duration = Date.now() - startTime
      console.log('Analytics:', {
        event: 'extraction_api_error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Unable to process image. Please enter information manually.' },
        { status: 500 }
      )
    }

    // Parse response
    let extractedData
    try {
      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in OpenAI response')
      }
      extractedData = JSON.parse(content)
    } catch (error) {
      const duration = Date.now() - startTime
      console.log('Analytics:', {
        event: 'extraction_parse_error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Unable to process image. Please enter information manually.' },
        { status: 400 }
      )
    }

    // Sanitize extracted data
    const sanitizedData = sanitizeInsuranceData(extractedData)

    // Validate extracted data
    const validation = validateInsuranceData(sanitizedData)
    if (!validation.valid) {
      const duration = Date.now() - startTime
      console.log('Analytics:', {
        event: 'extraction_validation_error',
        errors: validation.errors,
        duration,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { 
          error: validation.errors[0] || 'Invalid extracted data',
          missingField: validation.errors.find(e => e.includes('required')) || null
        },
        { status: 400 }
      )
    }

    // Log metadata (NO PHI)
    const duration = Date.now() - startTime
    const tokenUsage = completion.usage || {}
    console.log('Analytics:', {
      event: 'extraction_success',
      model: completion.model,
      duration,
      confidence: sanitizedData.confidence,
      extractedFieldsCount: sanitizedData.extracted_fields?.length || 0,
      tokens: {
        prompt: tokenUsage.prompt_tokens || 0,
        completion: tokenUsage.completion_tokens || 0,
        total: tokenUsage.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    })

    // Return sanitized and validated response
    return NextResponse.json(sanitizedData)

  } catch (error) {
    // Unexpected errors
    const duration = Date.now() - startTime
    console.error('Unexpected error in extract-insurance:', error)
    console.log('Analytics:', {
      event: 'extraction_error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Unable to process image. Please enter information manually.' },
      { status: 500 }
    )
  }
}

