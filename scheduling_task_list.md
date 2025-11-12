# Scheduling Feature Implementation - Task List

This document breaks down the scheduling PRD into 5 sequential pull requests that, when implemented in order, will result in the fully implemented scheduling feature.

## Goals
The implementation should achieve the following goals:
1. Simplify the scheduling experience by removing the calendar grid interface
2. Allow users to express availability preferences in natural language
3. Use AI to accurately interpret user availability preferences
4. Match user preferences against real clinician availability data
5. Present 3-5 relevant appointment time slot options
6. Improve user experience with conversational scheduling

## PR 1: Data Infrastructure & CSV Loading

### Overview
Set up the foundation for loading and processing clinician availability data from CSV file. This includes CSV parsing, data caching, filtering, and expanding repeating availabilities.

### Files to Create/Modify

#### New Files:
1. **`lib/utils/csv-loader.js`**
   - Function to load CSV file from `Daybreak Health Test Cases/clinician_availabilities.csv`
   - Use `papaparse` library for CSV parsing
   - Parse CSV into structured JavaScript objects/arrays
   - Handle malformed CSV rows (skip and log errors to console)
   - Handle duplicate availability IDs (keep first occurrence)
   - Skip rows where `range_start > range_end` (data error)
   - Validate timezone strings - if invalid, fallback to "America/Los_Angeles"
   - Return array of availability objects

2. **`lib/utils/availability-processor.js`**
   - Function to filter active availabilities:
     - `deleted_at IS NULL`
     - `range_start >= current_date AND range_start <= current_date + 60 days`
     - If `is_repeating = true`, check `end_on IS NULL OR end_on >= current_date`
   - Filter by `parent_organization_id = 85685` (fixed value)
   - Do not filter by `appointment_location_id` - show all locations
   - Function to expand repeating availabilities to specific dates within 60-day window:
     - For each repeating availability (`is_repeating = true`):
       - Get `day_of_week` value (0-6)
       - Find all dates in next 60 days that match this day of week
       - If `end_on` is set and within 60-day window, stop expanding at `end_on`
       - Create individual availability records for each matching date
       - Use same `range_start` and `range_end` times for each expanded date
   - Filter out any availabilities with `range_start` in the past
   - Pre-process and index data:
     - Create index by `day_of_week` for fast day-based queries
     - Create index by time ranges for fast time-based queries
     - Store in memory as array of availability objects

3. **`lib/utils/timezone-utils.js`**
   - Function to detect user's timezone from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
   - Function to validate IANA timezone strings
   - Function to convert timezone string to user-friendly name (e.g., "America/Los_Angeles" → "Pacific Time")
   - Fallback to "America/Los_Angeles" if browser detection fails
   - Use `date-fns-tz` or `luxon` for timezone handling
   - Handle daylight saving time automatically

4. **`lib/data/availability-cache.js`**
   - Module-level cache variable to store parsed availability data
   - Function to load and cache availability data on server startup
   - Function to get cached availability data
   - Function to refresh cache (manual refresh, no auto-reload)
   - Cache parsed availability data in memory
   - Load CSV file once on server startup, parse into structured data, cache in memory
   - Implement data refresh mechanism: refresh daily (or on server restart) - manual restart required, no auto-reload

#### Files to Modify:
1. **`package.json`**
   - Add dependency: `papaparse` (CSV parsing library)
   - Add dependency: `date-fns-tz` or `luxon` (timezone library)

### Implementation Details

#### CSV Loading (`lib/utils/csv-loader.js`):
- Load CSV file from path: `Daybreak Health Test Cases/clinician_availabilities.csv`
- Use `papaparse` library for parsing
- Parse each row into object with fields:
  - `user_id` (number)
  - `range_start` (string, UTC ISO timestamp)
  - `range_end` (string, UTC ISO timestamp)
  - `timezone` (string, IANA timezone)
  - `day_of_week` (number, 0-6)
  - `is_repeating` (boolean)
  - `end_on` (string, ISO date or null)
  - `appointment_location_id` (number)
  - `parent_organization_id` (number)
  - `deleted_at` (string, ISO timestamp or null)
- Error handling:
  - Skip malformed rows, log errors to console
  - Handle duplicate availability IDs by keeping first occurrence
  - Skip rows where `range_start > range_end`
  - Validate timezone strings - if invalid, fallback to "America/Los_Angeles"

#### Availability Processing (`lib/utils/availability-processor.js`):
- Filter active availabilities:
  - `deleted_at IS NULL`
  - `range_start >= current_date AND range_start <= current_date + 60 days`
  - If `is_repeating = true`, check `end_on IS NULL OR end_on >= current_date`
- Filter by `parent_organization_id = 85685` (fixed value)
- Do not filter by `appointment_location_id` - include all locations
- Filter out any availabilities with `range_start` in the past
- Expand repeating availabilities:
  - For each repeating availability (`is_repeating = true`):
    - Get `day_of_week` value (0-6)
    - Find all dates in next 60 days that match this day of week
    - If `end_on` is set and within 60-day window, stop expanding at `end_on`
    - Create individual availability records for each matching date
    - Use same `range_start` and `range_end` times for each expanded date
- Pre-process and index data:
  - Create index by `day_of_week` for fast day-based queries
  - Create index by time ranges for fast time-based queries
  - Store in memory as array of availability objects

#### Timezone Utilities (`lib/utils/timezone-utils.js`):
- `detectUserTimezone()`: Detect from browser using `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `validateTimezone(timezone)`: Validate IANA timezone string
- `formatTimezoneName(timezone)`: Convert IANA to user-friendly name (e.g., "Pacific Time", "Eastern Time")
- `getTimezoneFallback()`: Return "America/Los_Angeles" as fallback
- Use `date-fns-tz` or `luxon` for timezone handling
- Handle daylight saving time automatically

#### Availability Cache (`lib/data/availability-cache.js`):
- Module-level variable: `let cachedAvailabilityData = null`
- `loadAvailabilityData()`: Load CSV, parse, process, and cache in memory
- `getAvailabilityData()`: Return cached data (load if not cached)
- `refreshAvailabilityData()`: Reload and refresh cache
- Cache parsed availability data in memory
- Load CSV file once on server startup, parse into structured data, cache in memory
- Implement data refresh mechanism: refresh daily (or on server restart) - manual restart required, no auto-reload

### Implementation Details (Additional)

#### CSV File Management:
- **CSV file location**: Commit CSV file to repository in `Daybreak Health Test Cases/` folder
- **CSV updates**: Manual server restart required to reload CSV data (no auto-reload)
- **Request handling**: Process requests sequentially (no queuing needed for MVP)

### Testing Requirements
- Test CSV loading with valid data
- Test CSV loading with malformed rows (should skip and log errors)
- Test duplicate ID handling (keep first occurrence)
- Test timezone validation and fallback
- Test filtering by organization ID (85685)
- Test filtering active availabilities (deleted_at IS NULL)
- Test date range filtering (60-day window)
- Test repeating availability expansion
- Test past date filtering
- Test cache loading and retrieval
- **Edge case testing**: No availabilities matching criteria, all availabilities in past, invalid timezone detection, CSV parsing errors
- **Browser support**: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile

---

## PR 2: OpenAI Integration & Interpretation API

### Overview
Implement OpenAI API integration to interpret natural language scheduling preferences. Create the `/api/interpret-scheduling` route with structured output, validation, and error handling.

### Files to Create/Modify

#### New Files:
1. **`app/api/interpret-scheduling/route.js`**
   - POST endpoint to interpret natural language scheduling input
   - Use OpenAI GPT-3.5-turbo model
   - Implement structured output (JSON mode)
   - Request validation: Validate userInput is string, 10-500 characters, userTimezone is valid IANA timezone
   - Response time requirement: Maximum 5 seconds
   - Error handling with retry logic (exponential backoff, max 3 retries)
   - Error response format:
     ```json
     {
       "success": false,
       "error": "Error message",
       "code": "ERROR_CODE"
     }
     ```
   - Success response format:
     ```json
     {
       "success": true,
       "interpretedPreferences": {
         "daysOfWeek": [1, 2, 3, 4, 5],
         "timeRanges": [{"start": "17:00", "end": "23:59", "timezone": "America/Los_Angeles"}],
         "dateConstraints": {
           "startDate": "2025-10-15",
           "endDate": "2025-11-15",
           "relative": "next_week"
         },
         "specificDates": [],
         "recurringPattern": "weekdays"
       }
     }
     ```

2. **`lib/prompts/scheduling-prompt.js`**
   - System prompt for OpenAI API
   - User prompt template
   - Include all prompt engineering details from PRD:
     - Extract days of week (0-6)
     - Extract time ranges (24-hour format)
     - Extract date constraints (convert relative to actual dates)
     - Extract recurring patterns
     - Handle ambiguous times
     - Convert relative dates to actual dates
     - Examples and edge cases

3. **`lib/utils/interpretation-validator.js`**
   - Function to validate interpreted preferences structure
   - Validate daysOfWeek array (numbers 0-6)
   - Validate timeRanges array (start/end in 24-hour format, valid timezone)
   - Validate dateConstraints object (ISO date strings)
   - Validate specificDates array (ISO date strings)
   - Validate recurringPattern string
   - Return validation errors if structure is invalid

#### Files to Modify:
1. **`package.json`**
   - Note: `openai` package is already installed in the project

2. **`.env.example`** (if exists, or create)
   - Note: `OPENAI_API_KEY` is already configured in the project

### Implementation Details

#### API Route (`app/api/interpret-scheduling/route.js`):
- **Method**: POST
- **Request Body**:
  ```json
  {
    "userInput": "i am only free on weekdays after 5pm",
    "userTimezone": "America/Los_Angeles"
  }
  ```
- **Request Validation**:
  - `userInput` must be string, 10-500 characters
  - `userTimezone` must be valid IANA timezone string
  - Return error response if validation fails
- **OpenAI Integration**:
  - Use GPT-3.5-turbo model
  - Use structured output (JSON mode)
  - System prompt from `lib/prompts/scheduling-prompt.js`
  - User prompt includes: userInput, currentDate, currentTime, userTimezone
  - Response time requirement: Maximum 5 seconds
  - Timeout handling if exceeds 5 seconds
- **Error Handling**:
  - Network errors: Retry with exponential backoff (max 3 retries)
  - API errors: Return user-friendly error message
  - Invalid JSON: Fallback to manual parsing or return error
  - Rate limiting: Return error with retry suggestion
  - Timeout: Return error message
- **Response Format**:
  - Success: Return interpreted preferences object
  - Error: Return error object with code and message
- **Validation**:
  - Validate OpenAI response structure using `lib/utils/interpretation-validator.js`
  - Return error if validation fails
- **Security**:
  - Validate API responses before storing
  - Sanitize user input
  - Never expose API keys in client code
  - Rate limit API calls: 10 requests per minute per IP address (implement rate limiting middleware)
- **Performance & Monitoring**:
  - Performance benchmark: Total time from submit to results display should be under 8 seconds (5s AI + 3s matching)
  - Logging: Log user inputs server-side for debugging (sanitized, no PII), log API response times, log matching results count
  - Metrics to track: Success rate, average response time, interpretation accuracy, matching success rate
  - Analytics: Track user interactions (input submitted, slots shown, slot selected, confirmation completed)
- **Cost & Budget**:
  - OpenAI usage: Monitor API usage, no hard budget limit for MVP, review costs monthly
  - Usage monitoring: Log API calls and token usage, set up alerts for unusual spikes
  - Rate limit handling: Return user-friendly error if OpenAI rate limit hit, suggest retry
- **Non-English Text Handling**:
  - Allow non-English text input, let AI attempt interpretation
  - Fallback to error message if completely uninterpretable

#### Prompt Engineering (`lib/prompts/scheduling-prompt.js`):
- **System Prompt**:
  ```
  You are a scheduling assistant that interprets natural language availability preferences and extracts structured scheduling information.

  Extract the following information from user input:
  1. Days of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  2. Time ranges (convert to 24-hour format, assume user's local timezone)
  3. Date constraints (calculate actual dates from relative terms like "next week", "this Tuesday")
  4. Recurring patterns (weekdays, weekends, daily, none)

  Return a JSON object with this structure:
  {
    "daysOfWeek": [1, 2, 3, 4, 5],
    "timeRanges": [
      {"start": "17:00", "end": "23:59", "timezone": "America/Los_Angeles"}
    ],
    "dateConstraints": {
      "startDate": "2025-10-15",
      "endDate": "2025-11-15",
      "relative": "next_week"
    },
    "specificDates": ["2025-10-15", "2025-10-17"],
    "recurringPattern": "weekdays"
  }

  IMPORTANT:
  - Convert relative dates to actual dates (e.g., "next Tuesday" → "2025-10-15")
  - If time is ambiguous (no AM/PM), infer from context (morning = AM, evening = PM)
  - "After 5pm" means >= 17:00 (inclusive)
  - "Weekends" means days 0 (Sunday) OR 6 (Saturday)
  - "Weekdays" means days 1-5 (Monday-Friday)
  - If information is ambiguous or missing, make reasonable assumptions based on context
  - Always include a timezone (use provided timezone, assume same as clinician timezone)
  - Do not ask for clarification - always return the best interpretation possible
  - Return actual dates, not relative terms

  Examples:
  - "I'm free weekdays after 5pm" → daysOfWeek: [1,2,3,4,5], timeRanges: [{"start": "17:00", "end": "23:59"}]
  - "Next Tuesday and Thursday between 9am and 11am" → specificDates: ["2025-10-15", "2025-10-17"], timeRanges: [{"start": "09:00", "end": "11:00"}]
  - "Weekends in the morning" → daysOfWeek: [0,6], timeRanges: [{"start": "06:00", "end": "12:00"}]
  ```
- **User Prompt Template**:
  ```
  User input: "{userInput}"

  Current date: {currentDate} (YYYY-MM-DD format)
  Current time: {currentTime} (HH:MM format in user's timezone)
  User timezone: {userTimezone}

  Extract the scheduling preferences from the above user input. Convert all relative dates to actual dates based on the current date provided.
  ```

#### Interpretation Validator (`lib/utils/interpretation-validator.js`):
- `validateInterpretedPreferences(preferences)`: Validate structure
- Validate `daysOfWeek`: Array of numbers 0-6
- Validate `timeRanges`: Array of objects with `start`, `end`, `timezone`
  - `start` and `end` must be 24-hour format strings (HH:MM)
  - `timezone` must be valid IANA timezone
- Validate `dateConstraints`: Object with `startDate`, `endDate`, `relative`
  - `startDate` and `endDate` must be ISO date strings (YYYY-MM-DD)
  - `relative` must be string
- Validate `specificDates`: Array of ISO date strings (YYYY-MM-DD)
- Validate `recurringPattern`: String ("weekdays", "weekends", "daily", "none")
- Return array of validation errors (empty if valid)

### Testing Requirements
- Test API route with valid input
- Test request validation (empty input, too short, too long, invalid timezone)
- Test OpenAI API integration
- Test structured output parsing
- Test error handling (network errors, API errors, invalid JSON)
- Test retry logic (exponential backoff)
- Test timeout handling (5 second limit)
- Test interpretation accuracy with various inputs:
  - "I'm only free on weekdays after 5pm"
  - "I can do an appointment between 9am and 11am next Tuesday and Thursday"
  - "Weekends in the morning"
  - "Next week, any day after 2pm"
  - "Today or tomorrow, evening hours"
  - Ambiguous inputs: "sometime next week", "after work"
- Test validation of interpreted preferences structure
- **Accuracy validation**: Manual review of sample interpretations (target 80% accuracy), automated tests for structured output format validation, test edge cases: conflicting preferences, past dates, ambiguous times
- **Test mode**: Use existing test data from CSV, no separate test mode needed
- **Edge case testing**: OpenAI API failures, rate limiting scenarios, network timeout scenarios
- **Browser support**: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile

---

## PR 3: Availability Matching Algorithm & API

### Overview
Implement the availability matching algorithm that matches user preferences against clinician availability data. Create the `/api/match-availability` route with scoring, ranking, and result formatting.

### Files to Create/Modify

#### New Files:
1. **`lib/utils/availability-matcher.js`**
   - Function to match user preferences against availability data
   - Day of week matching with scoring:
     - Exact match: 1.0
     - Adjacent day: 0.5
     - No match: 0.0
   - Handle special cases:
     - "weekends": Match if day_of_week is 0 (Sunday) OR 6 (Saturday)
     - "weekdays": Match if day_of_week is 1-5 (Monday-Friday)
     - Specific day: Match exact day_of_week value
   - Time range matching:
     - 30-minute flexibility: If user requests specific time, show slots from 30 minutes before to 30 minutes after
     - Time range definitions:
       - Morning: 6:00 AM - 12:00 PM
       - Afternoon: 12:00 PM - 6:00 PM
       - Evening: 6:00 PM - 12:00 AM (midnight)
     - "After 5pm" includes 5:00 PM exactly (inclusive)
     - Handle ambiguous times: Infer from context (morning = AM, evening = PM)
     - Check if user's time ranges overlap with availability time ranges
     - Calculate overlap percentage for scoring:
       - Find intersection of user's time range and availability time range
       - Calculate: `overlap_duration / max(user_range_duration, availability_range_duration)`
       - Result is percentage (0.0 to 1.0)
     - Handle multi-day slots: If availability spans midnight, check if it overlaps with user's preferred time on any day
     - Assume standard 1-hour appointment duration for all slots
   - Date constraint filtering:
     - Calculate relative dates before matching:
       - "Today": Current date
       - "Tomorrow": Current date + 1 day
       - "Next week": Current date + 7 days to current date + 14 days
       - "This Tuesday": Next occurrence of Tuesday from current date
       - "Next Tuesday": Tuesday in the following week
     - Filter availabilities within user's date constraints
     - Date constraint scoring:
       - Within range: 1.0
       - Within 3 days of range: 0.5
       - Outside range: 0.0
     - Filter specific dates if provided
     - Ignore past-specific dates in user input (treat as relative to current date)
   - Scoring and ranking:
     - Calculate match score using weighted formula:
       ```
       total_score = (day_match_score × 0.3) + (time_overlap_percentage × 0.4) + (date_constraint_score × 0.2) + (recurring_pattern_match × 0.1)
       ```
     - Day of week match: 0.3 weight (1.0 exact, 0.5 adjacent, 0.0 no match)
     - Time range overlap: 0.4 weight (percentage 0.0-1.0)
     - Date constraint match: 0.2 weight (1.0 within range, 0.5 close, 0.0 outside)
     - Recurring pattern match: 0.1 weight (1.0 if pattern matches, 0.0 otherwise)
     - No penalties applied
     - Sort by match score (highest first)
     - Handle ties: If multiple slots have same score, prefer earlier dates (sort by date ascending as secondary sort)
     - Select top 3-5 best matches (limit to best matches only, no minimum threshold)
     - If input is ambiguous: Return 3 slots that are as close as possible to user preferences, even if not perfect matches
     - Matching algorithm runs synchronously

2. **`lib/utils/result-formatter.js`**
   - Function to format matched slots for display
   - Convert UTC timestamps to user-friendly format using detected timezone
   - Handle daylight saving time automatically via timezone libraries
   - Display timezone as user-friendly name: "Pacific Time", "Eastern Time", etc. (not IANA format)
   - Format times in 12-hour format with AM/PM: "5:00 PM - 6:00 PM"
   - Format dates as "Tuesday, October 15, 2025" (full weekday name, month name, day, year)
   - Include timezone information in display

3. **`app/api/match-availability/route.js`**
   - POST endpoint to match user preferences against availability data
   - Rate limiting: 10 requests per minute per IP address
   - Request validation: Validate interpretedPreferences structure, organizationId is number
   - Error response format: Same as interpret-scheduling route
   - Process requests sequentially (no queuing needed for MVP)
   - Request body:
     ```json
     {
       "interpretedPreferences": {...},
       "organizationId": 85685
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "matchedSlots": [
         {
           "availabilityId": 5428355,
           "clinicianId": 10064240,
           "startTime": "2025-10-15T17:00:00-07:00",
           "endTime": "2025-10-15T18:00:00-07:00",
           "timezone": "America/Los_Angeles",
           "locationId": 20549,
           "matchScore": 0.95
         }
       ]
     }
     ```
   - Use availability cache to get availability data
   - Use availability matcher to find matches
   - Use result formatter to format results
   - Return top 3-5 best matches

#### Files to Modify:
1. **`lib/data/availability-cache.js`** (if needed)
   - Ensure cache is accessible from API routes
   - Add function to initialize cache on server startup (if not already present)

### Implementation Details

#### Availability Matcher (`lib/utils/availability-matcher.js`):
- `matchAvailability(preferences, availabilityData, userTimezone)`: Main matching function
- **Day of Week Matching**:
  - Exact match: 1.0 (user wants Monday, availability is Monday)
  - Adjacent day: 0.5 (user wants Monday, availability is Tuesday or Sunday)
  - No match: 0.0
  - Handle special cases:
    - "weekends": Match if day_of_week is 0 (Sunday) OR 6 (Saturday)
    - "weekdays": Match if day_of_week is 1-5 (Monday-Friday)
    - Specific day: Match exact day_of_week value
- **Time Range Matching**:
  - 30-minute flexibility: If user requests specific time (e.g., 5:00 PM), show slots from 30 minutes before (4:30 PM) to 30 minutes after (5:30 PM)
  - Time range definitions:
    - Morning: 6:00 AM - 12:00 PM
    - Afternoon: 12:00 PM - 6:00 PM
    - Evening: 6:00 PM - 12:00 AM (midnight)
  - "After 5pm" includes 5:00 PM exactly (inclusive)
  - Handle ambiguous times: If user mentions time without AM/PM, infer from context (morning = AM, evening = PM)
  - Check if user's time ranges overlap with availability time ranges
  - Calculate overlap percentage for scoring:
    - Find intersection of user's time range and availability time range
    - Calculate: `overlap_duration / max(user_range_duration, availability_range_duration)`
    - Result is percentage (0.0 to 1.0)
  - Handle multi-day slots: If availability spans midnight (e.g., 11 PM - 1 AM), check if it overlaps with user's preferred time on any day
  - Assume standard 1-hour appointment duration for all slots
- **Date Constraint Filtering**:
  - Calculate relative dates before matching:
    - "Today": Current date
    - "Tomorrow": Current date + 1 day
    - "Next week": Current date + 7 days to current date + 14 days
    - "This Tuesday": Next occurrence of Tuesday from current date
    - "Next Tuesday": Tuesday in the following week
  - Filter availabilities within user's date constraints
  - Date constraint scoring:
    - Within range: 1.0
    - Within 3 days of range: 0.5
    - Outside range: 0.0
  - Filter specific dates if provided
  - Ignore past-specific dates in user input (treat as relative to current date)
- **Scoring and Ranking**:
  - Calculate match score using weighted formula:
    ```
    total_score = (day_match_score × 0.3) + (time_overlap_percentage × 0.4) + (date_constraint_score × 0.2) + (recurring_pattern_match × 0.1)
    ```
  - Day of week match: 0.3 weight (1.0 exact, 0.5 adjacent, 0.0 no match)
  - Time range overlap: 0.4 weight (percentage 0.0-1.0)
  - Date constraint match: 0.2 weight (1.0 within range, 0.5 close, 0.0 outside)
  - Recurring pattern match: 0.1 weight (1.0 if pattern matches, 0.0 otherwise)
  - No penalties applied
  - Sort by match score (highest first)
  - Handle ties: If multiple slots have same score, prefer earlier dates (sort by date ascending as secondary sort)
  - Select top 3-5 best matches (limit to best matches only, no minimum threshold)
  - If input is ambiguous: Return 3 slots that are as close as possible to user preferences, even if not perfect matches
  - Matching algorithm runs synchronously

#### Result Formatter (`lib/utils/result-formatter.js`):
- `formatMatchedSlots(slots, timezone)`: Format slots for display
- Convert UTC timestamps to user-friendly format using detected timezone
- Handle daylight saving time automatically via timezone libraries (date-fns-tz or luxon)
- Display timezone as user-friendly name: "Pacific Time", "Eastern Time", etc. (not IANA format)
- Format times in 12-hour format with AM/PM: "5:00 PM - 6:00 PM"
- Format dates as "Tuesday, October 15, 2025" (full weekday name, month name, day, year)
- Include timezone information in display
- Return array of formatted slot objects

#### API Route (`app/api/match-availability/route.js`):
- **Method**: POST
- **Rate Limiting**: 10 requests per minute per IP address
- **Request Body**:
  ```json
  {
    "interpretedPreferences": {...},
    "organizationId": 85685
  }
  ```
- **Request Validation**:
  - Validate interpretedPreferences structure
  - Validate organizationId is number
  - Return error response if validation fails
- **Processing**:
  - Get availability data from cache
  - Use availability matcher to find matches
  - Use result formatter to format results
  - Return top 3-5 best matches
- **Response Format**:
  - Success: Return matched slots array
  - Error: Return error object with code and message
- **Error Handling**:
  - No matches found: Return empty array (not error)
  - Data loading errors: Return error message
  - CSV file missing/corrupted: Return error message
  - Network errors: Return error message
- **Process requests sequentially** (no queuing needed for MVP)
- **Security**:
  - Validate API responses before storing
  - Sanitize interpreted preferences before processing
  - Rate limit API calls: 10 requests per minute per IP address (implement rate limiting middleware)
- **Performance & Monitoring**:
  - Performance benchmark: Total time from submit to results display should be under 8 seconds (5s AI + 3s matching)
  - Logging: Log matching results count, log API response times
  - Metrics to track: Matching success rate, average response time
  - Analytics: Track user interactions (slots shown, slot selected)

### Testing Requirements
- Test day of week matching (exact, adjacent, no match)
- Test special cases (weekends, weekdays)
- Test time range matching with 30-minute flexibility
- Test time range overlap calculation
- Test date constraint filtering
- Test relative date calculation
- Test scoring algorithm with various inputs
- Test ranking and sorting (by score, then by date)
- Test top 3-5 selection
- Test result formatting (dates, times, timezone)
- Test API route with valid preferences
- Test API route with invalid preferences
- Test rate limiting
- Test error handling (no matches, data errors)
- Test with various user preference combinations
- **Edge case testing**: No availabilities matching criteria, all availabilities in past, invalid timezone detection, CSV parsing errors
- **Browser support**: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile

---

## PR 4: UI Components - Natural Language Input & Results Display

### Overview
Create the UI components for natural language input and results display. Update SchedulingAssistant.jsx to remove calendar and integrate new components.

### Files to Create/Modify

#### New Files:
1. **`components/onboarding/NaturalLanguageScheduling.jsx`**
   - Client component: `'use client'`
   - Props:
     - `onSubmit: (input: string) => void`
     - `isLoading: boolean`
     - `error: string | null`
   - State:
     - Local state for textarea input
     - Character count (245/500 characters)
   - Features:
     - Multi-line textarea input field
     - Placeholder text: "Tell us when you're available. For example: 'I'm only free on weekdays after 5pm' or 'I can do an appointment between 9am and 11am next Tuesday and Thursday'"
     - Character limit: 500 characters
     - Show character count feedback (e.g., "245/500 characters")
     - Submit button: "Find Available Times"
     - Disable submit button if input is empty or less than 10 characters
     - Input validation: Minimum 10 characters, maximum 500 characters, allow all characters (let AI handle interpretation)
     - Loading state: Show spinner and "Finding available appointments..." message
     - Error display: Inline error messages below input/buttons, use standard error styling from design system
     - Use existing design system components
     - Standard height (4-5 lines), border and focus states match design system
     - Full-width textarea on mobile, responsive design

2. **`components/onboarding/AvailabilityResults.jsx`**
   - Client component: `'use client'`
   - Props:
     - `slots: Slot[]` (array of matched slots)
     - `onSelectSlot: (slot: Slot) => void`
     - `onTryAgain: () => void`
   - State:
     - Selected slot ID (if any)
   - Features:
     - Display 3-5 best matching appointment time slots
     - Show available slots even if fewer than 3-5 are found
     - Each slot shows:
       - Date (e.g., "Tuesday, October 15, 2025")
       - Time (e.g., "5:00 PM - 6:00 PM")
       - Timezone (e.g., "Pacific Time")
     - "Select This Time" button for each slot
     - "Try Different Times" button to return to input and edit
     - Selection handling: Prevent multiple selections - clicking "Select This Time" updates selection, previous selection is cleared
     - Use SlotCard component for individual slot display
     - Stacked slot cards on mobile, touch-friendly buttons
     - Responsive design using breakpoints from design system

3. **`components/onboarding/SlotCard.jsx`**
   - Client component: `'use client'`
   - Props:
     - `slot: Slot` (slot object with date, time, timezone)
     - `isSelected: boolean`
     - `onSelect: () => void`
   - State:
     - None (controlled by parent)
   - Features:
     - Display slot information:
       - Date: "Tuesday, October 15, 2025"
       - Time: "5:00 PM - 6:00 PM"
       - Timezone: "Pacific Time"
     - "Select This Time" button
     - Selection feedback: Highlight selected slot with primary color border, show checkmark icon
     - Use card component from design system
     - Standard spacing, subtle hover effect
     - Large touch targets (minimum 44x44px) for mobile

4. **`components/onboarding/SchedulingLoading.jsx`** (optional, or integrate into NaturalLanguageScheduling)
   - Loading state component
   - Show spinner and "Finding available appointments..." message
   - Progress indicator with estimated time
   - Use standard spinner component from design system

#### Files to Modify:
1. **`components/onboarding/SchedulingAssistant.jsx`**
   - **Remove calendar grid UI completely**:
     - Remove mock calendar grid showing next 7 days with 4 time slots per day (9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM)
     - Remove non-functional display-only calendar with disabled buttons
     - Remove all calendar-related UI code
   - Integrate NaturalLanguageScheduling component
   - Integrate AvailabilityResults component
   - Add loading state during AI processing
   - Add error handling
   - Update progress indicator to reflect new flow
   - Handle flow state:
     - Phase 1: Natural Language Input
     - Phase 2: AI Processing (loading)
     - Phase 3: Availability Matching (loading)
     - Phase 4: Results Display
     - Phase 5: Confirmation (handled in PR 5)
   - Call `/api/interpret-scheduling` on submit
   - Call `/api/match-availability` after interpretation
   - Handle errors from both API calls
   - Display error messages inline
   - Allow users to edit their input and try again via "Try Different Times" button
   - Restore user input from localStorage if user navigates away and returns
   - **Integration & Flow**:
     - Next step: Continue to final onboarding step (completion/confirmation screen)
     - Step requirement: Required step - users must complete scheduling before proceeding
     - Progress indicator: Show progress as part of existing onboarding progress indicator

### Implementation Details

#### NaturalLanguageScheduling Component:
- **Textarea Input**:
  - Multi-line textarea
  - Placeholder: "Tell us when you're available. For example: 'I'm only free on weekdays after 5pm' or 'I can do an appointment between 9am and 11am next Tuesday and Thursday'"
  - Character limit: 500 characters
  - Show character count: "245/500 characters"
  - Minimum length: 10 characters
  - Maximum length: 500 characters
  - Allow all characters (let AI handle interpretation)
  - Disable submit button if input is empty or less than 10 characters
- **Submit Button**:
  - Text: "Find Available Times"
  - Disabled if input invalid
  - Call `onSubmit(input)` on click
- **Loading State**:
  - Show spinner and "Finding available appointments..." message
  - Disable input and submit button during loading
- **Error Display**:
  - Inline error messages below input/buttons
  - Use standard error styling from design system
  - Show error from `error` prop
- **Styling**:
  - Use existing design system components
  - Standard height (4-5 lines), border and focus states match design system
  - Full-width textarea on mobile
  - Responsive design
- **Non-English Text Handling**:
  - Allow non-English text input, let AI attempt interpretation
  - Fallback to error message if completely uninterpretable
- **Accessibility**:
  - Ensure text input is keyboard navigable
  - Add proper ARIA labels
  - Support screen readers
  - Full keyboard support (Tab to navigate, Enter to submit)
  - Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Mobile & Responsive**:
  - Mobile adaptation: Full-width textarea on mobile, stacked slot cards, touch-friendly buttons
  - Responsive design: Use responsive breakpoints from design system, ensure usability on all screen sizes
  - Touch interactions: Large touch targets (minimum 44x44px), swipe-friendly card layout

#### AvailabilityResults Component:
- **Slots Display**:
  - Display 3-5 best matching appointment time slots
  - Show available slots even if fewer than 3-5 are found
  - Use SlotCard component for each slot
  - Stacked layout on mobile
- **Selection Handling**:
  - Track selected slot ID in state
  - Prevent multiple selections - clicking "Select This Time" updates selection, previous selection is cleared
  - Call `onSelectSlot(slot)` when slot is selected
- **Actions**:
  - "Select This Time" button for each slot (in SlotCard)
  - "Try Different Times" button to return to input and edit
  - Call `onTryAgain()` when "Try Different Times" is clicked
- **Error States**:
  - No matches found: Display message "We couldn't find any available times matching your preferences. Please try different times or contact us for assistance."
  - No availabilities in 60-day window: Show message "No appointments available in the next 60 days. Please contact us for assistance."
- **Styling**:
  - Use card component from design system
  - Standard spacing
  - Responsive design using breakpoints from design system
  - Touch-friendly buttons on mobile
- **Accessibility**:
  - Screen reader support: Announce results count, selection confirmation
  - Keyboard navigation: Full keyboard support (Tab to navigate, Space to select slots)
  - Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  - Add proper ARIA labels
- **Mobile & Responsive**:
  - Mobile adaptation: Stacked slot cards on mobile, touch-friendly buttons
  - Responsive design: Use responsive breakpoints from design system, ensure usability on all screen sizes
  - Touch interactions: Large touch targets (minimum 44x44px), swipe-friendly card layout

#### SlotCard Component:
- **Slot Information Display**:
  - Date: "Tuesday, October 15, 2025" (full weekday name, month name, day, year)
  - Time: "5:00 PM - 6:00 PM" (12-hour format with AM/PM)
  - Timezone: "Pacific Time" (user-friendly name, not IANA format)
- **Selection State**:
  - Highlight selected slot with primary color border
  - Show checkmark icon when selected
  - Controlled by `isSelected` prop
- **Action**:
  - "Select This Time" button
  - Call `onSelect()` when clicked
- **Styling**:
  - Use card component from design system
  - Standard spacing
  - Subtle hover effect
  - Large touch targets (minimum 44x44px) for mobile
- **Accessibility**:
  - Screen reader support: Announce slot information, selection state
  - Keyboard navigation: Full keyboard support (Space to select)
  - Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  - Add proper ARIA labels

#### SchedulingAssistant Component Updates:
- **Remove Calendar Grid**:
  - Remove all calendar-related UI code
  - Remove mock time slots
  - Remove disabled buttons
- **Add New Flow**:
  - Phase 1: Natural Language Input (NaturalLanguageScheduling component)
  - Phase 2: AI Processing (loading state)
  - Phase 3: Availability Matching (loading state)
  - Phase 4: Results Display (AvailabilityResults component)
  - Phase 5: Confirmation (handled in PR 5)
- **API Integration**:
  - On submit: Call `/api/interpret-scheduling` with user input and timezone
  - After interpretation: Call `/api/match-availability` with interpreted preferences
  - Handle loading states for both API calls
  - Handle errors from both API calls
  - Display error messages inline
- **State Management**:
  - Track current phase (input, loading, results)
  - Track user input
  - Track matched slots
  - Track selected slot
  - Restore user input from localStorage if user navigates away and returns
- **Error Handling**:
  - Network errors: Show message "Connection error. Please check your internet and try again."
  - OpenAI API down/rate-limited: Show message "We're having trouble understanding your availability. Please try rephrasing or contact us for help." with retry option
  - No matches: Show message in AvailabilityResults component
  - Allow users to edit their input and try again via "Try Different Times" button
- **Progress Indicator**:
  - Update to reflect new flow
  - Show progress as part of existing onboarding progress indicator
- **Accessibility**:
  - Screen reader support: Announce loading states, results count, selection confirmation
  - Keyboard navigation: Full keyboard support (Tab to navigate, Enter to submit, Space to select slots)
  - Maintain focus management during flow transitions
  - Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  - Add proper ARIA labels to all interactive elements
- **Mobile & Responsive**:
  - Mobile adaptation: Full-width textarea on mobile, stacked slot cards, touch-friendly buttons
  - Responsive design: Use responsive breakpoints from design system, ensure usability on all screen sizes
  - Touch interactions: Large touch targets (minimum 44x44px), swipe-friendly card layout
- **Integration & Flow**:
  - Next step: Continue to final onboarding step (completion/confirmation screen)
  - Step requirement: Required step - users must complete scheduling before proceeding
  - Progress indicator: Show progress as part of existing onboarding progress indicator

### Testing Requirements
- Test textarea input with various lengths
- Test character count display
- Test submit button enable/disable logic
- Test loading states
- Test error display
- Test API integration (interpret and match)
- Test results display with 0, 1, 3, 5 slots
- Test slot selection
- Test "Try Different Times" button
- Test responsive design (mobile, tablet, desktop)
- Test keyboard navigation
- Test screen reader support
- Test localStorage restoration
- Test error handling scenarios
- **Accessibility testing**: Test screen reader announcements, keyboard navigation, ARIA labels, color contrast compliance
- **Mobile testing**: Test touch interactions, responsive layouts, mobile-specific UI adaptations
- **Browser support**: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile
- **Edge case testing**: No matches found, network errors, API failures, invalid inputs

---

## PR 5: Context Integration & Confirmation Flow

### Overview
Integrate scheduling state into OnboardingContext, implement localStorage persistence, create confirmation component, and complete the scheduling flow integration.

### Files to Create/Modify

#### New Files:
1. **`components/onboarding/SchedulingConfirmation.jsx`**
   - Client component: `'use client'`
   - Props:
     - `selectedSlot: Slot` (selected slot object)
     - `onConfirm: () => void`
     - `onBack: () => void`
   - State:
     - None
   - Features:
     - Show selected appointment details:
       - Date: "Tuesday, October 15, 2025"
       - Time: "5:00 PM - 6:00 PM"
       - Timezone: "Pacific Time"
     - "Confirm Appointment" button
     - "Back" button to return to results
     - Success message: "Your preference has been saved. A care coordinator will reach out to you within 1-2 business days."
     - Note: No real appointment booking system - clicking confirm does not create actual appointment records
     - Note: Selected slot is stored in context/localStorage only for display purposes
     - Use standard success message component from design system
     - Match existing onboarding flow styling
     - Continue to next onboarding step after confirmation

#### Files to Modify:
1. **`lib/context/OnboardingContext.jsx`**
   - Note: File already exists in the project
   - Add scheduling state:
     ```javascript
     {
       schedulingInput: string,
       interpretedPreferences: object,
       matchedSlots: array,
       selectedSlot: object
     }
     ```
   - Add setters:
     - `setSchedulingInput: (input: string) => void`
     - `setInterpretedPreferences: (preferences: object) => void`
     - `setMatchedSlots: (slots: array) => void`
     - `setSelectedSlot: (slot: object) => void`
   - Persist scheduling state to localStorage
   - Restore scheduling state from localStorage on mount
   - Clear scheduling data after onboarding completion (keep selected slot for display only)
   - Note: Selected slot is stored in context/localStorage only - no database records created
   - Note: This is part of the existing onboarding flow (Step 5/6)

2. **`lib/utils/localStorage.js`**
   - Note: File already exists in the project with utility functions
   - Add functions to persist/restore scheduling state:
     - `saveSchedulingState(state)`
     - `getSchedulingState()`
     - `clearSchedulingState()` (called after onboarding completion)
   - Handle localStorage errors gracefully

3. **`components/onboarding/SchedulingAssistant.jsx`**
   - Integrate SchedulingConfirmation component
   - Add Phase 5: Confirmation to flow
   - Use OnboardingContext for state management
   - Update state when user selects slot
   - Update state when user confirms appointment
   - Continue to next onboarding step after confirmation
   - Restore user input and selected slot from localStorage if user navigates away and returns

4. **`components/onboarding/AvailabilityResults.jsx`**
   - Update to use OnboardingContext for selected slot state
   - Update context when slot is selected
   - Read selected slot from context

5. **`components/onboarding/NaturalLanguageScheduling.jsx`**
   - Update to use OnboardingContext for input state
   - Restore input from context/localStorage on mount
   - Update context when input changes (optional, or only on submit)

### Implementation Details

#### OnboardingContext Updates:
- **Add Scheduling State**:
  ```javascript
  {
    schedulingInput: string, // Raw natural language input
    interpretedPreferences: object, // AI-interpreted preferences
    matchedSlots: array, // Matched appointment slots
    selectedSlot: object // Selected slot object
  }
  ```
- **Add Setters**:
  - `setSchedulingInput(input)`: Set user's natural language input
  - `setInterpretedPreferences(preferences)`: Set AI-interpreted preferences
  - `setMatchedSlots(slots)`: Set matched appointment slots
  - `setSelectedSlot(slot)`: Set selected slot
- **localStorage Persistence**:
  - Save scheduling state to localStorage on state changes
  - Restore scheduling state from localStorage on mount
  - Clear scheduling data after onboarding completion (keep selected slot for display only)
  - Handle localStorage errors gracefully (e.g., quota exceeded, disabled)
- **Data & Privacy**:
  - localStorage retention: Keep scheduling data until onboarding completion, then clear
  - Data clearing: Clear scheduling input and preferences after onboarding completion, keep selected slot for display only
  - Privacy: User inputs logged server-side for debugging only, no PII stored, comply with existing privacy policy
  - Server-side logging: Log sanitized inputs (remove potential PII), log errors, log performance metrics
- **State Management**:
  - Initialize scheduling state from localStorage on mount
  - Update localStorage when state changes
  - Clear scheduling input and preferences after onboarding completion
  - Keep selected slot for display only (no database records)

#### SchedulingConfirmation Component:
- **Display Selected Slot**:
  - Date: "Tuesday, October 15, 2025" (full weekday name, month name, day, year)
  - Time: "5:00 PM - 6:00 PM" (12-hour format with AM/PM)
  - Timezone: "Pacific Time" (user-friendly name)
- **Actions**:
  - "Confirm Appointment" button:
    - Call `onConfirm()` when clicked
    - Store selected slot in context/localStorage
    - Show success message
    - Continue to next onboarding step
  - "Back" button:
    - Call `onBack()` when clicked
    - Return to results display
- **Success Message**:
  - "Your preference has been saved. A care coordinator will reach out to you within 1-2 business days."
  - Display after confirmation
  - Use standard success message component from design system
- **Note**:
  - No real appointment booking system - clicking confirm does not create actual appointment records
  - Selected slot is stored in context/localStorage only for display purposes
- **Styling**:
  - Match existing onboarding flow styling
  - Use standard success message component from design system
  - Responsive design
- **Accessibility**:
  - Screen reader support: Announce confirmation details, success message
  - Keyboard navigation: Full keyboard support (Tab to navigate, Enter to confirm)
  - Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  - Add proper ARIA labels
  - Maintain focus management during flow transitions

#### SchedulingAssistant Component Updates:
- **Add Confirmation Phase**:
  - Phase 5: Confirmation (SchedulingConfirmation component)
  - Show confirmation screen after slot selection
  - Handle confirmation action
  - Continue to next onboarding step after confirmation
- **Context Integration**:
  - Use OnboardingContext for all scheduling state
  - Read schedulingInput, matchedSlots, selectedSlot from context
  - Update context when state changes
  - Restore state from localStorage on mount
- **Flow Management**:
  - Phase 1: Natural Language Input
  - Phase 2: AI Processing (loading)
  - Phase 3: Availability Matching (loading)
  - Phase 4: Results Display
  - Phase 5: Confirmation
  - Handle transitions between phases
  - Restore user input and selected slot from localStorage if user navigates away and returns
- **Integration & Flow**:
  - Next step: Continue to final onboarding step (completion/confirmation screen)
  - Step requirement: Required step - users must complete scheduling before proceeding
  - Progress indicator: Show progress as part of existing onboarding progress indicator

#### localStorage Utilities:
- **Functions**:
  - `saveSchedulingState(state)`: Save scheduling state to localStorage
  - `getSchedulingState()`: Get scheduling state from localStorage
  - `clearSchedulingState()`: Clear scheduling state (called after onboarding completion)
- **Error Handling**:
  - Handle localStorage errors gracefully (e.g., quota exceeded, disabled)
  - Fallback to in-memory state if localStorage unavailable
  - Log errors to console

### Testing Requirements
- Test context state management (set/get scheduling state)
- Test localStorage persistence (save/restore)
- Test localStorage error handling
- Test confirmation component display
- Test "Confirm Appointment" button
- Test "Back" button
- Test success message display
- Test continuation to next onboarding step
- Test state restoration on page refresh
- Test state restoration when navigating away and returning
- Test clearing scheduling data after onboarding completion
- Test that no database records are created
- Test that selected slot is stored in context/localStorage only
- Test integration with existing onboarding flow
- Test responsive design
- Test keyboard navigation
- Test screen reader support
- **Accessibility testing**: Test screen reader announcements, keyboard navigation, ARIA labels, color contrast compliance, focus management
- **Data & Privacy testing**: Test localStorage retention, data clearing, privacy compliance, server-side logging
- **Integration testing**: Test continuation to next onboarding step, step requirement enforcement, progress indicator updates
- **Browser support**: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile

---

## Summary

These 5 pull requests, when implemented sequentially, will result in the fully implemented scheduling feature as specified in the PRD:

1. **PR 1**: Data infrastructure and CSV loading - Foundation for availability data processing
2. **PR 2**: OpenAI integration and interpretation API - Natural language interpretation
3. **PR 3**: Availability matching algorithm and API - Matching user preferences to availability
4. **PR 4**: UI components for input and results - User interface for scheduling
5. **PR 5**: Context integration and confirmation flow - Complete flow integration and state management

Each PR builds upon the previous one, ensuring a logical progression and allowing for incremental testing and validation.

