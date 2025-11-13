# Insurance Card Extraction & Matching - Implementation Task List

This document breaks down the PRD implementation into two sequential pull requests that together implement the full feature with nothing extra and nothing less.

---

## Pull Request 1: Insurance Card Extraction & Basic Validation

### Overview
Implement the insurance card image extraction using OpenAI Vision API and basic frontend flow for uploading and reviewing extracted data.

### Backend Tasks

#### 1. Create Insurance Extraction API Endpoint
**File**: `app/api/extract-insurance/route.js`

**Requirements**:
- Accept single image file (JPEG, PNG, PDF, max 10MB)
- Convert image to base64 for OpenAI Vision API
- Use OpenAI Vision API with `gpt-4o` model
- Extract structured data matching insurance_coverages schema
- Return JSON with extracted fields and confidence level
- Rate limiting: 10 requests per minute per IP
- Timeout: 60 seconds
- No authentication required (public endpoint)
- Process image in-memory and discard (no storage)
- Validate file type and size before processing
- Sanitize extracted data
- Validate date formats (YYYY-MM-DD)
- Validate state abbreviations (US states only)
- Ensure country is set to 'US'
- Required field: `insurance_company_name`
- Optional field: `plan_holder_state`

**System Prompt** (from PRD):
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

**Output Format**:
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

**Error Handling**:
- Unclear/blurry images → Return error: "Image is unclear. Please retake photo or enter information manually."
- OpenAI API errors → Return error: "Unable to process image. Please enter information manually."
- Timeout → Return error: "Processing took too long. Please try again or enter information manually."
- Rate limiting → Return 503: "Please wait a moment and try again"
- Missing required field → Return error with indication of missing field
- Invalid file type/size → Return 400 with validation error

**Logging**:
- Log metadata only (no PHI)
- Log extraction success/failure
- Log API response times
- Log token usage

### Frontend Tasks

#### 2. Update InsuranceUpload Component
**File**: `components/onboarding/InsuranceUpload.jsx`

**Changes**:
- Add loading state during extraction
- Send single card image to `/api/extract-insurance` on submit
- Convert image to base64 or FormData before sending
- Display extracted information for user review
- Store extracted data in context/state (use `useOnboardingState`)
- Handle errors gracefully with user-friendly messages
- Single card upload only (front of card)
- Show loading spinner during extraction with "Analyzing card..." message
- Display extracted data in review screen with edit capability
- Allow user to edit extracted data

**UI States**:
- Initial: File upload ready
- Uploading: Show progress
- Extracting: Show "Analyzing card..." message
- Review: Show extracted data with edit capability
- Error: Show error message with manual entry option

**Error Messages**:
- Image unclear: "Image is unclear. Please retake photo or enter information manually."
- API error: "Unable to process image. Please enter information manually."
- Timeout: "Processing took too long. Please try again or enter information manually."
- Rate limit: "Please wait a moment and try again"

#### 3. Update OnboardingContext (if needed)
**File**: `lib/context/OnboardingContext.jsx`

**Changes** (if not already present):
- Add state for extracted insurance data
- Add setter for insurance extraction results
- Store extracted data temporarily (not persisted)

### Testing Requirements for PR 1
- Test image upload and extraction
- Test error handling (blurry images, API failures, timeouts)
- Test rate limiting
- Test file validation (type, size)
- Test data extraction accuracy
- Test UI states and transitions
- Test manual entry fallback (if implemented in this PR)

---

## Pull Request 2: Insurance Matching & Validation Results

### Overview
Implement insurance matching service, matching API endpoint, and results display showing validation status (valid/invalid, in-network/out-of-network).

### Backend Tasks

#### 1. Create Insurance Matching Service
**File**: `lib/services/insurance-matcher.js`

**Purpose**: Match extracted insurance data to `credentialed_insurances` table

**Matching Strategy** (in priority order):
1. **Exact Name + State Match** (100% score)
   - Exact match on `name` field
   - State matches `plan_holder_state` (if provided)
   - Check `_fivetran_deleted = false`

2. **Legacy Names + State Match** (90% score)
   - Check if `insurance_company_name` exists in `legacy_names` array
   - State matches `plan_holder_state` (if provided)

3. **OpenPM Name Match** (85% score)
   - Match on `open_pm_name` field
   - State matches if available

4. **Fuzzy Name Match** (variable score)
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
  AND ($2 IS NULL OR ci.state = $2 OR ci.state IS NULL)
  AND ci.country = 'US'
  AND ci._fivetran_deleted = false
ORDER BY match_score DESC
LIMIT 5
```

**Required Fields**:
- `insurance_company_name` - REQUIRED
- `plan_holder_state` - OPTIONAL (improves matching)

**Match Score Threshold**: Minimum score of 70 required for valid match

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

**Normalization**:
- Remove special characters
- Standardize abbreviations (e.g., "BCBS" = "Blue Cross Blue Shield")
- Case-insensitive matching
- Handle common variations

#### 2. Create Insurance Matching API Endpoint
**File**: `app/api/match-insurance/route.js`

**Purpose**: Check if extracted insurance is valid and in-network with any clinicians (validation only, no data storage)

**Input**:
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

**Validation Logic**:
- **Valid Insurance**: Match score >= 70 and insurance found in `credentialed_insurances`
- **In-Network**: Valid insurance AND at least one clinician accepts it (exists in `clinician_insurance_affiliations`)
- **Out-of-Network**: Valid insurance BUT no clinicians accept it
- **Invalid**: No match found OR match score < 70

**Important**: This endpoint does NOT save any data to `insurance_coverages`. It only validates the insurance and checks network status.

**Error Handling**:
- Missing `insurance_company_name` → Return 400: "Insurance company name is required"
- Database errors → Return 500 with generic error message
- No authentication required (public endpoint)

**Logging**:
- Log metadata only (no PHI)
- Log matching success/failure
- Log match scores
- Log in-network status

### Frontend Tasks

#### 3. Update InsuranceUpload Component (Additional Changes)
**File**: `components/onboarding/InsuranceUpload.jsx`

**Additional Changes for PR 2**:
- After user confirms/edits extracted data, POST to `/api/match-insurance` to validate
- Show "Checking insurance..." message during validation
- If user edits data, automatically re-validate by POSTing to `/api/match-insurance`
- Handle validation results and pass to results component
- Store validation results in context/state

**Updated Flow**:
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
11. Navigate to results screen

**UI States** (additional):
- Validating: Show "Checking insurance..." message
- Results: Navigate to InsuranceResults component

#### 4. Update InsuranceResults Component
**File**: `components/onboarding/InsuranceResults.jsx`

**Complete Rewrite/Update**:
- Display insurance validation status
- Show if insurance is in-network or out-of-network
- Show match confidence indicator
- Allow user to proceed or edit insurance info
- Display validation status messages

**Display Elements**:
- Insurance company name (matched or extracted)
- Validation status messages:
  - Valid + In-Network: "✓ Your insurance is accepted by our network"
  - Valid + Out-of-Network: "Your insurance is recognized but not currently in our network"
  - Invalid: "Insurance not recognized. You can still proceed."
- Match confidence badge (High/Medium/Low)
- "Edit Insurance Info" button (triggers re-validation if data changes)
- "Continue" button (always available, user can proceed regardless of validation status)

**Important**: Do NOT show list of clinicians. Only indicate whether insurance is in-network (accepted by one or more clinicians) or out-of-network.

**User Flow**:
- User can always proceed to next step regardless of validation status
- "Edit Insurance Info" button allows user to go back and edit
- "Continue" button always available

**Error Handling**:
- If validation fails → Show "Unable to validate insurance. You can still proceed."
- If matching API fails → Show generic error, allow proceed

### Testing Requirements for PR 2
- Test insurance matching with various insurance names
- Test matching with and without state
- Test match score threshold (70 minimum)
- Test in-network vs out-of-network detection
- Test re-validation when user edits data
- Test results display for all scenarios (valid/invalid, in-network/out-of-network)
- Test that user can always proceed regardless of validation status
- Test database queries for matching and in-network check
- Test error handling for matching API

---

## Implementation Checklist

### PR 1 Checklist
- [ ] Create `/app/api/extract-insurance/route.js` with OpenAI Vision integration
- [ ] Implement rate limiting (10 requests/minute per IP)
- [ ] Implement file validation (type, size)
- [ ] Implement data extraction with proper system prompt
- [ ] Implement error handling for all error cases
- [ ] Update `InsuranceUpload.jsx` to call extraction API
- [ ] Add loading states and UI feedback
- [ ] Add error messages and manual entry fallback UI
- [ ] Update `OnboardingContext` to store extracted data (if needed)
- [ ] Test extraction with various card images
- [ ] Test error handling scenarios
- [ ] Test rate limiting

### PR 2 Checklist
- [ ] Create `/lib/services/insurance-matcher.js` with matching logic
- [ ] Implement all 5 matching strategies
- [ ] Implement match score calculation
- [ ] Implement match score threshold (70 minimum)
- [ ] Create `/app/api/match-insurance/route.js`
- [ ] Implement in-network check query
- [ ] Update `InsuranceUpload.jsx` to call matching API
- [ ] Implement auto re-validation on data edit
- [ ] Update `InsuranceResults.jsx` with validation status display
- [ ] Implement all validation status messages
- [ ] Ensure "Continue" button always allows progression
- [ ] Test matching with various insurance names
- [ ] Test in-network vs out-of-network detection
- [ ] Test re-validation flow
- [ ] Test results display for all scenarios

---

## Notes

- **No data storage**: Neither PR saves data to `insurance_coverages` table
- **No authentication**: Both endpoints are public
- **No caching**: All queries are performed in real-time
- **US-only**: All matching filters by `country = 'US'`
- **Single card**: Only one card upload supported
- **No clinician list**: Only show in-network/out-of-network status
- **Always allow proceed**: User can always continue regardless of validation status
- **Re-validation**: Automatically re-validate when user edits extracted data

---

## Dependencies

- OpenAI SDK (already installed: `openai@^4.47.1`)
- Database access (PostgreSQL)
- Existing tables: `credentialed_insurances`, `clinician_insurance_affiliations`
- File upload component (already exists)
- Onboarding context (already exists)

---

## Success Criteria

After both PRs are merged:
- Users can upload insurance card images
- Images are extracted using OpenAI Vision API
- Extracted data is displayed for user review/editing
- Insurance is matched against credentialed_insurances table
- Validation status (valid/invalid, in-network/out-of-network) is displayed
- Users can always proceed to next step
- No data is saved to database
- All error cases are handled gracefully

