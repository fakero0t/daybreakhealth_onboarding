/**
 * Insurance Matching Service
 * 
 * Matches extracted insurance data to credentialed_insurances table
 * using multiple matching strategies.
 */

import { query } from '@/lib/db/client'

/**
 * Normalize insurance company name for matching
 * - Remove special characters
 * - Standardize common abbreviations
 * - Case-insensitive
 */
function normalizeInsuranceName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }

  let normalized = name.trim()

  // Standardize common abbreviations
  const abbreviations = {
    'bcbs': 'blue cross blue shield',
    'bc/bs': 'blue cross blue shield',
    'blue cross': 'blue cross blue shield',
    'aetna': 'aetna',
    'cigna': 'cigna',
    'unitedhealthcare': 'united healthcare',
    'uhc': 'united healthcare',
    'humana': 'humana',
    'kaiser': 'kaiser permanente',
    'kp': 'kaiser permanente',
  }

  // Convert to lowercase for matching
  normalized = normalized.toLowerCase()

  // Check for abbreviations
  for (const [abbrev, full] of Object.entries(abbreviations)) {
    if (normalized.includes(abbrev)) {
      normalized = normalized.replace(new RegExp(abbrev, 'gi'), full)
    }
  }

  // Remove special characters (keep spaces, letters, numbers)
  normalized = normalized.replace(/[^a-z0-9\s]/gi, ' ')

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  return normalized
}

/**
 * Match insurance by exact name
 */
async function matchExactName(insuranceName, state) {
  const normalizedName = normalizeInsuranceName(insuranceName)
  const originalName = insuranceName.trim().toLowerCase()
  
  // Try both normalized and original name for better matching
  let sql = `
    SELECT 
      id,
      name,
      state,
      line_of_business,
      network_status,
      parent_credentialed_insurance_id,
      CASE
        WHEN LOWER(TRIM(name)) = $1 THEN 100
        WHEN LOWER(TRIM(name)) = $2 THEN 100
        WHEN LOWER(TRIM(name)) LIKE $3 THEN 95
        WHEN LOWER(TRIM(name)) LIKE $4 THEN 95
        ELSE 90
      END as match_score,
      'exact' as match_type
    FROM clinician_credentialed_insurances
    WHERE (
      LOWER(TRIM(name)) = $1
      OR LOWER(TRIM(name)) = $2
      OR LOWER(TRIM(name)) LIKE $3
      OR LOWER(TRIM(name)) LIKE $4
    )
      AND country = 'US'
      AND _fivetran_deleted = false
  `

  const normalizedPattern = `%${normalizedName}%`
  const originalPattern = `%${originalName}%`
  const params = [normalizedName, originalName, normalizedPattern, originalPattern]

  if (state) {
    sql += ` AND (state = $5 OR state IS NULL)`
    params.push(state.toUpperCase())
  }

  sql += ` ORDER BY match_score DESC, name LIMIT 5`

  const result = await query(sql, params)
  return result.rows
}

/**
 * Match insurance by legacy names
 */
async function matchLegacyNames(insuranceName, state) {
  const normalizedName = normalizeInsuranceName(insuranceName)
  
  // Handle case where legacy_names might be NULL
  let sql = `
    SELECT 
      id,
      name,
      state,
      line_of_business,
      network_status,
      parent_credentialed_insurance_id,
      90 as match_score,
      'legacy' as match_type
    FROM clinician_credentialed_insurances
    WHERE legacy_names IS NOT NULL
      AND $1 = ANY(
        SELECT LOWER(TRIM(unnest(legacy_names)))
      )
      AND country = 'US'
      AND _fivetran_deleted = false
  `

  const params = [normalizedName]

  if (state) {
    sql += ` AND (state = $2 OR state IS NULL)`
    params.push(state.toUpperCase())
  }

  sql += ` ORDER BY name LIMIT 5`

  const result = await query(sql, params)
  return result.rows
}

/**
 * Match insurance by OpenPM name
 */
async function matchOpenPMName(insuranceName, state) {
  const normalizedName = normalizeInsuranceName(insuranceName)
  
  let sql = `
    SELECT 
      id,
      name,
      state,
      line_of_business,
      network_status,
      parent_credentialed_insurance_id,
      85 as match_score,
      'openpm' as match_type
    FROM clinician_credentialed_insurances
    WHERE LOWER(TRIM(open_pm_name)) = $1
      AND country = 'US'
      AND _fivetran_deleted = false
  `

  const params = [normalizedName]

  if (state) {
    sql += ` AND (state = $2 OR state IS NULL)`
    params.push(state.toUpperCase())
  }

  sql += ` ORDER BY name LIMIT 5`

  const result = await query(sql, params)
  return result.rows
}

/**
 * Match insurance using fuzzy matching (ILIKE pattern)
 */
async function matchFuzzy(insuranceName, state) {
  const normalizedName = normalizeInsuranceName(insuranceName)
  const originalName = insuranceName.trim().toLowerCase()
  
  // Extract key words from the name (words longer than 2 characters)
  const words = normalizedName.split(/\s+/).filter(w => w.length > 2)
  const originalWords = originalName.split(/\s+/).filter(w => w.length > 2)
  
  // Use ILIKE for pattern matching (case-insensitive LIKE)
  // Build patterns for matching
  const normalizedPattern = normalizedName ? `%${normalizedName}%` : null
  const originalPattern = originalName ? `%${originalName}%` : null
  const wordPattern = words.length > 0 ? `%${words.join('%')}%` : null
  
  // Use the most specific patterns
  const patterns = []
  if (normalizedPattern) patterns.push(normalizedPattern)
  if (originalPattern && originalPattern !== normalizedPattern) patterns.push(originalPattern)
  if (wordPattern && wordPattern !== normalizedPattern) patterns.push(wordPattern)
  
  if (patterns.length === 0) {
    return []
  }
  
  // Build WHERE clause with multiple LIKE conditions
  const likeConditions = patterns.map((_, i) => `LOWER(TRIM(name)) LIKE $${i + 1}`).join(' OR ')
  
  let sql = `
    SELECT 
      id,
      name,
      state,
      line_of_business,
      network_status,
      parent_credentialed_insurance_id,
      CASE
        WHEN LOWER(TRIM(name)) LIKE $1 THEN 80
        ${patterns.length > 1 ? `WHEN LOWER(TRIM(name)) LIKE $2 THEN 78` : ''}
        ELSE 75
      END as match_score,
      'fuzzy' as match_type
    FROM clinician_credentialed_insurances
    WHERE (${likeConditions})
      AND country = 'US'
      AND _fivetran_deleted = false
  `

  const params = patterns

  if (state) {
    sql += ` AND (state = $${params.length + 1} OR state IS NULL)`
    params.push(state.toUpperCase())
  }

  sql += ` ORDER BY match_score DESC, name LIMIT 5`

  const result = await query(sql, params)
  return result.rows
}

/**
 * Match insurance by parent insurance lookup
 */
async function matchParentInsurance(insuranceName, state, matchedIds) {
  if (matchedIds.length === 0) {
    return []
  }

  const normalizedName = normalizeInsuranceName(insuranceName)
  
  let sql = `
    SELECT DISTINCT
      p.id,
      p.name,
      p.state,
      p.line_of_business,
      p.network_status,
      p.parent_credentialed_insurance_id,
      85 as match_score,
      'parent' as match_type
    FROM clinician_credentialed_insurances c
    JOIN clinician_credentialed_insurances p ON c.parent_credentialed_insurance_id = p.id
    WHERE c.id = ANY($1::uuid[])
      AND p.country = 'US'
      AND p._fivetran_deleted = false
  `

  const params = [matchedIds]

  if (state) {
    sql += ` AND (p.state = $2 OR p.state IS NULL)`
    params.push(state.toUpperCase())
  }

  sql += ` ORDER BY p.name LIMIT 5`

  const result = await query(sql, params)
  return result.rows
}

/**
 * Match insurance company name to credentialed_insurances
 * 
 * @param {string} insuranceCompanyName - Insurance company name (required)
 * @param {string} planHolderState - Plan holder state (optional, improves matching)
 * @returns {Promise<Object>} Matching results with matches, best_match, and confidence
 */
export async function matchInsurance(insuranceCompanyName, planHolderState = null) {
  if (!insuranceCompanyName || typeof insuranceCompanyName !== 'string' || insuranceCompanyName.trim().length === 0) {
    throw new Error('Insurance company name is required')
  }

  const state = planHolderState ? planHolderState.toUpperCase().trim() : null

  // Log what we're searching for (first 50 chars only for privacy)
  console.log('Matching insurance:', {
    originalName: insuranceCompanyName.substring(0, 50),
    normalizedName: normalizeInsuranceName(insuranceCompanyName).substring(0, 50),
    state: state
  })

  // Try matching strategies in priority order
  let allMatches = []
  const seenIds = new Set()

  // 1. Exact name match (100% score)
  try {
    const exactMatches = await matchExactName(insuranceCompanyName, state)
    for (const match of exactMatches) {
      if (!seenIds.has(match.id)) {
        allMatches.push(match)
        seenIds.add(match.id)
      }
    }
  } catch (error) {
    console.error('Error in exact name match:', error)
    // Continue with other strategies
  }

  // 2. Legacy names match (90% score)
  if (allMatches.length === 0 || allMatches[0].match_score < 100) {
    try {
      const legacyMatches = await matchLegacyNames(insuranceCompanyName, state)
      for (const match of legacyMatches) {
        if (!seenIds.has(match.id)) {
          allMatches.push(match)
          seenIds.add(match.id)
        }
      }
    } catch (error) {
      console.error('Error in legacy names match:', error)
      // Continue with other strategies
    }
  }

  // 3. OpenPM name match (85% score)
  if (allMatches.length === 0 || allMatches[0].match_score < 90) {
    try {
      const openPMMatches = await matchOpenPMName(insuranceCompanyName, state)
      for (const match of openPMMatches) {
        if (!seenIds.has(match.id)) {
          allMatches.push(match)
          seenIds.add(match.id)
        }
      }
    } catch (error) {
      console.error('Error in OpenPM name match:', error)
      // Continue with other strategies
    }
  }

  // 4. Fuzzy match (variable score, 70-80%)
  if (allMatches.length === 0 || allMatches[0].match_score < 85) {
    try {
      const fuzzyMatches = await matchFuzzy(insuranceCompanyName, state)
      for (const match of fuzzyMatches) {
        if (!seenIds.has(match.id)) {
          allMatches.push(match)
          seenIds.add(match.id)
        }
      }
    } catch (error) {
      console.error('Error in fuzzy match:', error)
      // Continue - no more strategies after this
    }
  }

  // 5. Parent insurance lookup (if we have matches but want to check parents)
  if (allMatches.length > 0) {
    try {
      const matchedIds = allMatches.map(m => m.id)
      const parentMatches = await matchParentInsurance(insuranceCompanyName, state, matchedIds)
      for (const match of parentMatches) {
        if (!seenIds.has(match.id)) {
          allMatches.push(match)
          seenIds.add(match.id)
        }
      }
    } catch (error) {
      console.error('Error in parent insurance lookup:', error)
      // Continue - parent lookup is optional
    }
  }

  // Sort by match score descending
  allMatches.sort((a, b) => b.match_score - a.match_score)

  // Log all matches found (for debugging)
  console.log('Insurance matches found:', {
    totalMatches: allMatches.length,
    matches: allMatches.map(m => ({
      name: m.name?.substring(0, 50),
      score: m.match_score,
      type: m.match_type
    }))
  })

  // Filter to minimum score threshold (70)
  const thresholdMatches = allMatches.filter(m => m.match_score >= 70)

  // Determine best match
  const bestMatch = thresholdMatches.length > 0 ? thresholdMatches[0] : null

  // Determine confidence
  let confidence = 'low'
  if (bestMatch) {
    if (bestMatch.match_score >= 90) {
      confidence = 'high'
    } else if (bestMatch.match_score >= 80) {
      confidence = 'medium'
    }
  } else if (allMatches.length > 0) {
    // If we have matches but below threshold, still set confidence based on best match
    const bestMatchBelowThreshold = allMatches[0]
    if (bestMatchBelowThreshold.match_score >= 60) {
      confidence = 'low'
    }
  }

  // Format matches for response
  const formattedMatches = thresholdMatches.map(match => ({
    insurance_id: match.id,
    insurance_name: match.name,
    match_score: match.match_score,
    match_type: match.match_type,
    state: match.state,
    line_of_business: match.line_of_business,
    network_status: match.network_status,
  }))

  return {
    matches: formattedMatches,
    best_match: bestMatch ? {
      insurance_id: bestMatch.id,
      insurance_name: bestMatch.name,
      match_score: bestMatch.match_score,
      match_type: bestMatch.match_type,
      state: bestMatch.state,
      line_of_business: bestMatch.line_of_business,
      network_status: bestMatch.network_status,
    } : null,
    confidence,
  }
}

/**
 * Check if insurance is in-network (accepted by at least one clinician)
 * 
 * @param {string} credentialedInsuranceId - Credentialed insurance ID
 * @returns {Promise<boolean>} True if in-network
 */
export async function checkInNetworkStatus(credentialedInsuranceId) {
  if (!credentialedInsuranceId) {
    return false
  }

  const sql = `
    SELECT COUNT(*) > 0 as has_clinicians
    FROM clinician_insurance_affiliations
    WHERE credentialed_insurance_id = $1
      AND _fivetran_deleted = false
  `

  try {
    const result = await query(sql, [credentialedInsuranceId])
    return result.rows[0]?.has_clinicians || false
  } catch (error) {
    console.error('Error checking in-network status:', error)
    return false
  }
}

