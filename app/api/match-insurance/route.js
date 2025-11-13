import { NextResponse } from 'next/server'
import { matchInsurance } from '@/lib/services/insurance-matcher'

/**
 * POST handler for insurance matching
 * Validates insurance (no data storage)
 */
export async function POST(request) {
  const startTime = Date.now()

  try {
    // Parse and validate request body
    const body = await request.json()

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be an object' },
        { status: 400 }
      )
    }

    const { insurance_company_name, plan_holder_state } = body

    // Validate required field
    if (!insurance_company_name || typeof insurance_company_name !== 'string' || insurance_company_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Insurance company name is required' },
        { status: 400 }
      )
    }

    // Validate optional state field
    let state = null
    if (plan_holder_state && typeof plan_holder_state === 'string' && plan_holder_state.trim().length > 0) {
      state = plan_holder_state.trim().toUpperCase()
      // Basic state validation (2-letter abbreviation)
      if (state.length !== 2) {
        return NextResponse.json(
          { error: 'plan_holder_state must be a 2-letter state abbreviation' },
          { status: 400 }
        )
      }
    }

    // Match insurance
    let matchingResult
    try {
      matchingResult = await matchInsurance(insurance_company_name, state)
    } catch (error) {
      console.error('Error matching insurance:', {
        error: error.message,
        stack: error.stack,
        insuranceName: insurance_company_name?.substring(0, 50), // Log first 50 chars only
        state: state
      })
      
      // Return a response that allows user to proceed
      return NextResponse.json({
        is_valid_insurance: false,
        matched_insurance: null,
        message: 'Unable to validate insurance. You can still proceed.',
        confidence: 'low'
      })
    }

    // Determine validation status
    const bestMatch = matchingResult.best_match
    const is_valid_insurance = bestMatch !== null && bestMatch.match_score >= 70

    // Generate message based on validation status
    let message = ''
    if (!is_valid_insurance) {
      message = 'Insurance not recognized. You can still proceed.'
    } else {
      message = 'Your insurance is not currently in our network. You may incur out of pocket costs'
    }

    // Log metadata (NO PHI)
    const duration = Date.now() - startTime
    console.log('Analytics:', {
      event: 'insurance_matching',
      is_valid: is_valid_insurance,
      match_score: bestMatch?.match_score || null,
      match_type: bestMatch?.match_type || null,
      confidence: matchingResult.confidence,
      has_state: state !== null,
      duration,
      timestamp: new Date().toISOString()
    })

    // Return validation results
    return NextResponse.json({
      is_valid_insurance,
      matched_insurance: bestMatch ? {
        id: bestMatch.insurance_id,
        name: bestMatch.insurance_name,
        match_score: bestMatch.match_score
      } : null,
      message,
      confidence: matchingResult.confidence
    })

  } catch (error) {
    // Unexpected errors
    const duration = Date.now() - startTime
    console.error('Unexpected error in match-insurance:', error)
    console.log('Analytics:', {
      event: 'insurance_matching_error',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { error: 'Unable to validate insurance. You can still proceed.' },
      { status: 500 }
    )
  }
}

