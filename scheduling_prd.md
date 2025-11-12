# Scheduling Feature PRD

## Overview
Replace the existing calendar-based time slot selection UI with a natural language scheduling interface. Users will describe their availability in plain text, and an AI-powered system will interpret their preferences and match them against clinician availability data to suggest 3-5 appointment time slots.

## Goals
1. Simplify the scheduling experience by removing the calendar grid interface
2. Allow users to express availability preferences in natural language
3. Use AI to accurately interpret user availability preferences
4. Match user preferences against real clinician availability data
5. Present 3-5 relevant appointment time slot options
6. Improve user experience with conversational scheduling

## Current State
- **Component**: `components/onboarding/SchedulingAssistant.jsx`
- **UI**: Mock calendar grid showing next 7 days with 4 time slots per day (9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM)
- **Functionality**: Non-functional display-only calendar with disabled buttons
- **Data Source**: No real availability data integration
- **User Flow**: Users see calendar but cannot actually schedule appointments

## Proposed Changes

### 1. New UI Flow

**Phase 1: Natural Language Input**
- Replace calendar grid with a multi-line textarea input field
- Placeholder text: "Tell us when you're available. For example: 'I'm only free on weekdays after 5pm' or 'I can do an appointment between 9am and 11am next Tuesday and Thursday'"
- Character limit: 500 characters
- Show character count feedback (e.g., "245/500 characters")
- Submit button: "Find Available Times"
- Loading state: Show spinner and "Finding available appointments..." message

**Phase 2: AI Processing**
- Display loading state with progress indicator and estimated time
- Call OpenAI API to interpret user's natural language input
- **Response time requirement: Maximum 5 seconds for AI interpretation**
- **AI Model: Use GPT-3.5-turbo (faster, cost-effective, sufficient for structured extraction)**
- **Accuracy threshold: 80% - AI interpretation must achieve at least 80% accuracy**
- Extract structured availability preferences:
  - Days of week (Monday, Tuesday, etc.)
  - Time ranges (morning, afternoon, evening, specific times)
  - Date constraints (next week, this week, specific dates)
  - Recurring patterns (weekdays, weekends, daily)

**Phase 3: Availability Matching**
- Query clinician availability data from `clinician_availabilities.csv`
- Match user preferences against clinician availability slots
- Filter by:
  - Timezone compatibility
  - Day of week matches
  - Time range overlaps
  - Active availability (not deleted, within date ranges)
  - Organization context

**Phase 4: Results Display**
- Display 3-5 best matching appointment time slots (limit to top matches)
- **Show available slots even if fewer than 3-5 are found**
- Each slot shows:
  - Date (e.g., "Tuesday, October 15, 2025")
  - Time (e.g., "5:00 PM - 6:00 PM")
  - Timezone (e.g., "Pacific Time")
- **Note: Users cannot specify preferred clinicians - all clinicians are treated equally**
- **Note: Clinician information is kept anonymous (no clinician names/IDs shown to users)**
- **Note: Match scores are kept internal and not displayed to users**
- Allow user to select a preferred slot
- "Select This Time" button for each slot
- "Try Different Times" button to return to input and edit

**Phase 5: Confirmation**
- Show selected appointment details
- "Confirm Appointment" button
- **Note: No real appointment booking system - clicking slot/confirm does not create actual appointment records**
- **Note: Selected slot is stored in context/localStorage only for display purposes**
- Success message: "Your preference has been saved. A care coordinator will reach out to you within 1-2 business days."
- Continue to next onboarding step after confirmation

### 2. Data Structure

**Clinician Availability Data (from CSV):**
- `user_id`: Clinician identifier
- `range_start`: Start time (UTC timestamp)
- `range_end`: End time (UTC timestamp)
- `timezone`: Timezone string (e.g., "America/Los_Angeles")
- `day_of_week`: 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
- `is_repeating`: Boolean indicating recurring availability
- `end_on`: End date for repeating availabilities (optional)
- `appointment_location_id`: Location identifier
- `parent_organization_id`: Organization identifier
- `deleted_at`: Soft delete timestamp (null if active)

**User Input Processing:**
```javascript
{
  userInput: string, // Raw natural language input
  interpretedPreferences: {
    daysOfWeek: number[], // [1, 2, 3, 4, 5] for weekdays
    timeRanges: [
      {
        start: string, // "17:00" (24-hour format)
        end: string,   // "20:00"
        timezone: string // User's timezone
      }
    ],
    dateConstraints: {
      startDate: string, // ISO date string
      endDate: string,   // ISO date string
      relative: string  // "this_week", "next_week", "next_month"
    },
    specificDates: string[], // ["2025-10-15", "2025-10-17"]
    recurringPattern: string // "weekdays", "weekends", "daily", "none"
  },
  matchedSlots: [
    {
      availabilityId: number,
      clinicianId: number,
      startTime: string, // ISO timestamp
      endTime: string,   // ISO timestamp
      timezone: string,
      locationId: number,
      matchScore: number // 0-1, relevance score
    }
  ]
}
```

### 3. AI Integration

**OpenAI API Setup:**
- Create API route: `app/api/interpret-scheduling/route.js`
- **Use OpenAI GPT-3.5-turbo for interpretation (faster response, cost-effective, sufficient for structured extraction)**
- Implement structured output (JSON mode) for consistent response format
- **Accuracy requirement: AI interpretation must achieve at least 80% accuracy**

**Prompt Engineering:**

**System Prompt:**
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
    "endDate": "2025-10-31",
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

**User Prompt:**
```
User input: "{userInput}"

Current date: {currentDate} (YYYY-MM-DD format)
Current time: {currentTime} (HH:MM format in user's timezone)
User timezone: {userTimezone}

Extract the scheduling preferences from the above user input. Convert all relative dates to actual dates based on the current date provided.
```

**Response Format:**
- Structured JSON matching the system prompt format
- Validation required before processing
- Error handling for malformed responses

### 4. Availability Matching Algorithm

**Note: Treat CSV file as a database - parse and query it using database-like operations**

**Step 1: Data Loading & Parsing**
- Load clinician availability data from CSV file located at `Daybreak Health Test Cases/clinician_availabilities.csv`
- **Use `papaparse` library for CSV parsing**
- **Load CSV file once on server startup, parse into structured data, cache in memory**
- **Pre-process and index data by `day_of_week` and time ranges for efficient querying**
- **Skip malformed CSV rows, log errors to console**
- **Handle duplicate availability IDs by keeping first occurrence**
- **Skip rows where `range_start > range_end` (data error)**
- **Validate timezone strings - if invalid, fallback to "America/Los_Angeles"**
- Filter active availabilities (database-like WHERE clause):
  - `deleted_at IS NULL`
  - `range_start >= current_date AND range_start <= current_date + 60 days`
  - If `is_repeating = true`, check `end_on IS NULL OR end_on >= current_date`
- **Filter by `parent_organization_id = 85685` (fixed value)**
- **Do not filter by `appointment_location_id` - show all locations**
- **Expand repeating availabilities to specific dates within the 60-day window:**
  - For each repeating availability (`is_repeating = true`):
    - Get `day_of_week` value (0-6)
    - Find all dates in next 60 days that match this day of week
    - If `end_on` is set and within 60-day window, stop expanding at `end_on`
    - Create individual availability records for each matching date
    - Use same `range_start` and `range_end` times for each expanded date

**Step 2: Timezone Normalization**
- **Assume browser timezone is the same as clinician timezone**
- Detect user's timezone from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
- Use this timezone for all matching calculations
- No timezone conversion needed since browser and clinician are in same timezone

**Step 3: Day of Week Matching**
- Match user's preferred days of week against availability `day_of_week` values
- **Day match scoring:**
  - Exact match: 1.0 (user wants Monday, availability is Monday)
  - Adjacent day: 0.5 (user wants Monday, availability is Tuesday or Sunday)
  - No match: 0.0
- **Handle special cases:**
  - User wants "weekends": Match if `day_of_week` is 0 (Sunday) OR 6 (Saturday)
  - User wants "weekdays": Match if `day_of_week` is 1-5 (Monday-Friday)
  - User wants specific day: Match exact `day_of_week` value

**Step 4: Time Range Matching**
- **30-minute flexibility: If user requests specific time (e.g., 5:00 PM), show slots from 30 minutes before (4:30 PM) to 30 minutes after (5:30 PM)**
- **Time range definitions:**
  - Morning: 6:00 AM - 12:00 PM
  - Afternoon: 12:00 PM - 6:00 PM
  - Evening: 6:00 PM - 12:00 AM (midnight)
- **"After 5pm" includes 5:00 PM exactly (inclusive)**
- **Handle ambiguous times: If user mentions time without AM/PM, infer from context (morning = AM, evening = PM)**
- Check if user's time ranges overlap with availability `range_start` and `range_end`
- **Calculate overlap percentage for scoring:**
  - Find intersection of user's time range and availability time range
  - Calculate: `overlap_duration / max(user_range_duration, availability_range_duration)`
  - Result is percentage (0.0 to 1.0)
- **Handle multi-day slots: If availability spans midnight (e.g., 11 PM - 1 AM), check if it overlaps with user's preferred time on any day**
- **Assume standard 1-hour appointment duration for all slots**

**Step 5: Date Constraint Filtering**
- **Calculate relative dates before matching:**
  - "Today": Current date
  - "Tomorrow": Current date + 1 day
  - "Next week": Current date + 7 days to current date + 14 days
  - "This Tuesday": Next occurrence of Tuesday from current date
  - "Next Tuesday": Tuesday in the following week
- Filter availabilities within user's date constraints
- **Date constraint scoring:**
  - Within range: 1.0
  - Within 3 days of range: 0.5
  - Outside range: 0.0
- Filter specific dates if provided
- **Ignore past-specific dates in user input (treat as relative to current date)**

**Step 6: Scoring and Ranking**
- **Calculate match score for each availability using weighted formula:**
  ```
  total_score = (day_match_score × 0.3) + (time_overlap_percentage × 0.4) + (date_constraint_score × 0.2) + (recurring_pattern_match × 0.1)
  ```
  - Day of week match: 0.3 weight (1.0 exact, 0.5 adjacent, 0.0 no match)
  - Time range overlap: 0.4 weight (percentage 0.0-1.0)
  - Date constraint match: 0.2 weight (1.0 within range, 0.5 close, 0.0 outside)
  - Recurring pattern match: 0.1 weight (1.0 if pattern matches, 0.0 otherwise)
- **No penalties applied (e.g., no penalty for future dates or imperfect matches)**
- Sort by match score (highest first)
- **Handle ties: If multiple slots have same score, prefer earlier dates (sort by date ascending as secondary sort)**
- **Select top 3-5 best matches (limit to best matches only, no minimum threshold)**
- **If input is ambiguous: Return 3 slots that are as close as possible to user preferences, even if not perfect matches**
- **Matching algorithm runs synchronously (user is already waiting for results)**

**Step 7: Format Results**
- Convert UTC timestamps to user-friendly format using detected timezone
- **Handle daylight saving time automatically via timezone libraries (date-fns-tz or luxon)**
- **Display timezone as user-friendly name: "Pacific Time", "Eastern Time", etc. (not IANA format)**
- **Format times in 12-hour format with AM/PM: "5:00 PM - 6:00 PM"**
- Format dates as "Tuesday, October 15, 2025" (full weekday name, month name, day, year)
- Include timezone information in display

### 5. Component Changes

**SchedulingAssistant.jsx Updates:**
- Remove calendar grid UI completely
- Add natural language text input field
- Add loading state during AI processing
- Add results display component for matched slots
- Add slot selection and confirmation flow
- Update progress indicator to reflect new flow

**New Components:**
- `NaturalLanguageScheduling.jsx`: Main scheduling interface with text input
  - **Props:** `onSubmit: (input: string) => void`, `isLoading: boolean`, `error: string | null`
  - **State:** Local state for textarea input, character count
  - **Client component:** `'use client'`
- `AvailabilityResults.jsx`: Display matched appointment slots
  - **Props:** `slots: Slot[]`, `onSelectSlot: (slot: Slot) => void`, `onTryAgain: () => void`
  - **State:** Selected slot ID (if any)
  - **Client component:** `'use client'`
- `SlotCard.jsx`: Individual time slot display component
  - **Props:** `slot: Slot`, `isSelected: boolean`, `onSelect: () => void`
  - **State:** None (controlled by parent)
  - **Client component:** `'use client'`
- `SchedulingConfirmation.jsx`: Confirmation screen after selection
  - **Props:** `selectedSlot: Slot`, `onConfirm: () => void`, `onBack: () => void`
  - **State:** None
  - **Client component:** `'use client'`
- **State sharing: All components use OnboardingContext for shared state, props for callbacks**
- **Selection handling: Prevent multiple selections - clicking "Select This Time" updates selection, previous selection is cleared**

**Context Updates:**
- Add scheduling state to `OnboardingContext`:
  ```javascript
  {
    schedulingInput: string,
    interpretedPreferences: object,
    matchedSlots: array,
    selectedSlot: object
  }
  ```
- Add setters: `setSchedulingInput`, `setMatchedSlots`, `setSelectedSlot`
- Persist to localStorage
- **Note: Selected slot is stored in context/localStorage only - no database records created**
- **Note: This is part of the existing onboarding flow (Step 5/6)**

### 6. API Routes

**Route: `/api/interpret-scheduling`**
- Method: POST
- **Response time requirement: Maximum 5 seconds**
- **Request validation: Validate userInput is string, 10-500 characters, userTimezone is valid IANA timezone**
- **Error response format:**
  ```json
  {
    "success": false,
    "error": "Error message",
    "code": "ERROR_CODE"
  }
  ```
- Request body:
  ```json
  {
    "userInput": "i am only free on weekdays after 5pm",
    "userTimezone": "America/Los_Angeles" // detect from browser, assume same as clinician
  }
  ```
- Response:
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

**Route: `/api/match-availability`**
- Method: POST
- **Rate limiting: 10 requests per minute per IP address**
- **Request validation: Validate interpretedPreferences structure, organizationId is number**
- **Error response format: Same as interpret-scheduling route**
- **Process requests sequentially (no queuing needed for MVP)**
- Request body:
  ```json
  {
    "interpretedPreferences": {...},
    "organizationId": 85685 // fixed value from CSV data
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
      },
      // ... 2-4 more slots
    ]
  }
  ```
- **Note: Keep routes separate (better separation of concerns, allows independent scaling)**

### 7. Error Handling

**Input Validation:**
- Check user input is not empty
- **Minimum length: 10 characters**
- **Maximum length: 500 characters**
- **Allow all characters - let AI handle interpretation (no content pre-validation)**
- Disable submit button if input is empty or less than 10 characters

**AI Interpretation Errors:**
- Network errors: Retry with exponential backoff (max 3 retries)
- API errors: Display user-friendly error message
- Invalid JSON: Fallback to manual parsing or request clarification
- **Ambiguous input: Return 3 slots that are as close as possible to user preferences, even if not perfect matches (do not ask user for clarification)**

**Matching Errors:**
- No matches found: Display message "We couldn't find any available times matching your preferences. Please try different times or contact us for assistance."
- **No availabilities in 60-day window: Show message "No appointments available in the next 60 days. Please contact us for assistance."**
- Partial matches: Show available slots even if fewer than 3-5 (always show what's available)
- Data loading errors: Log error and show fallback message "Unable to load availability data. Please contact support."
- **CSV file missing/corrupted: Show error message "Unable to load availability data. Please contact support."**
- **OpenAI API down/rate-limited: Show error message "We're having trouble understanding your availability. Please try rephrasing or contact us for help." with retry option**
- **Network errors: Show message "Connection error. Please check your internet and try again."**
- **Timezone detection fails: Fallback to "America/Los_Angeles" automatically**
- **Past dates in data: Filter out any availabilities with range_start in the past**

**User Experience:**
- Always show loading states during processing
- **Display error messages inline below input/buttons using standard error styling from design system**
- Offer retry options for network and API errors
- Allow users to edit their input and try again via "Try Different Times" button
- **Restore user input and selected slot from localStorage if user navigates away and returns**

### 8. Implementation Steps

**Step 1: Data Infrastructure**
1. Set up CSV data loading utility
2. Create availability data parser
3. Implement timezone conversion utilities
4. Create matching algorithm functions
5. Test data loading and parsing

**Step 2: OpenAI Integration**
1. Install OpenAI SDK: `npm install openai`
2. Create `/api/interpret-scheduling` route
3. Design and test prompt engineering
4. Implement structured output validation
5. Add error handling and retry logic

**Step 3: Matching Algorithm**
1. Implement availability filtering logic
2. Create timezone normalization functions
3. Build day of week matching
4. Implement time range overlap calculation
5. Create scoring and ranking system
6. Test with various user inputs

**Step 4: UI Components**
1. Update `SchedulingAssistant.jsx` to remove calendar
2. Create `NaturalLanguageScheduling.jsx` component
3. Create `AvailabilityResults.jsx` component
4. Create `SlotCard.jsx` component
5. Create `SchedulingConfirmation.jsx` component
6. Add loading states and error handling

**Step 5: Context Integration**
1. Add scheduling state to `OnboardingContext`
2. Implement localStorage persistence
3. Update state management functions
4. Test state persistence across page refreshes

**Step 6: API Route Implementation**
1. Create `/api/match-availability` route
2. Integrate CSV data loading
3. Implement matching algorithm
4. Add response formatting
5. Test with various preference inputs

**Step 7: Testing & Refinement**
1. Test with various natural language inputs
2. Validate AI interpretation accuracy
3. Test matching algorithm with edge cases
4. Test timezone handling
5. Gather user feedback on UX
6. Refine prompts based on interpretation quality
7. Optimize matching algorithm performance

### 9. Technical Considerations

**Dependencies:**
- Add `openai` package to `package.json`
- **Add CSV parsing library: `papaparse` (preferred choice)**
- **Add timezone library: `date-fns-tz` (preferred choice) or `luxon`**
- Ensure Next.js API routes are properly configured

**Environment Variables:**
- `OPENAI_API_KEY`: Required for API calls
- Store securely and document in `.env.example`

**Performance:**
- **Cache availability data in memory (load once on server startup, refresh daily)**
- Optimize CSV parsing (parse once on startup, reuse cached data)
- **Do not cache interpreted preferences - always interpret fresh on each request**
- **AI interpretation must complete within 5 seconds**
- **Matching algorithm runs synchronously**
- Consider pagination if availability dataset is very large

**Data Management:**
- **Load CSV file from `Daybreak Health Test Cases/clinician_availabilities.csv` on server startup**
- **Use `papaparse` library for CSV parsing**
- **Parse CSV into structured JavaScript objects/arrays**
- **Pre-process and index data:**
  - Create index by `day_of_week` for fast day-based queries
  - Create index by time ranges for fast time-based queries
  - Store in memory as array of availability objects
- **Cache parsed availability data in memory**
- **Implement data refresh mechanism: refresh daily (or on server restart) - manual restart required, no auto-reload**
- **Handle large CSV files: Load all data (CSV is manageable size), no streaming needed**
- **Expand repeating availabilities to specific dates within 60-day window during pre-processing**
- **Query data using array filter/map operations (treating in-memory array as database)**

**Timezone Handling:**
- **Assume browser timezone is the same as clinician timezone**
- Detect user's timezone from browser (Intl.DateTimeFormat().resolvedOptions().timeZone)
- Use this timezone for all matching calculations
- Display times in the detected timezone
- No timezone conversion needed since browser and clinician are in same timezone

**Accessibility:**
- Ensure text input is keyboard navigable
- Add proper ARIA labels
- Maintain focus management during flow transitions
- Support screen readers

**Security:**
- Validate API responses before storing
- Sanitize user input
- Never expose API keys in client code
- **Rate limit API calls: 10 requests per minute per IP address**

### 10. CSV Data Structure Details

**Key Fields for Matching:**
- `user_id`: Clinician identifier (use for matching)
- `range_start`: Start time in UTC (ISO format)
- `range_end`: End time in UTC (ISO format)
- `timezone`: Timezone string (e.g., "America/Los_Angeles")
- `day_of_week`: 0-6 integer (0=Sunday, 1=Monday, ..., 6=Saturday)
- `is_repeating`: Boolean (true for recurring, false for one-time)
- `end_on`: End date for repeating availabilities (ISO date or null)
- `deleted_at`: Soft delete timestamp (null if active)
- `appointment_location_id`: Location identifier
- `parent_organization_id`: Organization identifier (filter by this)

**Data Processing:**
- Parse CSV file on server side from `Daybreak Health Test Cases/clinician_availabilities.csv`
- Convert UTC timestamps to browser timezone (assumed same as clinician timezone)
- Filter by `deleted_at IS NULL` for active availabilities
- **Filter by `parent_organization_id = 85685` (fixed value from CSV data)**
- **Do not filter by `appointment_location_id` - include all locations**
- Handle both one-time and repeating availabilities
- **Expand repeating availabilities to specific dates within 60-day window**
- **Look ahead 60 days from current date for availability matching**

### 11. Success Metrics

- User completion rate increases (easier than calendar selection)
- Time to schedule decreases (faster than clicking through calendar)
- User satisfaction with natural language interface
- **AI interpretation accuracy: Target 80% or higher (percentage of correctly interpreted inputs)**
- Matching accuracy (percentage of relevant matches)
- Reduction in scheduling abandonment

### 12. Future Enhancements

- Allow users to edit their input and refine results
- Show AI confidence scores for transparency
- Provide examples of good natural language inputs
- Support multiple languages
- Real-time interpretation as user types (optional)
- Allow users to specify preferences (e.g., "prefer morning times")
- Show clinician information with matched slots
- Integration with actual appointment booking system
- Email/SMS notifications for appointment confirmations
- Calendar sync (Google Calendar, Outlook, etc.)

## Open Questions - Answered

1. **Should we allow users to specify a preferred clinician?** → **No, users cannot specify preferred clinicians. All clinicians are treated equally.**
2. **How should we handle timezone detection (browser vs. manual selection)?** → **Assume browser timezone is the same as clinician timezone. Detect from browser automatically.**
3. **What is the acceptable response time for AI interpretation?** → **Maximum 5 seconds.**
4. **Should we cache interpreted preferences for faster re-matching?** → **No, do not cache interpreted preferences. Always interpret fresh on each request.**
5. **How should we handle cases where user input is too ambiguous?** → **Return 3 slots that are as close as possible to user preferences, even if not perfect matches. Do not ask user for clarification.**
6. **Should we show all available slots or limit to 3-5 best matches?** → **Limit to 3-5 best matches only.**
7. **How should we handle conflicts if multiple users select the same slot?** → **Not applicable - no real appointment booking system. Users can select slots but no actual appointments are created.**
8. **Should we integrate with a real appointment booking system or just collect preferences?** → **No real appointment booking system. Users can click a slot to choose it, but nothing happens - no appointment records are created. Selected slot is stored in context/localStorage only for display purposes.**
9. **What is the acceptable accuracy threshold for AI interpretation?** → **80% - AI interpretation must achieve at least 80% accuracy.**
10. **Should we allow users to see availability for multiple weeks ahead?** → **Look ahead 60 days from current date for availability matching. Users see slots within this 60-day window.**

## Additional Design Decisions

**Data & Availability:**
- **Look ahead window: 60 days from current date**
- **CSV file location: `Daybreak Health Test Cases/clinician_availabilities.csv`**
- **Organization ID: 85685 (fixed value, filter all queries by this)**
- **Location filtering: No - show all locations, do not filter by `appointment_location_id`**
- **Repeating availabilities: Expand to specific dates within 60-day window**

**User Experience:**
- **Text input type: Multi-line textarea (better for longer inputs)**
- **Character count: Show character count feedback (e.g., "245/500 characters")**
- **Loading indicator: Show progress with estimated time**
- **Partial results: Show available slots even if fewer than 3-5 are found**
- **Go back option: Allow "Try Different Times" button to return to input and edit**
- **Placeholder text: Keep current examples**

**Technical Implementation:**
- **OpenAI model: GPT-3.5-turbo (faster, cost-effective, sufficient for structured extraction)**
- **CSV loading: Load once on server startup, cache in memory**
- **Data refresh: Refresh daily (or on server restart)**
- **Rate limiting: 10 requests per minute per IP address**
- **Matching algorithm: Runs synchronously**
- **Timezone fallback: "America/Los_Angeles" if browser detection fails**

**Business Logic:**
- **Time flexibility: Show slots within 30 minutes of requested time**
- **Imperfect matches: Show close matches (e.g., Tuesday if user wants Wednesday)**
- **Match score threshold: Always show top 3-5, no minimum threshold**
- **Appointment duration: Assume standard 1-hour duration for all slots**
- **Match scores: Keep internal, do not display to users**
- **Clinician information: Keep anonymous, do not show clinician names/IDs**

**Integration:**
- **Onboarding flow: Part of existing onboarding flow (Step 5/6)**
- **Data storage: Store selected slot in context/localStorage only, no database records**
- **After confirmation: Show success message, continue to next onboarding step**

## Default Implementation Decisions

**UI/Design:**
- **Textarea styling: Use existing design system components, standard height (4-5 lines), border and focus states match design system**
- **Slot cards: Use card component from design system, standard spacing, subtle hover effect**
- **Loading indicator: Use standard spinner component from design system with "Finding available appointments..." text**
- **Selection feedback: Highlight selected slot with primary color border, show checkmark icon**
- **Confirmation screen: Use standard success message component from design system, match existing onboarding flow styling**

**Validation & Input Handling:**
- **Input validation: Minimum 10 characters, maximum 500 characters, allow all characters (let AI handle interpretation)**
- **Invalid input handling: Allow any text input, AI will interpret best it can, no pre-validation of content**
- **Empty input: Disable submit button if input is empty or less than 10 characters**
- **Non-English text: Allow, let AI attempt interpretation, fallback to error message if completely uninterpretable**

**Error Messages:**
- **Error display: Inline error messages below input/buttons, use standard error styling from design system**
- **No matches message: "We couldn't find any available times matching your preferences. Please try different times or contact us for assistance."**
- **AI failure message: "We're having trouble understanding your availability. Please try rephrasing or contact us for help."**
- **Network error message: "Connection error. Please check your internet and try again."**

**Edge Cases:**
- **No availabilities in window: Show message "No appointments available in the next 60 days. Please contact us for assistance."**
- **Past dates in data: Filter out any availabilities with range_start in the past**
- **Timezone detection failure: Fallback to "America/Los_Angeles" automatically**
- **Conflicting preferences: AI will make best interpretation, show closest matching slots**
- **Past date ranges in input: AI will interpret relative to current date, ignore past-specific dates**

**Performance & Monitoring:**
- **Performance benchmark: Total time from submit to results display should be under 8 seconds (5s AI + 3s matching)**
- **Logging: Log user inputs server-side for debugging (sanitized, no PII), log API response times, log matching results count**
- **Metrics to track: Success rate, average response time, interpretation accuracy, matching success rate**
- **Analytics: Track user interactions (input submitted, slots shown, slot selected, confirmation completed)**

**Data & Privacy:**
- **localStorage retention: Keep scheduling data until onboarding completion, then clear**
- **Data clearing: Clear scheduling input and preferences after onboarding completion, keep selected slot for display only**
- **Privacy: User inputs logged server-side for debugging only, no PII stored, comply with existing privacy policy**
- **Server-side logging: Log sanitized inputs (remove potential PII), log errors, log performance metrics**

**Testing & Quality Assurance:**
- **Test cases: Test with various natural language inputs:**
  - "I'm only free on weekdays after 5pm"
  - "I can do an appointment between 9am and 11am next Tuesday and Thursday"
  - "Weekends in the morning"
  - "Next week, any day after 2pm"
  - "Today or tomorrow, evening hours"
  - Ambiguous inputs: "sometime next week", "after work"
- **Test mode: Use existing test data from CSV, no separate test mode needed**
- **Accuracy validation:**
  - Manual review of sample interpretations (target 80% accuracy)
  - Automated tests for structured output format validation
  - Test edge cases: conflicting preferences, past dates, ambiguous times
- **Browser support: Support modern browsers (Chrome, Firefox, Safari, Edge), desktop and mobile**
- **Edge case testing:**
  - No availabilities matching criteria
  - All availabilities in past
  - Invalid timezone detection
  - CSV parsing errors
  - OpenAI API failures

**Implementation Details:**
- **CSV file location: Commit CSV file to repository in `Daybreak Health Test Cases/` folder**
- **CSV updates: Manual server restart required to reload CSV data (no auto-reload)**
- **Request handling: Process requests sequentially (no queuing needed for MVP)**
- **Input debouncing: No debouncing needed (user must click submit button)**

**Accessibility:**
- **Screen reader support: Announce loading states, results count, selection confirmation**
- **Keyboard navigation: Full keyboard support (Tab to navigate, Enter to submit, Space to select slots)**
- **Color contrast: Meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)**
- **Alternative input: No voice input or alternative methods in MVP**

**Mobile & Responsive:**
- **Mobile adaptation: Full-width textarea on mobile, stacked slot cards, touch-friendly buttons**
- **Responsive design: Use responsive breakpoints from design system, ensure usability on all screen sizes**
- **Touch interactions: Large touch targets (minimum 44x44px), swipe-friendly card layout**

**Integration & Flow:**
- **Next step: Continue to final onboarding step (completion/confirmation screen)**
- **Step requirement: Required step - users must complete scheduling before proceeding**
- **Progress indicator: Show progress as part of existing onboarding progress indicator**
- **State restoration: Restore user input and selected slot from localStorage if user navigates away and returns**

**Cost & Budget:**
- **OpenAI usage: Monitor API usage, no hard budget limit for MVP, review costs monthly**
- **Usage monitoring: Log API calls and token usage, set up alerts for unusual spikes**
- **Rate limit handling: Return user-friendly error if OpenAI rate limit hit, suggest retry**

