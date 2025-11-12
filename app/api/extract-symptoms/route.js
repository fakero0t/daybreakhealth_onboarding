import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAllSymptomKeys } from '@/lib/constants/symptom-mapping'

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
 * System prompt for OpenAI
 */
const SYSTEM_PROMPT = `You are a mental health assessment assistant. Your task is to extract symptom information from narrative responses about a child's mental health over the past 2 weeks.

You will receive 5 narrative responses. Analyze them and map symptoms to the following 32 standardized symptoms. For each symptom, determine if it occurs:
- "Daily": Symptom occurs daily or very frequently
- "Some": Symptom occurs sometimes or occasionally  
- "None": Symptom does not occur or is not present

Symptom list (in order):
1. Sadness/Depressed Mood/Crying Spells
2. Temper Outbursts
3. Withdrawn or Isolated
4. Daydreaming
5. Fearful
6. Clumsy
7. Over-reactive
8. Short Attention Span/Difficulty Concentrating
9. Fatigue/Low Energy
10. Hard to make decisions
11. Appetite increase or decrease/Feeding or eating problems
12. Weight increase or decrease
13. Distractible
14. Suicidal thoughts
15. Attempts to self-harm
16. Peer Conflict/Mean to others
17. Mood swings
18. Increased energy
19. Racing thoughts
20. Bedwetting
21. Decreased need for sleep
22. Excessive worry
23. Feeling "on edge"
24. Panic Attacks
25. Destructive
26. Restlessness
27. Irritability or Anger
28. Stealing, lying, disregard for others
29. Defiance toward authority
30. Impulsivity
31. Nightmares
32. Hearing or seeing things - others don't see/hear

Mapping examples:
- "cries every day" → "Daily" for sadness
- "sometimes gets upset" → "Some" for temper outbursts
- No mention of symptom → "None"

Ambiguous cases:
- When uncertain between "Some" and "Daily", default to "Some"
- When uncertain between "Some" and "None", use balanced judgment but slightly conservative (prefer "None" when truly unclear)
- When truly uncertain, prefer "None" over "Some", and "Some" over "Daily" to avoid false positives

Return a JSON object with kebab-case keys for each symptom. Use empty string "" if you cannot extract a clear answer.

Response format:
{
  "sadness-depressed-mood": "Daily" | "Some" | "None" | "",
  "temper-outbursts": "Daily" | "Some" | "None" | "",
  // ... all 32 symptoms
}`

/**
 * Validate request body
 */
function validateRequest(body) {
  if (!Array.isArray(body)) {
    return { valid: false, error: 'Request body must be an array of 5 strings' }
  }

  if (body.length !== 5) {
    return { valid: false, error: 'Request body must contain exactly 5 answers' }
  }

  for (let i = 0; i < body.length; i++) {
    if (typeof body[i] !== 'string') {
      return { valid: false, error: `Answer ${i + 1} must be a string` }
    }

    const length = body[i].length
    if (length < 10 || length > 5000) {
      return { valid: false, error: `Answer ${i + 1} must be between 10 and 5000 characters` }
    }
  }

  return { valid: true }
}

/**
 * Validate and sanitize OpenAI response
 */
function validateResponse(response, expectedKeys) {
  const validated = {}
  const allowedValues = ['Daily', 'Some', 'None', '']

  // Ensure all expected keys are present
  for (const key of expectedKeys) {
    if (response.hasOwnProperty(key)) {
      const value = response[key]
      // Validate value is one of allowed values
      if (allowedValues.includes(value)) {
        validated[key] = value
      } else {
        console.warn(`Invalid symptom value for ${key}: ${value}. Using empty string.`)
        validated[key] = ''
      }
    } else {
      console.warn(`Missing symptom key: ${key}. Using empty string.`)
      validated[key] = ''
    }
  }

  // Log warning for any unexpected keys
  for (const key in response) {
    if (!expectedKeys.includes(key)) {
      console.error(`Unexpected symptom key in response: ${key}. Ignoring.`)
    }
  }

  return validated
}

/**
 * POST handler for symptom extraction
 */
export async function POST(request) {
  const startTime = Date.now()
  const clientIP = getClientIP(request)

  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again in a moment.' },
      { status: 503 }
    )
  }

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = validateRequest(body)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create OpenAI client
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      )
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60 seconds
    })

    // Format user prompt
    const userPrompt = `Q1: ${body[0]}\n\nQ2: ${body[1]}\n\nQ3: ${body[2]}\n\nQ4: ${body[3]}\n\nQ5: ${body[4]}`

    // Call OpenAI API
    let completion
    try {
      completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more consistent extraction
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
          { error: 'Request took too long. Please try again.' },
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
          { error: 'Service temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
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
        { error: 'Unable to connect. Please check your internet connection and try again.' },
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
        { error: 'Unable to process responses. Please try again.' },
        { status: 400 }
      )
    }

    // Validate and sanitize response
    const expectedKeys = getAllSymptomKeys()
    const validatedData = validateResponse(extractedData, expectedKeys)

    // Log metadata (NO PHI)
    const duration = Date.now() - startTime
    const tokenUsage = completion.usage || {}
    console.log('Analytics:', {
      event: 'extraction_success',
      model: completion.model,
      duration,
      tokens: {
        prompt: tokenUsage.prompt_tokens || 0,
        completion: tokenUsage.completion_tokens || 0,
        total: tokenUsage.total_tokens || 0
      },
      timestamp: new Date().toISOString()
    })

    // Return validated response
    return NextResponse.json({
      symptoms: validatedData,
      metadata: {
        extractedAt: Date.now(),
        model: completion.model
      }
    })

  } catch (error) {
    // Unexpected errors
    const duration = Date.now() - startTime
    console.error('Unexpected error in extract-symptoms:', error)
    console.log('Analytics:', {
      event: 'extraction_error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Unable to process responses. Please try again.' },
      { status: 500 }
    )
  }
}

