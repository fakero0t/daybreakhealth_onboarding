# Intake Questionnaire Implementation Task List

This document breaks down the PRD implementation into 5 sequential pull requests. Each PR builds on the previous one and includes all necessary implementation details.

## Goals
The implementation should achieve the following goals:
1. Simplify the user experience by replacing multiple structured questions with 5 open-ended narrative questions
2. Use AI to extract standardized symptom data from narrative responses
3. Present extracted data in a reviewable, editable standardized form
4. Maintain data quality and completeness for clinical use

---

## PR 1: Infrastructure & Context Setup

### Overview
Set up the foundation: install dependencies, update context structure, update step navigation, and configure environment variables.

### Files to Create
- `.env.example` - Add `OPENAI_API_KEY=` (without value) to document required environment variable

### Files to Modify

#### `package.json`
- Add dependency: `"openai": "^4.x.x"` (use latest stable version)

#### `lib/context/OnboardingContext.jsx`
- **Remove**: `surveyAnswers` from state structure
- **Add**: `extractedSymptoms` object to state structure:
  ```javascript
  extractedSymptoms: {
    "sadness-depressed-mood": "Daily" | "Some" | "None" | "",
    "temper-outbursts": "Daily" | "Some" | "None" | "",
    // ... all 32 symptoms in kebab-case (see Implementation Notes section for complete list)
    // Note: This is UI-only storage - no backend persistence
  }
  ```
- **Emphasize**: This is a UI-only flow - extracted symptom data is stored only in client-side state and localStorage, NOT persisted to any backend
- **Add**: `extractionMetadata` object:
  ```javascript
  extractionMetadata: {
    extractedAt: timestamp | null,
    model: "gpt-3.5-turbo" | null
  }
  ```
- **Update**: `STORAGE_KEYS` - replace `SURVEY_ANSWERS` with `EXTRACTED_SYMPTOMS`
- **Update**: `INITIAL_STATE` - replace `surveyAnswers: {}` with:
  ```javascript
  extractedSymptoms: {},
  extractionMetadata: { extractedAt: null, model: null }
  ```
- **Remove**: `setSurveyAnswer` and `setSurveyAnswers` functions
- **Add**: `setExtractedSymptoms` function to update extracted symptoms object
- **Add**: `setExtractedSymptom` function to update individual symptom value
- **Add**: `setExtractionMetadata` function to update extraction metadata
- **Update**: localStorage persistence to save/load `extractedSymptoms` and `extractionMetadata` instead of `surveyAnswers`
- **Add**: localStorage fallback handling - if localStorage is full or unavailable, gracefully degrade to in-memory storage only (show console warning, allow continuation)
- **Note**: All data storage is client-side only - no backend API calls for storing symptom data
- **Clarification on PRD wording**: PRD line 73 mentions "Auto-save current question response to context" - this refers to component state/localStorage, NOT OnboardingContext. Narrative answers are never stored in OnboardingContext, only temporarily in component state during active session. This is intentional to avoid persisting narrative data.

#### `app/page.js`
- **Update**: Step mapping - change intake survey from step 4 to step 1
- **Update**: Case statement to render `IntakeSurvey` at step 1 instead of step 4
- **Update**: Other step numbers accordingly (InsuranceUpload becomes step 2, InsuranceResults becomes step 3, SchedulingAssistant becomes step 4, etc.)

### Testing Checklist
- [ ] Verify `extractedSymptoms` structure is saved/loaded from localStorage correctly
- [ ] Verify step navigation shows intake survey as step 1
- [ ] Verify localStorage fallback works when localStorage is unavailable
- [ ] Verify context setters work correctly

---

## PR 2: Question Collection UI

### Overview
Remove existing question logic and implement the 5-question narrative flow with validation, character counting, and navigation.

### Files to Create

#### `components/shared/CharacterCounter.jsx`
- Component that displays character count in format "4,234 / 5,000 characters"
- Props: `currentCount` (number), `maxCount` (number, default 5000)
- **Display format**: Must use comma formatting for numbers (e.g., "4,234" not "4234")
- **Format function**: Use `toLocaleString()` or similar to format numbers with commas
- Color coding:
  - Default: Neutral text color (inherit from parent)
  - Yellow warning (`text-yellow-600` or `text-yellow-600` Tailwind class) at 4,500+ characters (90% of limit)
  - Red warning (`text-red-600` Tailwind class) at 4,900+ characters (98% of limit)
- Include ARIA label for screen readers: `aria-label="Character count"`
- Display format: "{formattedCurrent} / {formattedMax} characters" (with comma formatting)

### Files to Modify

#### `components/onboarding/IntakeSurvey.jsx`
- **Remove**: All existing question logic, screen navigation, conditional logic, summary screen
- **Remove**: All imports related to old question system (`getQuestionByScreen`, `getTotalApplicableQuestions`, etc.)
- **Add**: State management for 5-question flow:
  ```javascript
  const [currentQuestion, setCurrentQuestion] = useState(1) // 1-5
  const [narrativeAnswers, setNarrativeAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: ''
  })
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  ```
- **Add**: Question data constant with purposes (for code comments/documentation):
  ```javascript
  const QUESTIONS = [
    {
      id: 'q1',
      text: "Tell me what a typical day looks like for your child — from morning to bedtime. What parts of the day tend to go smoothly, and what parts are more challenging?",
      placeholder: "Share details about your child's typical day, including routines, activities, and any challenges...",
      // Purpose: Extract information about daily functioning, routines, and challenges
    },
    {
      id: 'q2',
      text: "How does your child usually respond to other people — like family, friends, or teachers? Can you share a recent example of how they handled a good day and a tough day?",
      placeholder: "Describe how your child interacts with others and handles different situations...",
      // Purpose: Extract social behavior, peer relationships, and emotional regulation
    },
    {
      id: 'q3',
      text: "How would you describe your child's energy, attention, and motivation lately? For instance, what do you notice when they're playing, doing homework, or relaxing?",
      placeholder: "Describe your child's energy levels, focus, and motivation in various activities...",
      // Purpose: Extract information about energy levels, attention span, focus, and motivation
    },
    {
      id: 'q4',
      text: "What have you noticed about your child's sleep, eating, or physical habits recently? Have any routines changed?",
      placeholder: "Share any changes or observations about sleep, eating, or physical habits...",
      // Purpose: Extract sleep patterns, eating behaviors, and physical symptoms
    },
    {
      id: 'q5',
      text: "If you had to describe what's been most different or concerning about your child in the past couple of weeks, what would that be?",
      placeholder: "Describe what's been most concerning or different about your child recently...",
      // Purpose: Extract primary concerns and recent changes
    }
  ]
  ```
- **Add**: Validation function:
  ```javascript
  const validateAnswer = (answer) => {
    if (!answer || answer.trim().length < 10) {
      return "Please provide at least 10 characters"
    }
    if (answer.length > 5000) {
      return "Response must be 5,000 characters or less"
    }
    return null
  }
  ```
- **Add**: Auto-save to localStorage (debounced, exactly 500ms) for in-progress answers
- **Note**: Debounce timing is 500ms (not approximate) - use consistent timing for both narrative answers and symptom edits
- **Clarification**: PRD mentions "Auto-save current question response to context" - this means component state (localStorage for persistence), NOT OnboardingContext. Narrative answers are never stored in context, only in component state temporarily.
- **Add**: Restore in-progress answers from localStorage on mount
- **Add**: Navigation handlers:
  - `handleNext()` - validate current answer, clear error, move to next question
  - `handlePrevious()` - move to previous question (disabled on question 1)
  - `handleContinue()` - validate answer, trigger extraction (will be implemented in PR 3)
- **Add**: Browser navigation handling:
  - Browser back button: Show warning dialog "Are you sure you want to go back? Your progress may be lost." with "Cancel" and "Go Back" options
  - Navigation away warning: Show warning if user tries to navigate away during question entry ("You have unsaved changes. Are you sure you want to leave?")
  - Multiple tabs: Detect if same session in another tab (use localStorage flag), show warning
- **Implement**: Question screen UI:
  - Display current question text (text-lg, 18px)
  - Text area: Fixed height 200px, scrollable if content exceeds height, placeholder text
  - Character counter below text area (use CharacterCounter component)
  - Character minimum hint: "Please provide at least 10 characters" (shown when field is empty or has less than 10 characters)
  - Error message display (if validation fails)
  - Progress indicator: "Question {currentQuestion} of 5" (use this format for question screens)
  - Navigation buttons:
    - "Previous" button (questions 2-5 only, disabled on question 1)
    - "Next" button (questions 1-4)
    - "Continue" button (question 5 only)
  - Buttons enabled only when current question has valid response (non-empty, within character limit)
  - **Narrative answers are locked after submission** - no ability to go back and edit once user proceeds to extraction
  - **No ability to skip ahead** - questions must be answered sequentially
- **Add**: Auto-save narrative answers to component state (debounced, exactly 500ms) - do NOT store in context
- **Remove or conditionally render**: FAQ Chatbot component - decide whether to:
  - Remove completely (recommended for cleaner flow)
  - Keep but hide during question entry
  - Keep and show on all screens
  - **Decision needed**: Specify which approach to take
- **Add**: Clear narrative answers from localStorage after extraction completes (will be called in PR 3)

### Testing Checklist
- [ ] All 5 questions display correctly with proper text and placeholders
- [ ] Character counter displays correctly and changes color at thresholds
- [ ] Validation works: shows error for < 10 chars and > 5000 chars
- [ ] Navigation works: Previous/Next/Continue buttons function correctly
- [ ] Progress indicator shows correct question number
- [ ] Auto-save to localStorage works (debounced)
- [ ] Restore from localStorage works on page reload
- [ ] Browser back button shows warning dialog
- [ ] Navigation away warning works
- [ ] Multiple tab detection works

---

## PR 3: AI Integration & Extraction

### Overview
Implement OpenAI API integration with prompt engineering, error handling, loading states, and request management.

### Files to Create

#### `app/api/extract-symptoms/route.js`
- **Create**: Next.js API route handler
- **Import**: OpenAI SDK
- **Add**: Rate limiting (max 10 requests per minute per IP) - use simple in-memory store or library
- **Implement**: POST handler:
  - Validate request body structure (expect array of 5 strings)
  - Validate each answer is 10-5000 characters
  - Create OpenAI client with API key from `process.env.OPENAI_API_KEY`
  - **System prompt** (include all details from PRD):
    ```
    You are a mental health assessment assistant. Your task is to extract symptom information from narrative responses about a child's mental health over the past 2 weeks.
    
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
    }
    ```
  - **User prompt**: Format all 5 narrative responses clearly with labels (Q1, Q2, Q3, Q4, Q5)
  - **Call OpenAI**: Use GPT-3.5-turbo with JSON mode enabled (response_format: { type: "json_object" })
  - **Timeout**: Exactly 60 seconds (60000ms) - if exceeded, show timeout error
  - **Request timeout**: 60 seconds - if exceeded, show timeout error
  - **Note**: This is the only API endpoint in this flow - no backend API for storing data (UI-only)
  - **No manual fallback option** - user must retry or contact support
  - **Validate response**:
    - Check JSON structure is valid
    - Validate all 32 symptom keys are present (log warning if missing, use empty string)
    - Validate symptom keys match expected list (log error for invalid keys, ignore them, use empty string)
    - Validate symptom values are only "Daily", "Some", "None", or empty string (sanitize invalid values to empty string)
  - **Return**: Validated response with all 32 symptoms
  - **Error handling**:
    - Network errors: Return 500 with error message
    - API errors (rate limits, etc.): Return 503 with error message
    - Timeout: Return 504 with error message
    - Invalid request: Return 400 with error message
  - **Logging**: Log metadata only (timestamp, model used, success/failure, request duration) - NO PHI
  - **Cost considerations**:
    - **No caching of extraction results** (not needed since flow is one-way and data is stored in context/localStorage)
    - **Note**: PRD mentions "Cache extraction results" but this contradicts later "No caching" - follow the "No caching" approach as flow is one-way
    - Optional: Consider streaming for better UX (not required for initial implementation)
    - Monitor token usage and costs via console logging (log token count in metadata)
    - **Note**: This is a UI-only flow with no backend storage - all data exists only in browser

#### `lib/constants/symptom-mapping.js`
- **Create**: Constant file with symptom mapping
- **Include**: Complete array of all 32 symptoms in order with their kebab-case keys:
  ```javascript
  export const SYMPTOMS = [
    { key: 'sadness-depressed-mood', label: 'Sadness/Depressed Mood/Crying Spells', category: 'Mood/Emotional', number: 1 },
    { key: 'temper-outbursts', label: 'Temper Outbursts', category: 'Behavioral', number: 2 },
    { key: 'withdrawn-or-isolated', label: 'Withdrawn or Isolated', category: 'Social', number: 3 },
    { key: 'daydreaming', label: 'Daydreaming', category: 'Cognitive', number: 4 },
    { key: 'fearful', label: 'Fearful', category: 'Mood/Emotional', number: 5 },
    { key: 'clumsy', label: 'Clumsy', category: 'Physical/Sleep', number: 6 },
    { key: 'over-reactive', label: 'Over-reactive', category: 'Anxiety/Worry', number: 7 },
    { key: 'short-attention-span-difficulty-concentrating', label: 'Short Attention Span/Difficulty Concentrating', category: 'Cognitive', number: 8 },
    { key: 'fatigue-low-energy', label: 'Fatigue/Low Energy', category: 'Physical/Sleep', number: 9 },
    { key: 'hard-to-make-decisions', label: 'Hard to make decisions', category: 'Cognitive', number: 10 },
    { key: 'appetite-increase-or-decrease-feeding-or-eating-problems', label: 'Appetite increase or decrease/Feeding or eating problems', category: 'Physical/Sleep', number: 11 },
    { key: 'weight-increase-or-decrease', label: 'Weight increase or decrease', category: 'Physical/Sleep', number: 12 },
    { key: 'distractible', label: 'Distractible', category: 'Cognitive', number: 13 },
    { key: 'suicidal-thoughts', label: 'Suicidal thoughts', category: 'Safety Concerns', number: 14 },
    { key: 'attempts-to-self-harm', label: 'Attempts to self-harm', category: 'Safety Concerns', number: 15 },
    { key: 'peer-conflict-mean-to-others', label: 'Peer Conflict/Mean to others', category: 'Social', number: 16 },
    { key: 'mood-swings', label: 'Mood swings', category: 'Mood/Emotional', number: 17 },
    { key: 'increased-energy', label: 'Increased energy', category: 'Physical/Sleep', number: 18 },
    { key: 'racing-thoughts', label: 'Racing thoughts', category: 'Cognitive', number: 19 },
    { key: 'bedwetting', label: 'Bedwetting', category: 'Physical/Sleep', number: 20 },
    { key: 'decreased-need-for-sleep', label: 'Decreased need for sleep', category: 'Physical/Sleep', number: 21 },
    { key: 'excessive-worry', label: 'Excessive worry', category: 'Anxiety/Worry', number: 22 },
    { key: 'feeling-on-edge', label: 'Feeling "on edge"', category: 'Anxiety/Worry', number: 23 },
    { key: 'panic-attacks', label: 'Panic Attacks', category: 'Anxiety/Worry', number: 24 },
    { key: 'destructive', label: 'Destructive', category: 'Behavioral', number: 25 },
    { key: 'restlessness', label: 'Restlessness', category: 'Anxiety/Worry', number: 26 },
    { key: 'irritability-or-anger', label: 'Irritability or Anger', category: 'Mood/Emotional', number: 27 },
    { key: 'stealing-lying-disregard-for-others', label: 'Stealing, lying, disregard for others', category: 'Behavioral', number: 28 },
    { key: 'defiance-toward-authority', label: 'Defiance toward authority', category: 'Behavioral', number: 29 },
    { key: 'impulsivity', label: 'Impulsivity', category: 'Behavioral', number: 30 },
    { key: 'nightmares', label: 'Nightmares', category: 'Other', number: 31 },
    { key: 'hearing-or-seeing-things-others-dont-see-hear', label: 'Hearing or seeing things - others don\'t see/hear', category: 'Safety Concerns', number: 32 }
  ]
  
  export const SYMPTOM_CATEGORIES = {
    'Mood/Emotional': [1, 17, 27, 5], // Symptoms: Sadness, Mood swings, Irritability, Fearful
    'Behavioral': [2, 29, 30, 25, 28], // Symptoms: Temper Outbursts, Defiance, Impulsivity, Destructive, Stealing/lying
    'Cognitive': [8, 13, 10, 19, 4], // Symptoms: Short Attention Span, Distractible, Hard to make decisions, Racing thoughts, Daydreaming
    'Physical/Sleep': [9, 20, 21, 18, 11, 12, 6], // Symptoms: Fatigue, Bedwetting, Decreased sleep, Increased energy, Appetite, Weight, Clumsy
    'Social': [3, 16], // Symptoms: Withdrawn, Peer Conflict
    'Anxiety/Worry': [22, 23, 24, 26, 7], // Symptoms: Excessive worry, Feeling on edge, Panic Attacks, Restlessness, Over-reactive
    'Safety Concerns': [14, 15, 32], // Symptoms: Suicidal thoughts, Self-harm, Hearing/seeing things
    'Other': [31] // Symptoms: Nightmares
  }
  
  // Helper function to get symptoms by category in order
  export const getSymptomsByCategory = (category) => {
    const symptomNumbers = SYMPTOM_CATEGORIES[category] || []
    return SYMPTOMS.filter(s => symptomNumbers.includes(s.number)).sort((a, b) => a.number - b.number)
  }
  ```

### Files to Modify

#### `components/onboarding/IntakeSurvey.jsx`
- **Add**: Import `useOnboardingState` to access context setters
- **Add**: State for extraction:
  ```javascript
  const [extractionError, setExtractionError] = useState(null)
  const [extractionStep, setExtractionStep] = useState(null) // 'analyzing' | 'extracting' | 'finalizing'
  ```
- **Update**: `handleContinue()` function:
  - Validate all 5 answers
  - Set `isProcessing` to true
  - Clear narrative answers from localStorage
  - Call extraction API
  - Handle loading states with progress steps
  - Handle errors with retry functionality
  - Store extracted symptoms in context on success
- **Add**: `extractSymptoms()` async function:
  - Make POST request to `/api/extract-symptoms`
  - Pass all 5 narrative answers in request body
  - Update `extractionStep` state for progress display
  - Handle AbortController for request cancellation
  - Handle errors (network, API, timeout, invalid)
  - On success: Store in context using `setExtractedSymptoms` and `setExtractionMetadata`
  - Clear narrative answers from component state after successful extraction
- **Add**: Request deduplication - disable "Continue" button during processing, track in-flight requests
- **Add**: Request cancellation - cancel request if user navigates away (use AbortController)
- **Implement**: Loading state UI (Phase 2):
  - Spinner with message "Analyzing your responses..."
  - Progress steps display: "Analyzing...", "Extracting symptoms...", "Finalizing..."
  - Progress indicator
- **Implement**: Error state UI:
  - Display error message based on error type
  - "Retry" button (same style as Continue button)
  - Error messages (must match PRD exactly):
    - Network: "Unable to connect. Please check your internet connection and try again." (exact text)
    - API: "Service temporarily unavailable. Please try again in a moment." (exact text)
    - Timeout: "Request took too long. Please try again." (exact text)
    - Invalid: "Unable to process responses. Please try again." (exact text)
    - localStorage unavailable: "Unable to save your progress. Please try again." (exact text)
  - ARIA live region for error announcements

### Testing Checklist
- [ ] API route validates request body correctly
- [ ] Rate limiting works (test with multiple rapid requests)
- [ ] OpenAI API call succeeds with valid responses
- [ ] Response validation works (all 32 keys, valid values)
- [ ] **AI extraction accuracy**: Test with sample responses and validate extraction accuracy (target: 80% of symptoms correctly mapped)
- [ ] Error handling works for all error types
- [ ] Error messages match PRD exactly (verify exact text)
- [ ] Timeout handling works (60 seconds)
- [ ] Loading states display correctly with progress steps
- [ ] Request deduplication prevents multiple simultaneous requests
- [ ] Request cancellation works if user navigates away
- [ ] Extracted symptoms are stored in context correctly
- [ ] Extraction metadata is stored correctly
- [ ] Narrative answers are cleared after extraction
- [ ] **No backend storage**: Verify no data is sent to any backend API (UI-only flow)

---

## PR 4: Symptom Review Form

### Overview
Create the symptom review form component with category organization, inline editing, auto-save, and all styling specifications.

### Files to Create

#### `components/onboarding/SymptomReviewForm.jsx`
- **Create**: Component for displaying and editing extracted symptoms
- **Props**: 
  - `extractedSymptoms` (object)
  - `onSymptomChange` (function to update symptom)
  - `onContinue` (function to proceed to next step)
- **Import**: `SYMPTOMS` and `SYMPTOM_CATEGORIES` from `lib/constants/symptom-mapping.js`
- **Implement**: Summary count display at top:
  - "X symptoms marked as Daily, Y as Some, Z as None, W not yet filled"
  - Calculate counts from `extractedSymptoms`
- **Implement**: Category sections (always visible, not collapsible):
  - Loop through categories in order
  - For each category, display header with styling:
    - Background color: #F3F4F6 (use Tailwind class `bg-gray-100` or custom color)
    - Border: 1px solid #E5E7EB (use Tailwind class `border border-gray-200`)
    - Font: text-xl (20px), font-semibold (use Tailwind classes `text-xl font-semibold`)
    - Padding: 16px horizontal (use Tailwind class `px-4`)
  - Display symptoms in that category (in order 1-32)
  - **Category display**: Categories are always visible (not collapsible) with subtle styling (background color or border to distinguish sections)
  - **Category header styling**: 
    - Subtle background color: #F3F4F6 (light gray, consistent with design system)
    - Border: 1px solid #E5E7EB (subtle border to distinguish sections)
- **Implement**: Symptom rows:
  - Each symptom displays:
    - Label (text-base, 16px): Symptom name
    - Dropdown select with options: "Daily", "Some", "None", "" (empty/blank)
    - Current value from `extractedSymptoms`
  - Empty symptom styling (if value is empty string):
    - Background color: #FEF3C7 (use Tailwind class `bg-yellow-100` or custom color)
    - Border: 1px solid #FCD34D (use Tailwind class `border border-yellow-300`)
    - Optional warning icon (⚠️) - can use emoji or icon component
    - **Empty symptom styling**: Symptoms with no extracted value should be visually distinct (e.g., light yellow background, border, or warning icon) to indicate they need attention
  - Spacing: 16px vertical between symptoms (consistent with design system)
  - **Spacing/Layout**: 
    - Standard spacing between symptoms: 16px vertical spacing (consistent with design system)
    - Consistent padding within category sections: 16px horizontal padding
- **Implement**: Auto-save functionality:
  - Debounce symptom changes (exactly 500ms delay - consistent with narrative answer debounce)
  - On change: Call `onSymptomChange` with symptom key and new value
  - Show visual confirmation: Checkmark icon (✓) in #10B981 color (use Tailwind class `text-green-500` or equivalent)
  - Checkmark appears for exactly 2 seconds, then fades out
  - **Visual confirmation**: Show subtle checkmark icon (✓) next to symptom when auto-save succeeds (appears for 2 seconds, then fades)
  - **Success checkmark color**: #10B981 (green, consistent with success states)
  - **No "Save Changes" button** - changes are auto-saved as user edits (debounced, ~500ms delay)
  - **No bulk edit or select all** - each symptom must be edited individually
  - **No "Clear" or "Reset" option** - keep interface simple, user can manually change dropdown value
  - **Auto-save ensures no data loss during editing** - changes are persisted immediately after debounce
- **Implement**: Continue button:
  - Always enabled (no validation required - user can proceed even if some symptoms are empty)
  - Same style as Continue button used throughout onboarding flow
  - **Button styling**: Same style as "Continue" button used throughout onboarding flow
  - **Button state**: Always enabled (no validation required)
  - Calls `onContinue` when clicked
  - No confirmation dialog - keep flow smooth, proceed directly to next step
  - **No confirmation dialog** - keep flow smooth, proceed directly to next step
- **Styling**:
  - Form width: Maximum width container (max-w-4xl or max-w-5xl), centered
  - **Form width**: Maximum width container (e.g., max-w-4xl or max-w-5xl) for better readability, centered on page
  - Scrollable list if content exceeds viewport
  - Use existing Button component for Continue button
  - **Font sizes** (follow existing design system):
    - Question text: text-lg (18px)
    - Symptom labels: text-base (16px)
    - Category headers: text-xl (20px), font-semibold
    - Character counter: text-sm (14px)
  - **Clinical format**: Form should match standard clinical assessment format for mental health intake (professional, clear, organized presentation)
- **Accessibility**:
  - Proper ARIA labels for all dropdowns
  - Keyboard accessible dropdowns
  - ARIA live region for auto-save confirmations

### Files to Modify

#### `components/onboarding/IntakeSurvey.jsx`
- **Add**: Import `SymptomReviewForm` component
- **Add**: Import `useOnboardingState` to get `extractedSymptoms` and setters
- **Add**: State for symptom edits:
  ```javascript
  const [editedSymptoms, setEditedSymptoms] = useState({})
  const [saveConfirmations, setSaveConfirmations] = useState({}) // track which symptoms show checkmark
  ```
- **Add**: `handleSymptomChange` function:
  - Update `editedSymptoms` state
  - Debounce auto-save (exactly 500ms - consistent timing)
  - Call context setter to update `extractedSymptoms`
  - Show checkmark confirmation (set in `saveConfirmations`, clear after exactly 2 seconds)
- **Add**: `handleReviewContinue` function:
  - Proceed to Scheduling Assistant (call `goToNextStep()`)
- **Implement**: Review form UI (Phase 3):
  - Render `SymptomReviewForm` component
  - Pass `extractedSymptoms` from context
  - Pass `handleSymptomChange` and `handleReviewContinue` as props
  - Progress indicator: Use "Step 1 of 5" format (consistent with onboarding flow) - do NOT use "Review" text
  - **Progress indicator**: Shows "Review" or "Step 1 of 5" (depending on onboarding flow)
  - **No ability to go back to edit narrative answers** - flow is one-way
  - **No changes allowed to narrative answers after extraction** - only extracted symptom data can be edited
  - **Add**: Restore behavior: If user edits symptoms and closes browser, restore AI-extracted values (not user edits) on return - user edits only persisted if flow is completed

### Testing Checklist
- [ ] All 32 symptoms display in correct order
- [ ] Symptoms are grouped by category correctly
- [ ] Category headers have correct styling
- [ ] Empty symptoms have yellow highlighting
- [ ] Dropdowns work correctly for all symptoms
- [ ] Auto-save works (debounced, ~500ms)
- [ ] Checkmark confirmation appears and fades correctly
- [ ] Summary count displays correctly
- [ ] Continue button proceeds to next step
- [ ] Symptom changes are persisted to context/localStorage
- [ ] Form width and spacing match specifications
- [ ] Keyboard navigation works for dropdowns

---

## PR 5: Polish, Accessibility & Final Integration

### Overview
Add accessibility features, analytics/logging, final browser handling edge cases, update progress indicators, and complete integration.

### Files to Modify

#### `components/onboarding/IntakeSurvey.jsx`
- **Add**: Skip links for keyboard navigation:
  - Add skip link at start of question screens: "Skip to question" (links to question text)
  - Add skip link at start of review form: "Skip to symptom review" (links to summary count)
- **Add**: ARIA live regions:
  - For loading states: Announce "Analyzing responses", "Extracting symptoms", "Finalizing"
  - For errors: Announce error messages immediately when they occur
  - For auto-save confirmations: Announce "Saved" when symptom is auto-saved
- **Add**: Focus management:
  - Focus first question text area on question screen load
  - Focus first symptom dropdown on review form load
  - Maintain focus during flow transitions
- **Add**: Analytics/logging (console only):
  - Track time spent on each question (start time on question load, log on navigation)
  - Track number of retries on API calls
  - Track which symptoms are most commonly edited (log when symptom is changed)
  - Track form completion (log when Continue is clicked on review form)
  - Log format: `console.log('Analytics:', { event, data, timestamp })`
  - NO PHI in logs - only metadata
- **Add**: Enhanced browser handling:
  - Detect localStorage support on mount, show subtle warning if unavailable or full
  - Handle case where user closes browser during AI processing: On return, show error and allow retry (don't auto-retry)
  - Improve multiple tab detection with better localStorage flag management
  - Handle localStorage full scenario: Show warning to user, allow continuation with in-memory storage only
  - **No localStorage support**: If browser doesn't support localStorage, gracefully degrade to in-memory storage only (show subtle warning, allow continuation)
  - **No session timeout** - user can take as long as needed on each question
- **Update**: Progress indicator text to show "Step 1 of 5" consistently (never use "Review" text - always use step format)
- **Add**: Character counter ARIA announcement for screen readers

#### `components/shared/CharacterCounter.jsx`
- **Add**: ARIA live region to announce character count changes to screen readers
- **Update**: Include current count in aria-label for better accessibility

#### `components/onboarding/SymptomReviewForm.jsx`
- **Add**: Skip link at top: "Skip to continue button" (links to Continue button)
- **Add**: ARIA labels for all dropdowns: `aria-label="Select value for {symptom name}"`
- **Add**: ARIA live region for summary count updates
- **Add**: Focus management: Focus first empty symptom dropdown on load (if any), otherwise first dropdown

#### `lib/context/OnboardingContext.jsx`
- **Add**: Validation for `extractedSymptoms` structure on load from localStorage
- **Add**: Migration logic: If old `surveyAnswers` exists in localStorage, clear it (one-time migration)

#### `app/page.js`
- **Update**: Progress indicator to show correct step numbers (intake is step 1)
- **Verify**: All step transitions work correctly

### Files to Create (Optional)

#### `lib/utils/analytics.js`
- **Create**: Utility for analytics logging (console only)
- **Functions**:
  - `logQuestionTime(questionId, timeSpent)` - Log time spent on question
  - `logRetry()` - Log API retry
  - `logSymptomEdit(symptomKey)` - Log symptom edit
  - `logFormCompletion()` - Log form completion
- **Format**: All logs include timestamp and are console.log only

### Testing Checklist
- [ ] Skip links work correctly and navigate to correct elements
- [ ] ARIA live regions announce loading states correctly
- [ ] ARIA live regions announce errors immediately
- [ ] ARIA live regions announce auto-save confirmations
- [ ] Focus management works correctly on all screen transitions
- [ ] Character counter is announced to screen readers
- [ ] All dropdowns have proper ARIA labels
- [ ] Analytics logging works (check console)
- [ ] No PHI in console logs
- [ ] Browser handling edge cases work (localStorage unavailable, multiple tabs, etc.)
- [ ] Progress indicators show correct step numbers
- [ ] Migration from old `surveyAnswers` works (one-time)
- [ ] Complete flow works end-to-end: Questions → Extraction → Review → Next Step
- [ ] All accessibility features work with keyboard navigation
- [ ] All accessibility features work with screen reader

---

## Implementation Notes

### Symptom Key Mapping (Kebab-case)
All 32 symptoms must be mapped to kebab-case keys. Examples:
- "Sadness/Depressed Mood/Crying Spells" → `"sadness-depressed-mood"`
- "Short Attention Span/Difficulty Concentrating" → `"short-attention-span-difficulty-concentrating"`
- "Appetite increase or decrease/Feeding or eating problems" → `"appetite-increase-or-decrease-feeding-or-eating-problems"`

### Complete Symptom List with Keys
1. `sadness-depressed-mood` - Sadness/Depressed Mood/Crying Spells
2. `temper-outbursts` - Temper Outbursts
3. `withdrawn-or-isolated` - Withdrawn or Isolated
4. `daydreaming` - Daydreaming
5. `fearful` - Fearful
6. `clumsy` - Clumsy
7. `over-reactive` - Over-reactive
8. `short-attention-span-difficulty-concentrating` - Short Attention Span/Difficulty Concentrating
9. `fatigue-low-energy` - Fatigue/Low Energy
10. `hard-to-make-decisions` - Hard to make decisions
11. `appetite-increase-or-decrease-feeding-or-eating-problems` - Appetite increase or decrease/Feeding or eating problems
12. `weight-increase-or-decrease` - Weight increase or decrease
13. `distractible` - Distractible
14. `suicidal-thoughts` - Suicidal thoughts
15. `attempts-to-self-harm` - Attempts to self-harm
16. `peer-conflict-mean-to-others` - Peer Conflict/Mean to others
17. `mood-swings` - Mood swings
18. `increased-energy` - Increased energy
19. `racing-thoughts` - Racing thoughts
20. `bedwetting` - Bedwetting
21. `decreased-need-for-sleep` - Decreased need for sleep
22. `excessive-worry` - Excessive worry
23. `feeling-on-edge` - Feeling "on edge"
24. `panic-attacks` - Panic Attacks
25. `destructive` - Destructive
26. `restlessness` - Restlessness
27. `irritability-or-anger` - Irritability or Anger
28. `stealing-lying-disregard-for-others` - Stealing, lying, disregard for others
29. `defiance-toward-authority` - Defiance toward authority
30. `impulsivity` - Impulsivity
31. `nightmares` - Nightmares
32. `hearing-or-seeing-things-others-dont-see-hear` - Hearing or seeing things - others don't see/hear

### Category Mapping
- **Mood/Emotional**: Symptoms #1, #17, #27, #5
- **Behavioral**: Symptoms #2, #29, #30, #25, #28
- **Cognitive**: Symptoms #8, #13, #10, #19, #4
- **Physical/Sleep**: Symptoms #9, #20, #21, #18, #11, #12, #6
- **Social**: Symptoms #3, #16
- **Anxiety/Worry**: Symptoms #22, #23, #24, #26, #7
- **Safety Concerns**: Symptoms #14, #15, #32
- **Other**: Symptom #31

### Dependencies
- `openai` package (latest stable version)
- Next.js API routes (already configured)
- Existing components: Button, ProgressIndicator (may need minor prop updates)

### Environment Variables
- `OPENAI_API_KEY` - Required, stored in `.env.local`, documented in `.env.example`
- **Note**: No additional environment-specific configurations needed - only API key required

### HIPAA Compliance Notes
- **Important**: Consider OpenAI Business Associate Agreement (BAA) for HIPAA compliance
- This is a UI-only flow with no backend storage - data exists only in browser session
- Narrative answers are not stored (only extracted symptom data)
- OpenAI API calls are made server-side only (via Next.js API routes)
- Follow minimum necessary principle - only extract required symptom data
- **Note**: This is not a code requirement but should be considered for production deployment
- **Security & HIPAA Compliance**:
  - Validate API responses before storing
  - Sanitize user input
  - Never expose API keys in client code
  - **HIPAA Considerations**:
    - Narrative answers are not stored (only extracted symptom data)
    - Ensure OpenAI API calls are made server-side only (via Next.js API routes)
    - Consider OpenAI Business Associate Agreement (BAA) for HIPAA compliance
    - Implement proper data encryption in transit (HTTPS)
    - Extracted symptom data stored in localStorage (client-side only, not persisted to backend)
    - Follow minimum necessary principle - only extract required symptom data
    - **Note**: Since this is a UI-only flow with no backend storage, data exists only in the browser session

### Cost Considerations
- No caching of extraction results (not needed since flow is one-way)
- Optional: Consider streaming for better UX (not required for initial implementation)
- Monitor token usage and costs via console logging (log token count in metadata)
- **Note**: This is a UI-only flow with no backend storage - all data exists only in browser

### Audit Trail Consideration
- **Future enhancement**: Consider implementing audit trail for when data was extracted and any manual edits made
- Not required for initial implementation, but worth noting for future clinical review needs

### Success Criteria
After all 5 PRs are merged:
- [ ] User can answer 5 narrative questions (one per screen)
- [ ] Character validation works (10-5000 chars)
- [ ] Character counter displays with comma formatting (e.g., "4,234 / 5,000")
- [ ] AI extraction works and returns all 32 symptoms
- [ ] **AI extraction accuracy target: 80%** (symptoms correctly mapped to Daily/Some/None)
- [ ] Review form displays symptoms by category
- [ ] Users can edit symptoms with auto-save (500ms debounce)
- [ ] Flow proceeds to Scheduling Assistant after review
- [ ] All data stored only in browser (no backend storage - UI-only flow)
- [ ] All accessibility features work (WCAG 2.1 AA compliance)
- [ ] All browser handling edge cases work
- [ ] Analytics logging works (console only, no PHI)
- [ ] Progress indicators show "Step 1 of 5" format consistently
- [ ] Error messages match PRD exactly
- [ ] Debounce timing is consistent (500ms for both narrative answers and symptom edits)
- [ ] Narrative answers are locked after submission (no ability to go back and edit)
- [ ] Questions must be answered sequentially (no ability to skip ahead)
- [ ] Text area has fixed height 200px and is scrollable
- [ ] Character minimum hint displays correctly
- [ ] Category headers have correct styling (#F3F4F6 background, #E5E7EB border)
- [ ] Empty symptoms have correct styling (#FEF3C7 background, #FCD34D border)
- [ ] Summary count displays correctly ("X symptoms marked as Daily, Y as Some, Z as None, W not yet filled")
- [ ] Visual confirmation checkmark appears and fades correctly (2 seconds)
- [ ] Form width is max-w-4xl or max-w-5xl and centered
- [ ] Spacing matches specifications (16px vertical between symptoms, 16px horizontal padding in categories)
- [ ] Font sizes match design system (question: 18px, symptom labels: 16px, category headers: 20px, character counter: 14px)

