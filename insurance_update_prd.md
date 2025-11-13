# Insurance Card Extraction & Matching PRD

## Overview
This PRD outlines the implementation plan for extracting insurance information from uploaded insurance card images using OpenAI Vision API, validating if the insurance matches credentialed insurances in the database, and checking if it's in-network (accepted by clinicians) or out-of-network. This is a validation-only feature that does not save any data.

## Goals
1. Automatically extract structured insurance data from card images
2. Validate if extracted insurance matches credentialed insurances in the database
3. Check if insurance is in-network (accepted by one or more clinicians) or out-of-network
4. Display validation status to user (no data storage)

## Current State
- Insurance upload component exists but doesn't process images
- `insurance_coverages` table exists with all required fields
- `credentialed_insurances` table contains insurance company data
- `clinician_credentialed_insurances` junction table links clinicians to insurances
- OpenAI SDK is already installed and configured

## Requirements

### 1. Insurance Card Extraction API

#### Endpoint: `/app/api/extract-insurance/route.js`

**Purpose**: Extract structured data from insurance card images using OpenAI Vision API

**Input**:
- Single image file (front of insurance card)
- Supported formats: JPEG, PNG, PDF
- Max file size: 10MB
- Note: Image is processed and discarded after extraction (not stored)

**Output**: JSON object matching `insurance_coverages` schema:
```json
{
  "insurance_company_name": "string",
  "member_id": "string",
  "group_id": "string",
  "plan_holder_first_name": "string",
  "plan_holder_last_name": "string",
  "plan_holder_dob": "YYYY-MM-DD",
  "plan_holder_country": "US",
  "plan_holder_state": "XX",
  "plan_holder_city": "string",
  "plan_holder_zip_code": "string",
  "plan_holder_legal_gender": 0|1|2,
  "confidence": "high|medium|low",
  "extracted_fields": ["field1", "field2"]
}
```

**System Prompt**:
```
You are an expert at extracting structured data from US health insurance cards. 
Extract all visible information from the insurance card image and return as JSON 
matching this exact schema. If a field is not visible or unclear, use null or 
empty string. For dates, use YYYY-MM-DD format. For state, use 2-letter 
abbreviation (e.g., "CA", "TX"). For gender, use 0=unknown, 1=male, 2=female.
Country should always be "US" for US insurance cards.

Include a confidence level: "high" if all key fields are clear, "medium" if 
most fields are clear, "low" if image is unclear or many fields missing.
```

**Technical Details**:
- Use OpenAI Vision API (gpt-4o - recommended for best vision accuracy)
- Convert image to base64 for API call
- Process single card image (front only)
- Images are processed in-memory and discarded after extraction (not stored)
- Rate limiting: 10 requests per minute per IP
- Timeout: 60 seconds
- Error handling for unclear/blurry images
- No authentication required (public endpoint)

**Validation**:
- Validate file type and size before processing
- Sanitize extracted data
- Validate date formats
- Validate state abbreviations (US states only)
- Ensure country is set to 'US'
- Required field: `insurance_company_name` (must be present for matching)
- Optional field: `plan_holder_state` (helps matching but not required)

### 2. Insurance Matching Service

#### File: `/lib/services/insurance-matcher.js`

**Purpose**: Match extracted insurance data to `credentialed_insurances` table

**Matching Strategy** (in priority order):

1. **Exact Name + State Match** (100% confidence)
   - Exact match on `name` field
   - State matches `plan_holder_state`
   - Check `_fivetran_deleted = false`

2. **Legacy Names + State Match** (90% confidence)
   - Check if `insurance_company_name` exists in `legacy_names` array
   - State matches `plan_holder_state`

3. **OpenPM Name Match** (85% confidence)
   - Match on `open_pm_name` field
   - State matches if available

4. **Fuzzy Name Match** (variable confidence)
   - Use PostgreSQL `similarity()` function or ILIKE pattern matching
   - State matches if available
   - Return similarity score (0-100)

5. **Parent Insurance Lookup**
   - If child insurance doesn't match, check `parent_credentialed_insurance_id`
   - Match against parent insurance

**Query Pattern**:
```sql
SELECT 
  ci.*,
  CASE 
    WHEN ci.name ILIKE $1 THEN 100
    WHEN $1 = ANY(ci.legacy_names) THEN 90
    WHEN ci.open_pm_name ILIKE $1 THEN 85
    ELSE similarity(ci.name, $1) * 100
  END as match_score
FROM credentialed_insurances ci
WHERE 
  (ci.name ILIKE '%' || $1 || '%' 
   OR $1 = ANY(ci.legacy_names)
   OR ci.open_pm_name ILIKE '%' || $1 || '%')
  AND ($2 IS NULL OR ci.state = $2 OR ci.state IS NULL)  -- State is optional
  AND ci.country = 'US'  -- US only
  AND ci._fivetran_deleted = false
ORDER BY match_score DESC
LIMIT 5
```

**Required Fields for Matching**:
- `insurance_company_name` - REQUIRED (must be extracted for matching to work)
- `plan_holder_state` - OPTIONAL (improves matching accuracy but not required)

**Normalization**:
- Remove special characters
- Standardize abbreviations (e.g., "BCBS" = "Blue Cross Blue Shield")
- Case-insensitive matching
- Handle common variations

**Return Format**:
```json
{
  "matches": [
    {
      "insurance_id": "uuid",
      "insurance_name": "string",
      "match_score": 0-100,
      "match_type": "exact|legacy|openpm|fuzzy|parent",
      "state": "XX",
      "line_of_business": 1|2,
      "network_status": 0|1|2
    }
  ],
  "best_match": { ... },
  "confidence": "high|medium|low"
}
```

**Match Score Threshold**: Minimum score of 70 is required for a valid match. Matches below this threshold are considered invalid.

### 3. Insurance Matching API

#### Endpoint: `/app/api/match-insurance/route.js`

**Purpose**: Check if extracted insurance is valid and in-network with any clinicians (validation only, no data storage)

**Input**: Extracted insurance data from card
```json
{
  "insurance_company_name": "string",
  "plan_holder_state": "XX"
}
```

**Output**:
```json
{
  "is_valid_insurance": true|false,
  "matched_insurance": {
    "id": "uuid",
    "name": "string",
    "match_score": 0-100
  } | null,
  "is_in_network": true|false,
  "message": "string"
}
```

**Query to Check In-Network Status**:
```sql
-- Check if any clinicians accept this insurance
SELECT COUNT(*) > 0 as has_clinicians
FROM clinician_insurance_affiliations cia
WHERE cia.credentialed_insurance_id = $1
  AND cia._fivetran_deleted = false
```

**Note**: We use `clinician_insurance_affiliations` junction table to check if the matched insurance is accepted by any clinicians. This tells us if the insurance is in-network (accepted by one or more clinicians) or out-of-network (not accepted by any clinicians).

**Validation Logic**:
- **Valid Insurance**: Match score >= 70 and insurance found in `credentialed_insurances`
- **In-Network**: Valid insurance AND at least one clinician accepts it (exists in `clinician_insurance_affiliations`)
- **Out-of-Network**: Valid insurance BUT no clinicians accept it
- **Invalid**: No match found OR match score < 70

**Important**: This endpoint does NOT save any data to `insurance_coverages`. It only validates the insurance and checks network status.

### 4. Frontend Updates

#### Update: `components/onboarding/InsuranceUpload.jsx`

**Changes**:
- Add loading state during extraction
- Send single card image to `/api/extract-insurance` on submit
- Display extracted information for user confirmation
- Store extracted data in context/state
- Handle errors gracefully
- Single card upload only (front of card)

**New Flow**:
1. User uploads single card image (front)
2. On submit, convert image to base64 or FormData
3. POST to `/api/extract-insurance`
4. Show loading spinner during extraction
5. Image is processed and discarded (not stored)
6. Display extracted data in review/confirmation screen
7. User confirms/corrects extracted data
8. If user edits data, automatically re-validate by POSTing to `/api/match-insurance`
9. POST to `/api/match-insurance` to validate insurance
10. Show validation results (valid/invalid, in-network/out-of-network)
11. User can always proceed to next step regardless of validation status (no data saved to database)

**UI States**:
- Initial: File upload ready
- Uploading: Show progress
- Extracting: Show "Analyzing card..." message
- Review: Show extracted data with edit capability
- Validating: Show "Checking insurance..." message
- Results: Show validation status (valid/invalid, in-network/out-of-network)

#### Update: `components/onboarding/InsuranceResults.jsx`

**Enhancements**:
- Display insurance validation status
- Show if insurance is in-network or out-of-network
- Show match confidence indicator
- Allow user to proceed or edit insurance info

**New Display Elements**:
- Insurance company name (matched or extracted)
- Validation status messages:
  - Valid + In-Network: "✓ Your insurance is accepted by our network"
  - Valid + Out-of-Network: "Your insurance is recognized but not currently in our network"
  - Invalid: "Insurance not recognized. You can still proceed."
- Match confidence badge (High/Medium/Low)
- "Edit Insurance Info" button (triggers re-validation if data changes)
- "Continue" button (always available, user can proceed regardless of validation status)

**Note**: Do NOT show list of clinicians. Only indicate whether insurance is in-network (accepted by one or more clinicians) or out-of-network. User can always proceed to next step.

### 5. Data Flow

```
1. User uploads single insurance card image (front)
   ↓
2. Frontend sends to /api/extract-insurance
   ↓
3. OpenAI Vision extracts structured data
   ↓
4. Image is discarded (not stored)
   ↓
5. Return extracted JSON to frontend
   ↓
6. User reviews/confirms extracted data
   ↓
7. Frontend sends to /api/match-insurance
   ↓
8. Backend matches to credentialed_insurances (US-only, min score 70)
   ↓
9. Backend checks if any clinicians accept this insurance
   ↓
10. Return validation status (valid/invalid, in-network/out-of-network)
   ↓
11. Display results to user (no data saved)
   ↓
12. User proceeds to next step
```

### 6. Error Handling & Edge Cases

**Image Quality Issues**:
- Unclear/blurry images → Show "Image is unclear. Please retake photo or enter information manually." with manual entry option
- Missing fields → Show extracted fields, allow manual entry for missing required fields
- Single card only → Process the uploaded card

**Matching Issues**:
- No insurance match found OR match score < 70 → Show "Insurance not recognized" message, user can still proceed
- Multiple matches → Use best match (highest score >= 70)
- Partial matches → If score < 70, treat as invalid but user can still proceed
- Missing required field (`insurance_company_name`) → Show "Unable to extract insurance company name. Please try again or enter manually." with manual entry option

**API Issues**:
- Rate limiting → Show "Please wait a moment and try again" message
- Timeout → Show "Processing took too long. Please try again or enter information manually." with manual entry option
- OpenAI API errors → Show "Unable to process image. Please enter information manually." with manual entry form

**Data Validation**:
- Invalid date formats → Show warning but allow user to proceed, suggest manual correction
- Invalid state codes → Auto-correct if possible, otherwise show warning but allow proceed
- Missing required fields (`insurance_company_name`) → Show "Insurance company name is required" with manual entry option, user can still proceed

### 7. Security & Privacy

**Requirements**:
- Validate image file types (JPEG, PNG, PDF only)
- Validate file sizes (max 10MB)
- Sanitize extracted data
- Don't log PHI in error messages or console logs
- Images are processed in-memory and discarded (not stored)
- Rate limit API calls (10 requests/minute per IP)
- No authentication required (public endpoints)
- Secure API endpoints with proper error handling
- Validate US-only insurance (country = 'US')

**PHI Handling**:
- Only log metadata (no names, IDs, or dates)
- Use structured logging for analytics
- Mask sensitive data in error responses
- Comply with HIPAA requirements

### 8. Database Schema

**Existing Tables** (no changes needed):
- `credentialed_insurances` - Master list of insurance companies (used for matching)
- `clinician_insurance_affiliations` - Junction table (clinicians ↔ insurances) - used to check if insurance is in-network

**Note**: `insurance_coverages` table exists but is NOT used in this flow. This is a validation-only feature that does not save any data.

**Key Fields for Matching** (from extracted data, not from database):
- Extracted `insurance_company_name` → Match against `credentialed_insurances.name`
- Extracted `plan_holder_state` → Match against `credentialed_insurances.state` (optional, improves accuracy)
- Extracted `plan_holder_country` → Always 'US' (US-only support)
- `credentialed_insurances.legacy_names` (array) for alternate name matching
- `credentialed_insurances.open_pm_name` for OpenPM matching

**Note**: We do NOT read from `insurance_coverages` table. All matching is done using extracted data from the card image. The `insurance_coverages` table is not used in this validation flow.

### 9. Implementation Priority

**Phase 1: Core Extraction** (Week 1)
1. Create `/api/extract-insurance` endpoint with OpenAI Vision
2. Add image upload and processing to `InsuranceUpload` component
3. Display extracted data for user review
4. Basic error handling

**Phase 2: Matching** (Week 2)
1. Create insurance matching service (`insurance-matcher.js`)
2. Create `/api/match-insurance` endpoint
3. Implement matching logic with confidence scoring
4. Query for in-network clinicians

**Phase 3: Results & Display** (Week 3)
1. Update `InsuranceResults` component
2. Display validation status (valid/invalid, in-network/out-of-network)
3. Add match confidence indicators
4. Ensure "Continue" button always allows progression

**Phase 4: Polish & Edge Cases** (Week 4)
1. Handle all error cases
2. Add manual entry fallback
3. Improve UI/UX based on testing
4. Add analytics and logging
5. Security review and hardening

### 10. Success Metrics

**Technical Metrics**:
- Extraction accuracy rate (target: >90% for clear images)
- Matching accuracy rate (target: >85% for known insurances)
- API response time (target: <5 seconds for extraction)
- Error rate (target: <5%)

**User Experience Metrics**:
- User completion rate (target: >80%)
- Manual correction rate (target: <20%)
- User satisfaction with extraction quality

**Business Metrics**:
- Number of insurance cards processed
- In-network match rate
- Validation success rate

### 11. Dependencies

**External**:
- OpenAI API (Vision API access)
- OpenAI SDK (already installed: `openai@^4.47.1`)

**Internal**:
- Database access (PostgreSQL)
- Existing insurance tables
- File upload component
- Onboarding context/state management

### 12. Decisions Made

1. **Image Storage**: Images are NOT stored. They are processed in-memory and discarded after extraction. The `front_card_url` and `back_card_url` fields in `insurance_coverages` will remain null.

2. **Multiple Insurance Cards**: Single card upload only. One insurance card per patient/user.

3. **Batch Processing**: Not supported. One card at a time.

4. **OpenAI Fallback**: Manual entry form will be available as fallback if OpenAI API is unavailable.

5. **Caching**: No caching. All queries are performed in real-time.

6. **International Support**: US-only. All insurance matching will filter by `country = 'US'`. Extracted data will default `plan_holder_country` to 'US'.

7. **Data Storage**: No data is saved to `insurance_coverages` table. This is a validation-only flow to check if insurance is valid and in-network.

8. **Clinician Display**: Do not show list of clinicians. Only indicate if insurance is "In-Network" (accepted by one or more clinicians) or "Out-of-Network" (not accepted by any clinicians).

9. **Match Score Threshold**: Minimum score of 70 required for valid insurance match.

10. **Junction Table**: Use `clinician_insurance_affiliations` to check if insurance is accepted by any clinicians (determines in-network status).

### 13. Future Enhancements

- Support for back of card extraction (additional fields)
- OCR fallback if OpenAI fails
- Insurance card validation (check if card is expired)
- Integration with insurance eligibility verification APIs
- Machine learning model for improved matching accuracy
- Support for insurance cards in multiple languages

