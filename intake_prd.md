# Intake Questionnaire PRD

## Overview
Replace the existing structured questionnaire flow with a conversational, open-ended approach that uses AI to extract standardized form data from narrative responses. This reduces user burden while maintaining the structured data needed for clinical assessment.

## Goals
1. Simplify the user experience by replacing multiple structured questions with 5 open-ended narrative questions
2. Use AI to extract standardized symptom data from narrative responses
3. Present extracted data in a reviewable, editable standardized form
4. Maintain data quality and completeness for clinical use

## Current State
- **Component**: `components/onboarding/IntakeSurvey.jsx`
- **Questions**: 13 structured questions across 4 categories (Basic Information, Symptoms & Concerns, History, Goals)
- **Flow**: Multi-screen progression with conditional logic (currently Step 4 of 5 in onboarding)
- **Data Structure**: Stored in `OnboardingContext` as `surveyAnswers` object
- **Note**: This intake survey will replace the existing question flow and become Step 1 of the onboarding process

## Proposed Changes

### 1. New Question Flow

Replace all existing questions with 5 open-ended questions:

1. **Daily Routine Question**
   - Text: "Tell me what a typical day looks like for your child — from morning to bedtime. What parts of the day tend to go smoothly, and what parts are more challenging?"
   - Purpose: Extract information about daily functioning, routines, and challenges

2. **Social Interaction Question**
   - Text: "How does your child usually respond to other people — like family, friends, or teachers? Can you share a recent example of how they handled a good day and a tough day?"
   - Purpose: Extract social behavior, peer relationships, and emotional regulation

3. **Energy & Attention Question**
   - Text: "How would you describe your child's energy, attention, and motivation lately? For instance, what do you notice when they're playing, doing homework, or relaxing?"
   - Purpose: Extract information about energy levels, attention span, focus, and motivation

4. **Physical Habits Question**
   - Text: "What have you noticed about your child's sleep, eating, or physical habits recently? Have any routines changed?"
   - Purpose: Extract sleep patterns, eating behaviors, and physical symptoms

5. **Primary Concerns Question**
   - Text: "If you had to describe what's been most different or concerning about your child in the past couple of weeks, what would that be?"
   - Purpose: Extract primary concerns and recent changes

### 2. UI Flow

**Phase 1: Question Collection**
- **One question per screen** (5 separate screens)
- Each screen displays a single question with a large text area
- **Text area specifications**: Fixed height of 200px, scrollable if content exceeds height
- Character limit: 5000 characters per question
- **Character counter**: Display below text area showing format "4,234 / 5,000 characters"
  - **Color coding**: 
    - Default: Neutral text color
    - Yellow warning at 4,500+ characters (90% of limit)
    - Red warning at 4,900+ characters (98% of limit)
- **Character minimum hint**: Display below text area: "Please provide at least 10 characters" (shown when field is empty or has less than 10 characters)
- **Placeholder text**: 
  - Q1: "Share details about your child's typical day, including routines, activities, and any challenges..."
  - Q2: "Describe how your child interacts with others and handles different situations..."
  - Q3: "Describe your child's energy levels, focus, and motivation in various activities..."
  - Q4: "Share any changes or observations about sleep, eating, or physical habits..."
  - Q5: "Describe what's been most concerning or different about your child recently..."
- All 5 questions are **required** - user cannot proceed until all are answered
- Progress indicator showing current question (e.g., "Question 2 of 5")
- **Navigation**: "Previous" button on questions 2-5 (disabled on question 1), "Next" button on questions 1-4, "Continue" button on question 5
- Buttons enabled only when current question has a response (non-empty, within character limit)
- **Validation**: 
  - If response is too short (< 10 characters): Show error message "Please provide at least 10 characters"
  - If response is too long (> 5000 characters): Show error message "Response must be 5,000 characters or less"
  - Return error before allowing navigation
- **Narrative answers are locked after submission** - no ability to go back and edit once user proceeds to extraction
- Auto-save current question response to context as user types (debounced)
- **No ability to skip ahead** - questions must be answered sequentially

**Phase 2: AI Processing**
- Loading state after user clicks "Continue" on question 5
- Display: Spinner with message "Analyzing your responses..." and progress indicator
- Show progress steps: "Analyzing...", "Extracting symptoms...", "Finalizing..."
- Call OpenAI API to extract standardized data (triggered on "Continue" click)
- **API Route**: `/api/extract-symptoms`
- **Request timeout**: 60 seconds - if exceeded, show timeout error
- **Error handling**:
  - Network errors: Show error message "Unable to connect. Please check your internet connection and try again." with "Retry" button
  - API errors (rate limits, service unavailable): Show error message "Service temporarily unavailable. Please try again in a moment." with "Retry" button
  - Timeout errors: Show error message "Request took too long. Please try again." with "Retry" button
  - Invalid responses: Show error message "Unable to process responses. Please try again." with "Retry" button
- **No manual fallback option** - user must retry or contact support

**Phase 3: Standardized Form Display**
- Display extracted data in structured form
- **Symptom organization**: Display symptoms in the same order as listed (1-32), grouped with visual category headers:
  - **Mood/Emotional**: Sadness/Depressed Mood/Crying Spells (#1), Mood swings (#17), Irritability or Anger (#27), Fearful (#5)
  - **Behavioral**: Temper Outbursts (#2), Defiance toward authority (#29), Impulsivity (#30), Destructive (#25), Stealing, lying, disregard for others (#28)
  - **Cognitive**: Short Attention Span/Difficulty Concentrating (#8), Distractible (#13), Hard to make decisions (#10), Racing thoughts (#19), Daydreaming (#4)
  - **Physical/Sleep**: Fatigue/Low Energy (#9), Bedwetting (#20), Decreased need for sleep (#21), Increased energy (#18), Appetite increase or decrease (#11), Weight increase or decrease (#12), Clumsy (#6)
  - **Social**: Withdrawn or Isolated (#3), Peer Conflict/Mean to others (#16)
  - **Anxiety/Worry**: Excessive worry (#22), Feeling "on edge" (#23), Panic Attacks (#24), Restlessness (#26), Over-reactive (#7)
  - **Safety Concerns**: Suicidal thoughts (#14), Attempts to self-harm (#15), Hearing or seeing things - others don't see/hear (#32)
  - **Other**: Nightmares (#31)
- **Category display**: Categories are always visible (not collapsible) with subtle styling (background color or border to distinguish sections)
- **Display format**: Single scrollable list with category section headers
- Each symptom shows extracted answer: "Daily", "Some", or "None"
- If AI cannot extract clear answer for a symptom, leave that field empty (user can fill manually)
- **Input type**: Dropdown select for each symptom (options: "Daily", "Some", "None", or empty/blank)
- **Empty symptom styling**: Symptoms with no extracted value should be visually distinct (e.g., light yellow background, border, or warning icon) to indicate they need attention
- **No bulk edit or select all** - each symptom must be edited individually
- **No "Clear" or "Reset" option** - keep interface simple, user can manually change dropdown value
- **No "Save Changes" button** - changes are auto-saved as user edits (debounced, ~500ms delay)
- **Visual confirmation**: Show subtle checkmark icon (✓) next to symptom when auto-save succeeds (appears for 2 seconds, then fades)
- **Summary count**: Display summary at top of review form: "X symptoms marked as Daily, Y as Some, Z as None, W not yet filled"
- **Continue button**: Proceeds directly to Scheduling Assistant (next step in onboarding)
  - **Button styling**: Same style as "Continue" button used throughout onboarding flow
  - **Button state**: Always enabled (no validation required - user can proceed even if some symptoms are empty)
  - **No confirmation dialog** - keep flow smooth, proceed directly to next step
  - **Retry button styling**: On error screens, "Retry" button uses same style as "Continue" button
- Progress indicator shows "Review" or "Step 1 of 5" (depending on onboarding flow)
- **No ability to go back to edit narrative answers** - flow is one-way
- **No changes allowed to narrative answers after extraction** - only extracted symptom data can be edited

### 3. Standardized Form Structure

The AI will extract data for the following 32 symptoms, each mapped to one of three values:
- **Daily**: Symptom occurs daily or very frequently
- **Some**: Symptom occurs sometimes or occasionally
- **None**: Symptom does not occur or is not present

**Symptom List (All 32 Required - in order as listed):**
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

**Note:** All 32 symptoms are required fields. If AI cannot extract a clear answer, the field will be left empty and user can manually select a value. No additional data beyond these 32 symptoms will be extracted.

**Symptom Key Format:**
- Use kebab-case for JSON keys (e.g., `"sadness-depressed-mood"`, `"temper-outbursts"`, `"short-attention-span"`)
- Keys should be lowercase with hyphens separating words

### 4. AI Integration

**OpenAI API Setup:**
- Create Next.js API route: `app/api/extract-symptoms/route.js` (server-side API route within the UI project)
- This is the **only API endpoint** in this flow - no backend API for storing data
- Use **GPT-3.5-turbo** for cost-effective extraction (user has API key configured)
- Implement structured output (JSON mode) to ensure consistent response format
- **Request validation**: Validate request body structure before calling OpenAI
- **Timeout handling**: Set 60-second timeout for API requests
- **Rate limiting**: Implement rate limiting on API route (e.g., max 10 requests per minute per IP) to prevent abuse
- **Logging**: Log extraction requests for debugging/analytics (without storing PHI - only metadata like timestamp, model used, success/failure, request duration)
- **Server-side only**: API route runs on server, OpenAI API key never exposed to client

**Prompt Engineering:**
- **System prompt**: 
  - Context: Child mental health assessment for past 2 weeks
  - Define extraction task: Map narrative responses to 32 standardized symptoms
  - Include symptom list with clear definitions
  - Specify output format: JSON with kebab-case keys
  - **Include examples** of how to map narrative responses to symptoms (e.g., "cries every day" → "Daily" for sadness, "sometimes gets upset" → "Some" for temper outbursts)
  - **Ambiguous cases**: When uncertain between "Some" and "Daily", default to "Some". When uncertain between "Some" and "None", use balanced judgment but slightly conservative (prefer "None" when truly unclear)
  - **Conservative approach**: When truly uncertain, prefer "None" over "Some", and "Some" over "Daily" to avoid false positives
- **User prompt**: Include all 5 narrative responses in structured format
- **Response format**: JSON object with symptom keys (kebab-case) and "Daily"/"Some"/"None" values
- **Validation**: Ensure all 32 symptom keys are present in response (empty string allowed if cannot extract)

**Error Handling:**
- **Response validation** (before API call):
  - Too short (< 10 chars): "Please provide at least 10 characters"
  - Too long (> 5000 chars): "Response must be 5,000 characters or less"
- **Network errors**: "Unable to connect. Please check your internet connection and try again." with "Retry" button
- **API errors** (rate limits, service unavailable): "Service temporarily unavailable. Please try again in a moment." with "Retry" button
- **Timeout errors** (> 60 seconds): "Request took too long. Please try again." with "Retry" button
- **Invalid responses**: 
  - Validate JSON structure and required fields
  - **Validate all 32 symptom keys are present** in response (log warning if missing, use empty string)
  - **Validate symptom keys** - if AI returns invalid keys (not in our list), log error, ignore invalid keys, use empty string for those symptoms
  - **Validate symptom values** - only allow "Daily", "Some", "None", or empty string (sanitize invalid values to empty string)
  - If invalid: "Unable to process responses. Please try again." with "Retry" button
- **localStorage unavailable + extraction fails**: Show error message "Unable to save your progress. Please try again." with "Retry" button, allow continuation with in-memory storage only
- **No manual fallback** - if extraction fails, show error and allow retry
- All error messages should be user-friendly and actionable

**Cost Considerations:**
- Cache extraction results to avoid re-processing
- Use streaming for better UX (optional)
- Monitor token usage and costs

### 5. Data Structure

**New Context State:**
```javascript
{
  extractedSymptoms: {
    "sadness-depressed-mood": "Daily" | "Some" | "None" | "",
    "temper-outbursts": "Daily" | "Some" | "None" | "",
    "withdrawn-or-isolated": "Daily" | "Some" | "None" | "",
    // ... all 32 symptoms in order (empty string if AI couldn't extract)
  },
  extractionMetadata: {
    extractedAt: timestamp,
    model: "gpt-3.5-turbo"
    // Note: Confidence scores stored internally but not shown to user
  }
}
```

**Symptom Key Mapping (kebab-case):**
- All 32 symptoms mapped to kebab-case keys (e.g., "short-attention-span-difficulty-concentrating", "appetite-increase-or-decrease-feeding-or-eating-problems")

**Data Storage:**
- **No backend storage** - this is a UI-only flow
- Extracted symptom data is stored **only** in client-side state (OnboardingContext) and localStorage
- **No symptom data is persisted to any backend** - data exists only in the browser
- The only API endpoint is the Next.js API route `/api/extract-symptoms` which calls OpenAI (server-side API route within the UI project)
- OpenAI API calls are made server-side via Next.js API route for security (API key never exposed to client)

**Migration:**
- **Replace** existing `surveyAnswers` structure completely
- Narrative answers are **not stored** - only extracted symptom data is persisted
- New data replaces old structure in `OnboardingContext`
- **localStorage handling**: If localStorage is full or unavailable, gracefully degrade to in-memory storage only (show warning to user)

### 6. Component Changes

**IntakeSurvey.jsx Updates:**
- Remove all existing question logic and screen navigation
- Implement 3-phase flow: Questions → Processing → Review
- Add OpenAI API integration
- Create standardized form display component
- Add inline editing capability for extracted answers

**New Components:**
- `SymptomReviewForm.jsx`: Separate component file for displaying extracted symptoms in editable format (better organization and reusability)
- **Question screens**: Implement as one component (`IntakeSurvey.jsx`) with state-driven rendering (simpler, single source of truth)
- **Loading state**: Inline in `IntakeSurvey.jsx` (no separate component needed)
- **Shared components**: Use existing components (Button, ProgressIndicator) where possible; create new `CharacterCounter` component if needed for reusability

**Context Updates:**
- Replace `surveyAnswers` with `extractedSymptoms` structure
- **Narrative answer storage**: Store in component state only (not in context) during active session, cleared immediately after extraction completes
- **Extracted symptoms storage**: Store in context immediately after extraction completes (before user reviews/edits)
- Add setters for extracted symptom data
- Maintain localStorage persistence for extracted symptoms only
- Update step navigation to make intake survey Step 1 (currently Step 4)
- **Progress indicator update**: Update main onboarding flow progress indicator to reflect intake as Step 1
- **Scheduling Assistant integration**: Scheduling Assistant is independent and does not require symptom data (no changes needed to that component)
- **Existing components**: May need minor updates to Button, ProgressIndicator components if new props needed, but should work with existing design system
- **Browser navigation handling**:
  - If user closes browser during question entry: Auto-save in-progress answers to localStorage (temporary, cleared after extraction)
  - If user closes browser during AI processing: On return, show error and allow retry (don't auto-retry)
  - **Browser back button**: Show warning dialog "Are you sure you want to go back? Your progress may be lost." with "Cancel" and "Go Back" options
  - **Partial completion restore**: If user returns with partially completed questions, restore in-progress answers from localStorage (graceful restoration)
  - **Navigation warning**: Show warning if user tries to navigate away during question entry ("You have unsaved changes. Are you sure you want to leave?")
  - **Restore behavior**: If user edits symptoms and closes browser, restore AI-extracted values (not user edits) on return - user edits are only persisted if they complete the flow
  - **Multiple tabs**: Allow multiple tabs, but show warning if same session detected in another tab (use localStorage flag to detect)
  - **No localStorage support**: If browser doesn't support localStorage, gracefully degrade to in-memory storage only (show subtle warning, allow continuation)
  - **No session timeout** - user can take as long as needed on each question

### 7. Implementation Steps

**Step 1: UI Flow Implementation**
1. Update `IntakeSurvey.jsx` to remove existing question flow
2. Create narrative question form screens (one question per screen, 5 screens total)
3. Add validation: all questions required, 10-5000 character limit per question
4. Implement navigation with "Previous" button (questions 2-5) and "Next"/"Continue" buttons
5. Add character counter below each text area (format: "4,234 / 5,000 characters")
6. Add placeholder text or hints in text areas (optional, based on design)
7. Update progress indicator logic (show current question number)
8. Implement browser navigation handling (back button, page close scenarios)
9. Test UI flow and state management

**Step 2: OpenAI Integration**
1. Install OpenAI SDK: `npm install openai`
2. Create API route `/api/extract-symptoms` for symptom extraction
3. Implement request body validation before API call
4. Design and test prompt engineering
5. Implement error handling with user-friendly messages and retry functionality
6. Add loading states with progress steps ("Analyzing...", "Extracting symptoms...", "Finalizing...")
7. Implement 60-second timeout handling
8. Add request logging (metadata only, no PHI)

**Step 3: Standardized Form Display**
1. Create symptom review form component
2. Implement inline editing with dropdown selects for symptom values
3. Add auto-save functionality (debounced, ~500ms) - no explicit save button needed
4. Organize symptoms by category with section headers (always visible, subtle styling)
5. Style to match existing design system exactly (use existing Button, ProgressIndicator components)
6. Implement empty symptom highlighting (visual distinction for unfilled symptoms)
7. Add summary count display at top of form
8. Implement visual confirmation (checkmark icon) for auto-save
9. Test form validation and data persistence (localStorage only)

**Step 4: Testing & Refinement**
1. Test with various narrative response styles
2. **Sample test cases**: Create test suite with diverse narrative responses covering:
   - Short responses (minimum 10 characters)
   - Long responses (near 5000 character limit)
   - Responses with clear symptom indicators
   - Ambiguous responses requiring judgment
   - Responses with multiple symptoms mentioned
3. Validate AI extraction accuracy (target: 80%)
4. Test error scenarios and edge cases (network failures, API errors, localStorage issues)
5. Test browser navigation scenarios (back button, page close, refresh)
6. **Testing approach**: 
   - **Unit tests**: Test individual components (CharacterCounter, SymptomReviewForm, validation logic)
   - **Integration tests**: Test complete flow (question entry → extraction → review → navigation)
   - **Browser support**: Target modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
7. Gather user feedback on UX
8. Refine prompts based on extraction quality
9. **Analytics implementation**: Track basic metrics (console logging only for now):
   - Time spent on each question
   - Number of retries on API calls
   - Which symptoms are most commonly edited
   - Extraction accuracy metrics (if validation data available)
   - Form completion rate
   - **Logging detail**: Metadata only (timestamp, model used, success/failure, request duration) - no PHI
   - **Error tracking**: Console logging only (no external error tracking service)

### 8. Technical Considerations

**Dependencies:**
- Add `openai` package to `package.json`
- Ensure Next.js API routes are properly configured

**Environment Variables:**
- `OPENAI_API_KEY`: Required for API calls (user has key configured)
- Store in `.env.local` file (not committed to version control)
- Document in `.env.example` (without actual key value)
- Never expose in client-side code
- **Development vs Production**: Same behavior in both environments (no mock responses in dev)
- **No additional environment-specific configurations** - only API key needed

**Performance:**
- Debounce auto-save for narrative answers (during question entry)
- Debounce auto-save for symptom edits (on review form)
- Optimize API calls (single request with all answers)
- **Request deduplication**: Prevent multiple simultaneous extraction requests (disable "Continue" button during processing, track in-flight requests)
- **Request cancellation**: Cancel extraction request if user navigates away during processing (use AbortController)
- **No caching of extraction results** - not needed since flow is one-way and data is stored in context/localStorage
- Implement request timeout handling (60 seconds)

**Accessibility:**
- Ensure text areas are keyboard navigable
- Add proper ARIA labels for all form elements
- Maintain focus management during flow transitions
- Ensure dropdown selects are keyboard accessible
- Add ARIA live regions for loading states and error messages
- **Error announcements**: Announce errors immediately via ARIA live regions (not just on focus)
- **Skip links**: Implement skip links for keyboard navigation between major sections (questions, review form)
- Character counter should be announced to screen readers
- **Standard ARIA practices**: Follow WCAG 2.1 AA guidelines
- **Translation**: English-only for initial implementation (no i18n support needed initially)

**Security & HIPAA Compliance:**
- Validate API responses before storing
- Sanitize user input
- Never expose API keys in client code
- **HIPAA Considerations:**
  - Narrative answers are not stored (only extracted symptom data)
  - Ensure OpenAI API calls are made server-side only (via Next.js API routes)
  - Consider OpenAI Business Associate Agreement (BAA) for HIPAA compliance
  - Implement proper data encryption in transit (HTTPS)
  - Extracted symptom data stored in localStorage (client-side only, not persisted to backend)
  - Follow minimum necessary principle - only extract required symptom data
  - **Note**: Since this is a UI-only flow with no backend storage, data exists only in the browser session

### 9. Success Metrics

- User completion rate increases (easier flow)
- Time to complete decreases (fewer questions)
- **AI extraction accuracy target: 80%** (symptoms correctly mapped to Daily/Some/None)
- Data quality maintained (AI extraction accuracy)
- User satisfaction with conversational approach
- Reduction in form abandonment

### 10. Clinical Review & Assessment Format

**Clinical Review Process:**
- Extracted symptom data is available in the UI for review (stored in client-side state/localStorage)
- Clinicians/users can review the standardized form with Daily/Some/None values
- No narrative answers are stored, so review is based solely on extracted symptom data
- **Note**: This is a UI flow only - symptom data is not persisted to any backend system

**Assessment Format:**
- Standardized form displays all 32 symptoms in organized categories (same order as listed)
- Each symptom clearly shows its extracted value (Daily/Some/None)
- Form matches standard clinical assessment format for mental health intake
- Editable fields allow clinicians or users to make corrections if needed
- Auto-save ensures no data loss during editing
- **Spacing/Layout**: 
  - Standard spacing between symptoms: 16px vertical spacing (consistent with design system)
  - Consistent padding within category sections: 16px horizontal padding
  - **Form width**: Maximum width container (e.g., max-w-4xl or max-w-5xl) for better readability, centered on page
- **Category header styling**: 
  - Subtle background color: #F3F4F6 (light gray, consistent with design system)
  - Border: 1px solid #E5E7EB (subtle border to distinguish sections)
- **Empty symptom styling**: 
  - Background color: #FEF3C7 (light yellow/amber)
  - Border: 1px solid #FCD34D (slightly darker yellow)
  - Optional: Warning icon (⚠️) to indicate needs attention
- **Success checkmark color**: #10B981 (green, consistent with success states)
- **Font sizes** (follow existing design system):
  - Question text: text-lg (18px)
  - Symptom labels: text-base (16px)
  - Category headers: text-xl (20px), font-semibold
  - Character counter: text-sm (14px)

**Navigation After Review:**
- After user clicks "Continue" on review form, proceed directly to Scheduling Assistant
- This completes Step 1 of the onboarding process

### 11. Future Enhancements

- Provide examples of good narrative responses to guide users
- Add ability to upload additional context documents
- Support multiple languages
- Enhanced prompt engineering based on accuracy feedback
- Analytics dashboard for tracking extraction accuracy over time

