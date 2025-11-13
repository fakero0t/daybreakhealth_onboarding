/**
 * Insurance Data Validation Utilities
 * 
 * Validation functions for insurance card extraction data.
 */

/**
 * US state abbreviations (50 states + DC)
 */
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
])

/**
 * Validate ISO date string (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid
 */
export function isValidDateFormat(date) {
  if (!date || typeof date !== 'string') {
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
 * Validate US state abbreviation
 * @param {string} state - State abbreviation to validate
 * @returns {boolean} True if valid
 */
export function isValidUSState(state) {
  if (!state || typeof state !== 'string') {
    return false
  }
  return US_STATES.has(state.toUpperCase().trim())
}

/**
 * Validate legal gender value
 * @param {number} gender - Gender value to validate
 * @returns {boolean} True if valid
 */
export function isValidLegalGender(gender) {
  if (gender === null || gender === undefined) {
    return true // Optional field
  }
  return typeof gender === 'number' && [0, 1, 2].includes(gender)
}

/**
 * Validate insurance extraction data
 * @param {Object} data - Extracted insurance data
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateInsuranceData(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid data format'] }
  }

  // Required field: insurance_company_name
  if (!data.insurance_company_name || typeof data.insurance_company_name !== 'string' || data.insurance_company_name.trim().length === 0) {
    errors.push('insurance_company_name is required')
  }

  // Optional field: plan_holder_dob - validate format if provided
  if (data.plan_holder_dob !== null && data.plan_holder_dob !== undefined && data.plan_holder_dob !== '') {
    if (!isValidDateFormat(data.plan_holder_dob)) {
      errors.push('plan_holder_dob must be in YYYY-MM-DD format')
    }
  }

  // Optional field: plan_holder_state - validate if provided
  if (data.plan_holder_state !== null && data.plan_holder_state !== undefined && data.plan_holder_state !== '') {
    if (!isValidUSState(data.plan_holder_state)) {
      errors.push('plan_holder_state must be a valid US state abbreviation')
    }
  }

  // Validate plan_holder_country is 'US' if provided
  if (data.plan_holder_country !== null && data.plan_holder_country !== undefined && data.plan_holder_country !== '') {
    if (data.plan_holder_country.toUpperCase() !== 'US') {
      errors.push('plan_holder_country must be "US" for US insurance cards')
    }
  }

  // Validate legal gender if provided
  if (data.plan_holder_legal_gender !== null && data.plan_holder_legal_gender !== undefined) {
    if (!isValidLegalGender(data.plan_holder_legal_gender)) {
      errors.push('plan_holder_legal_gender must be 0 (unknown), 1 (male), or 2 (female)')
    }
  }

  // Validate confidence level
  if (data.confidence !== null && data.confidence !== undefined && data.confidence !== '') {
    const validConfidences = ['high', 'medium', 'low']
    if (!validConfidences.includes(data.confidence.toLowerCase())) {
      errors.push('confidence must be "high", "medium", or "low"')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

