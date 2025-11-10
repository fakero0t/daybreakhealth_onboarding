# Daybreak Health Parent Onboarding App - Implementation Task List

This document breaks down the PRD into pull request-sized implementation tasks that can be executed in order.

---

## Task 1: Project Setup and Foundation

**PR Title**: `feat: Initialize Next.js project with App Router and base configuration`

**Description**: Set up the Next.js project foundation with all required dependencies and base structure.

**Implementation Details**:
- Initialize Next.js project (latest stable version) with App Router
- Configure JavaScript (not TypeScript)
- Install and configure Tailwind CSS
- Set up project structure:
  ```
  /app
  /components
    /onboarding
    /shared
  /lib
  /public
  ```
- Install dependencies:
  - Next.js (latest stable)
  - React
  - Tailwind CSS
  - FontAwesome or Heroicons (whichever is easier)
- Configure Tailwind with responsive breakpoints:
  - Mobile: < 640px
  - Tablet: 640px-1024px
  - Desktop: > 1024px
- Set up Google Fonts integration (Inter or Poppins for headings)
- Create base layout component
- Configure ESLint and basic code formatting
- Add `.gitignore` for Next.js

**Acceptance Criteria**:
- [ ] Next.js project initializes successfully
- [ ] Tailwind CSS is configured and working
- [ ] Project structure matches specification
- [ ] Dependencies are installed
- [ ] Base layout component exists
- [ ] Google Fonts are loaded

---

## Task 2: Design System Constants

**PR Title**: `feat: Create design system constants and theme configuration`

**Description**: Establish the design system foundation with color palette, typography, and spacing constants.

**Implementation Details**:
- Create `/lib/constants/design-system.js` with:
  - Color palette (no specific hex codes, use semantic names):
    - Primary (calming blue/teal)
    - Secondary (warm accent)
    - Success (soft green)
    - Informational (blue)
    - Warning/Attention (amber)
    - Neutral (grays)
  - Typography:
    - Font families (headings and body)
    - Font sizes (minimum 16px body, 24px+ headings)
  - Spacing scale (consistent padding/margins)
  - Maximum content width (680-800px)
  - Transition durations (200-300ms)
- Configure Tailwind theme to use these constants
- Create utility functions for consistent spacing
- Document design system usage

**Acceptance Criteria**:
- [ ] Design system constants file created
- [ ] Colors defined with semantic names
- [ ] Typography system configured
- [ ] Spacing scale established
- [ ] Tailwind theme uses constants
- [ ] Constants are importable and usable

---

## Task 3: State Management Context and Utilities

**PR Title**: `feat: Implement state management context and localStorage persistence`

**Description**: Create the global state management system for onboarding flow state and persistence.

**Implementation Details**:
- Create `/lib/context/OnboardingContext.jsx`:
  - Current step/position in onboarding flow (1-5)
  - Survey answers (question ID → answer mapping)
  - Insurance upload status (both files uploaded: yes/no)
  - FAQ open/closed state
- Implement state persistence using localStorage:
  - Save state on every change
  - Restore state on page load (seamless, no resume message)
  - Handle localStorage disabled gracefully
- Create utility functions:
  - `saveToLocalStorage(key, value)`
  - `loadFromLocalStorage(key)`
  - `clearOnboardingState()` (for future use)
- Implement browser history management:
  - Use `history.pushState`/`history.replaceState` for step navigation
  - Handle browser back button to navigate between steps
  - Update URL state (optional, for better UX)
- Create custom hooks:
  - `useOnboardingState()` - access global state
  - `useStepNavigation()` - handle step transitions

**Acceptance Criteria**:
- [ ] OnboardingContext created and working
- [ ] State persists to localStorage
- [ ] State restores on page refresh seamlessly
- [ ] Browser back button navigates between steps
- [ ] Custom hooks are functional
- [ ] Handles localStorage disabled gracefully

---

## Task 4: Shared Button Component

**PR Title**: `feat: Create accessible Button component with design system`

**Description**: Build a reusable, accessible Button component following design system guidelines.

**Implementation Details**:
- Create `/components/shared/Button.jsx`:
  - Variants: primary, secondary, outline, text
  - Sizes: small, medium, large
  - States: default, hover, focus, disabled, loading
  - Props: `children`, `onClick`, `variant`, `size`, `disabled`, `loading`, `type`, `ariaLabel`
- Accessibility features:
  - Visible focus indicators (distinct focus states)
  - ARIA labels support
  - Keyboard accessible (Enter/Space)
  - Disabled state properly announced
- Design requirements:
  - Adequate padding for tactile feel
  - Clear boundaries
  - Smooth transitions (200-300ms)
  - Minimum 3:1 contrast ratio
  - Minimum touch target size (44x44px on mobile)
- Support loading state with spinner
- Responsive design (mobile-first)

**Acceptance Criteria**:
- [ ] Button component created with all variants
- [ ] All accessibility requirements met
- [ ] Focus states are visible and distinct
- [ ] Loading state works correctly
- [ ] Responsive on all screen sizes
- [ ] Follows design system colors/spacing

---

## Task 5: Progress Indicator Component

**PR Title**: `feat: Create ProgressIndicator component for step tracking`

**Description**: Build a progress indicator that shows step number, percentage, and is not clickable.

**Implementation Details**:
- Create `/components/shared/ProgressIndicator.jsx`:
  - Display format: "Step X of 5" (for main flow)
  - Display format: "Question X of Y" (for survey, where Y accounts for conditional questions)
  - Linear progress bar showing percentage completion
  - Props: `currentStep`, `totalSteps`, `percentage`, `label` (optional)
- Visual design:
  - Subtle on landing page (not prominent)
  - Clear and visible on other steps
  - Progress bar fills based on percentage
  - Accessible colors (meet contrast requirements)
- Accessibility:
  - ARIA labels: `aria-label="Step X of Y"`
  - Progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - Screen reader announces progress
- Not clickable (as per PRD)
- Responsive design

**Acceptance Criteria**:
- [ ] ProgressIndicator component created
- [ ] Shows step number and percentage correctly
- [ ] Linear progress bar displays accurately
- [ ] Accessible to screen readers
- [ ] Not clickable
- [ ] Responsive design
- [ ] Subtle on landing page

---

## Task 6: File Upload Component

**PR Title**: `feat: Create accessible FileUpload component with drag-and-drop`

**Description**: Build a reusable file upload component with drag-and-drop, preview, and validation.

**Implementation Details**:
- Create `/components/shared/FileUpload.jsx`:
  - Props: `label`, `accept`, `maxSize`, `onFileSelect`, `onFileRemove`, `preview`, `error`, `required`
  - Support drag-and-drop and click-to-browse
  - File validation:
    - File type validation (JPEG, PNG, PDF)
    - File size validation (10MB max)
    - Show specific error messages inline below input
  - File preview:
    - Images: Show thumbnail (150px x 100px, maintain aspect ratio)
    - PDFs: Show filename
  - Remove/replace functionality (handle immediately, no confirmation)
  - Empty state messaging encouraging user to submit their insurance card
- Accessibility:
  - Proper label association
  - Error messages announced to screen readers
  - Keyboard accessible
  - Focus management
  - ARIA labels for drag-and-drop area
- Error messages (specific):
  - "This file is too large. Please upload a file that is 10MB or smaller."
  - "This file type is not supported. Please upload a JPEG, PNG, or PDF file."
  - "We couldn't upload your file. Please try again or contact support if the problem continues."
- Visual design:
  - Clear drag-and-drop area
  - Visual feedback on drag over
  - Preview area with remove button
  - Error styling (amber/warning color)

**Acceptance Criteria**:
- [ ] FileUpload component created
- [ ] Drag-and-drop works
- [ ] Click-to-browse works
- [ ] File validation works (type and size)
- [ ] Error messages display correctly
- [ ] Preview works for images and PDFs
- [ ] Remove functionality works
- [ ] Fully accessible
- [ ] Responsive design

---

## Task 7: Question Card Component

**PR Title**: `feat: Create QuestionCard component for survey questions`

**Description**: Build a reusable component for displaying survey questions with different input types.

**Implementation Details**:
- Create `/components/shared/QuestionCard.jsx`:
  - Support multiple question types:
    - Multiple choice (radio buttons)
    - Checkboxes (multiple selection)
    - Rating scale (1-5 radio buttons with labels)
    - Text input (for "Other" options)
    - Text area (4 rows, 500 char max with character counter display)
  - Props: `question`, `type`, `options`, `value`, `onChange`, `required` (always false)
  - All applicable questions must include "Prefer not to answer" option
  - Conditional "Other" text input:
    - Show when "Other" option is selected
    - Optional text input field
  - Accessibility:
    - Proper label association
    - Fieldset/legend for groups
    - ARIA labels
    - Keyboard navigation
    - Screen reader support
  - Visual design:
    - Clear, empathetic formatting
    - Generous spacing
    - Accessible colors
    - Clear focus states
- Handle all question types from PRD:
  - Multiple choice with "Prefer not to answer" option
  - Checkboxes with "Prefer not to answer" option
  - Rating scale (1-5) with labels: 1 (Mild), 2, 3, 4, 5 (Severe)
  - Text areas with character limit display (show "X/500 characters" counter)
  - All applicable questions must include "Prefer not to answer" option

**Acceptance Criteria**:
- [ ] QuestionCard component created
- [ ] Supports all question types
- [ ] "Other" option shows text input when selected
- [ ] Text areas have 4 rows and 500 char limit
- [ ] Rating scale displays with labels
- [ ] Fully accessible
- [ ] Responsive design
- [ ] Follows design system

---

## Task 8: FAQ/Chatbot Component

**PR Title**: `feat: Create FAQ/Chatbot bubble component`

**Description**: Build the persistent FAQ/Chatbot component that appears throughout the flow.

**Implementation Details**:
- Create `/components/shared/FAQChatbot.jsx`:
  - Position: Fixed bottom-right corner
  - Collapsed state: Shows "Have questions?" text with expand icon
  - Expanded state: Shows all 6 questions as clickable headings
  - Clicking a question expands its answer below
  - Multiple answers can be open at once
  - "Close" button to collapse entire FAQ
  - Persist open/closed state in context (optional, can reset on refresh)
- FAQ Content (from PRD):
  - All 6 questions and answers as specified
  - Display in expandable accordion format
- Accessibility:
  - Keyboard accessible (Tab, Enter, Escape)
  - ARIA labels for expand/collapse
  - Screen reader announces state changes
  - Focus management
  - Proper heading structure
- Visual design:
  - Smooth expand/collapse animations (200-300ms)
  - Clear visual hierarchy
  - Accessible colors
  - Responsive (adjusts position/size on mobile)
- Integration:
  - Use OnboardingContext for state
  - Persist across all screens

**Acceptance Criteria**:
- [ ] FAQChatbot component created
- [ ] Collapsed/expanded states work
- [ ] All 6 Q&A pairs display correctly
- [ ] Multiple answers can be open
- [ ] Close button works
- [ ] Fully accessible
- [ ] Smooth animations
- [ ] Responsive design
- [ ] Persists across screens

---

## Task 9: Survey Mock Data Structure

**PR Title**: `feat: Create survey questions mock data structure`

**Description**: Define the complete survey questions data structure with all 13 questions and metadata.

**Implementation Details**:
- Create `/lib/constants/survey-questions.js`:
  - Define all 13 questions with:
    - Question ID
    - Question text
    - Question type
    - Options array
    - Category (Basic Information, Symptoms & Concerns, History, Goals)
    - Conditional logic (for Q10)
    - Screen grouping (which screen each question appears on)
  - Question 10 conditional logic:
    - Only show if Q9 answer is "Yes"
    - Skip if Q9 is "No" or "Prefer not to answer"
  - Calculate applicable question count (accounts for conditional)
  - Question grouping by screen (10 screens total including intro and summary)
- Create utility functions:
  - `getApplicableQuestions(answers)` - returns questions that should be shown
  - `getQuestionByScreen(screenNumber)` - returns questions for a screen
  - `getTotalApplicableQuestions(answers)` - calculates total for progress
- Structure should be easy to iterate and render

**Acceptance Criteria**:
- [ ] All 13 questions defined with complete metadata
- [ ] Conditional logic for Q10 implemented
- [ ] Screen grouping defined correctly
- [ ] Utility functions work correctly
- [ ] Data structure is easy to use
- [ ] "Other" options identified for conditional text inputs

---

## Task 10: Landing Page Component

**PR Title**: `feat: Implement Landing Page with hero section and CTA`

**Description**: Build the landing page with welcoming content and navigation to next step.

**Implementation Details**:
- Create `/components/onboarding/LandingPage.jsx`:
  - Hero section:
    - Warm, welcoming headline
    - Supportive messaging: "We're here to support you and your child every step of the way."
  - Value propositions (3-4 key benefits):
    - Expert care
    - Convenient scheduling
    - Insurance support
    - Personalized approach
  - Clear CTA button: "Get Started" or "Begin Onboarding"
  - Progress indicator: "Step 1 of 5" (subtle, not prominent)
  - FAQ/Chatbot bubble (persistent)
- Content requirements:
  - Warm and welcoming tone
  - Acknowledge emotional journey
  - Provide reassurance
- Design:
  - Clean, minimal design
  - Warm color palette
  - Accessible typography (minimum 16px body)
  - Mobile-first responsive
  - Maximum content width (680-800px)
- Functionality:
  - CTA button navigates to insurance upload screen
  - Integrates with OnboardingContext
  - Updates step in state

**Acceptance Criteria**:
- [ ] LandingPage component created
- [ ] Hero section displays correctly
- [ ] Value propositions shown (3-4)
- [ ] CTA button works and navigates
- [ ] Progress indicator shows "Step 1 of 5" (subtle)
- [ ] FAQ bubble is present
- [ ] Responsive design
- [ ] Accessible
- [ ] Follows design system

---

## Task 11: Insurance Upload Screen

**PR Title**: `feat: Implement Insurance Upload screen with file handling`

**Description**: Build the insurance upload screen with two file inputs, validation, and processing.

**Implementation Details**:
- Create `/components/onboarding/InsuranceUpload.jsx`:
  - Two separate FileUpload components:
    - "Front of Insurance Card"
    - "Back of Insurance Card"
  - Both support drag-and-drop and click-to-browse
  - Both can accept files simultaneously
  - Submit button:
    - Enabled only when both files uploaded
    - Disabled with loading spinner during processing
  - Progress indicator: "Step 2 of 5"
  - FAQ/Chatbot bubble (persistent)
  - Empty state messaging: Encouraging message prompting user to submit their insurance card (displayed when no files uploaded)
- File handling:
  - Store file references in state (not actual file data)
  - Show thumbnails for images (150px x 100px)
  - Show filename for PDFs
  - Remove/replace functionality (immediate, no confirmation)
- Validation:
  - File type: JPEG, PNG, PDF only
  - File size: 10MB max per file
  - Both files required before submission
  - Error messages inline below respective input
  - No validation for wrong file placement (users can fix manually)
- Loading state:
  - Show spinner during 2-3 second processing delay
  - Replace submit button with spinner
  - Announce loading to screen readers (aria-live)
- Mock processing:
  - Simulate 2-3 second delay
  - Always return insurance approved
  - Navigate to results screen on success
- State management:
  - Save upload status to context/localStorage
  - Persist on refresh

**Acceptance Criteria**:
- [ ] InsuranceUpload component created
- [ ] Two file inputs work correctly
- [ ] Drag-and-drop works for both
- [ ] File validation works (type and size)
- [ ] Error messages display inline
- [ ] Preview works (thumbnails and filenames)
- [ ] Submit button enables only when both uploaded
- [ ] Loading spinner works during processing
- [ ] Mock processing returns approved result
- [ ] Navigates to results screen
- [ ] State persists
- [ ] Fully accessible
- [ ] Responsive design

---

## Task 12: Insurance Verification Results Screen

**PR Title**: `feat: Implement Insurance Verification Results screen`

**Description**: Build the results screen that always shows insurance approved with supportive messaging.

**Implementation Details**:
- Create `/components/onboarding/InsuranceResults.jsx`:
  - Success status indicator (icon)
  - Result message: "Great news! Your insurance is accepted."
  - Next steps information: Brief supportive message about proceeding to intake survey
  - Encouragement to continue
  - Continue button (navigates to survey)
  - Progress indicator: "Step 3 of 5"
  - FAQ/Chatbot bubble (persistent)
- Design:
  - Positive, reassuring tone
  - Success icon (green/soft green)
  - Clear messaging
  - Accessible colors
- Functionality:
  - Continue button navigates to survey introduction
  - Updates step in context
- Content:
  - Always shows approved outcome (no conditional)
  - Supportive next steps message

**Acceptance Criteria**:
- [ ] InsuranceResults component created
- [ ] Success indicator displays
- [ ] Message shows insurance accepted
- [ ] Next steps information displays
- [ ] Continue button works
- [ ] Navigates to survey
- [ ] Progress indicator shows "Step 3 of 5"
- [ ] FAQ bubble present
- [ ] Accessible
- [ ] Responsive design

---

## Task 13: Survey Introduction Screen

**PR Title**: `feat: Implement Survey Introduction screen`

**Description**: Build the introduction screen that appears before survey questions begin.

**Implementation Details**:
- Create introduction screen as part of `/components/onboarding/IntakeSurvey.jsx`:
  - Warm welcome acknowledging important step
  - Brief overview: gathering information about child's needs
  - Time estimate: "This will take about 10-15 minutes"
  - Reassurance: all questions are optional
  - Encouragement to answer honestly
  - "Begin Survey" button
- Design:
  - Warm, supportive tone
  - Clear, minimal layout
  - Accessible typography
- Functionality:
  - "Begin Survey" button navigates to first question screen
  - Progress indicator: "Step 3 of 5" (survey counts as one step)
  - FAQ/Chatbot bubble present
- Integration:
  - Part of survey flow
  - Previous button disabled/hidden on this screen

**Acceptance Criteria**:
- [ ] Introduction screen created
- [ ] All content displays correctly
- [ ] "Begin Survey" button works
- [ ] Navigates to first question
- [ ] Previous button disabled/hidden
- [ ] Progress indicator shows correctly
- [ ] Accessible
- [ ] Responsive design

---

## Task 14: Survey Question Screens (Basic Information)

**PR Title**: `feat: Implement Survey Screen 1 - Basic Information questions`

**Description**: Build the first survey screen with Questions 1-3 (Basic Information).

**Implementation Details**:
- Create screen 1 in `/components/onboarding/IntakeSurvey.jsx`:
  - Question 1: Child's age (multiple choice)
  - Question 2: Grade level (multiple choice)
  - Question 3: Living situation (multiple choice with "Other" option)
  - All three questions on same screen
  - "Other" text input appears when "Other" selected for Q3
- Navigation:
  - Previous button disabled (on introduction screen)
  - Next button advances to Screen 2
  - Progress: "Question 1 of Y" (where Y is applicable questions)
  - Progress bar shows percentage
- State management:
  - Store answers in context
  - Persist to localStorage
  - Restore on refresh
  - Auto-save indicator (visual only, no actual saving - shows progress is being saved)
- Progress calculation:
  - Formula: answered questions / applicable questions (accounts for conditional logic)
  - Display: "Question X of Y" where Y is applicable questions
  - Progress bar shows percentage based on this calculation
- Focus management:
  - Focus moves to first question on screen load
- Design:
  - Clear, empathetic formatting
  - Generous spacing
  - Accessible
  - All questions include "Prefer not to answer" option where applicable

**Acceptance Criteria**:
- [ ] Screen 1 displays Questions 1-3
- [ ] All question types render correctly
- [ ] "Other" text input works for Q3
- [ ] Answers save to state
- [ ] Navigation works (Next button)
- [ ] Progress indicator accurate
- [ ] Focus management works
- [ ] State persists
- [ ] Accessible
- [ ] Responsive

---

## Task 15: Survey Question Screens (Symptoms & Concerns - Part 1)

**PR Title**: `feat: Implement Survey Screens 2-4 - Symptoms & Concerns questions`

**Description**: Build survey screens 2-4 covering primary concerns, duration, severity, and impact.

**Implementation Details**:
- Screen 2: Question 4 - Primary concerns (checkboxes)
  - "Other" option with text input
  - Single question for clarity
- Screen 3: Questions 5-6 - Duration and severity
  - Question 5: How long (multiple choice)
  - Question 6: Severity rating (1-5 radio buttons with labels)
- Screen 4: Question 7 - Impact on daily functioning (multiple choice)
  - Single question
- Navigation:
  - Previous/Next buttons work
  - Progress updates correctly (answered / applicable questions)
  - Focus management on transitions
- State:
  - All answers persist
  - Conditional logic for "Other" options
  - Auto-save indicator (visual only)
- Design:
  - All questions include "Prefer not to answer" option where applicable

**Acceptance Criteria**:
- [ ] Screen 2 displays Question 4 correctly
- [ ] Screen 3 displays Questions 5-6 correctly
- [ ] Screen 4 displays Question 7 correctly
- [ ] Rating scale (1-5) displays with labels
- [ ] "Other" text inputs work
- [ ] Navigation works
- [ ] Progress accurate
- [ ] State persists
- [ ] Accessible
- [ ] Responsive

---

## Task 16: Survey Question Screens (History)

**PR Title**: `feat: Implement Survey Screens 5-7 - History questions with conditional logic`

**Description**: Build survey screens 5-7 covering history questions, including conditional logic for medications.

**Implementation Details**:
- Screen 5: Question 8 - Previous mental health services (multiple choice)
- Screen 6: Questions 9-10 - Medications (with conditional logic)
  - Question 9: Is child taking medications? (multiple choice)
  - Question 10: Medication description (text area, 4 rows, 500 chars)
    - Only show if Q9 = "Yes"
    - Skip entirely if Q9 = "No" or "Prefer not to answer"
    - Adjust progress calculation accordingly
- Screen 7: Question 11 - School support services (multiple choice)
- Conditional logic implementation:
  - Check Q9 answer to determine if Q10 should show
  - Update applicable question count
  - Update progress calculation
  - Handle navigation (skip Q10 if not applicable)
- Navigation:
  - Previous/Next work correctly
  - Progress accounts for conditional questions (answered / applicable questions)
  - Focus management
- State:
  - Auto-save indicator (visual only)
- Design:
  - All questions include "Prefer not to answer" option where applicable

**Acceptance Criteria**:
- [ ] Screen 5 displays Question 8 correctly
- [ ] Screen 6 displays Questions 9-10 with conditional logic
- [ ] Q10 only shows when Q9 = "Yes"
- [ ] Q10 is skipped when Q9 = "No" or "Prefer not to answer"
- [ ] Progress calculation accounts for conditional
- [ ] Screen 7 displays Question 11 correctly
- [ ] Navigation works correctly with conditional
- [ ] State persists
- [ ] Accessible
- [ ] Responsive

---

## Task 17: Survey Question Screens (Goals)

**PR Title**: `feat: Implement Survey Screens 8-9 - Goals questions`

**Description**: Build survey screens 8-9 covering goals questions.

**Implementation Details**:
- Screen 8: Question 12 - Goals (checkboxes)
  - "Other" option with text input
  - Single question for clarity
- Screen 9: Question 13 - Specific areas to focus on (text area)
  - 4 rows, maximum 500 characters
  - Single question
- Navigation:
  - Previous/Next buttons
  - Next button on Screen 9 goes to Summary
  - Progress updates (answered / applicable questions)
- State:
  - Answers persist
  - "Other" text input works
  - Auto-save indicator (visual only)
- Design:
  - Text area shows character counter (X/500 characters)
  - All questions include "Prefer not to answer" option where applicable

**Acceptance Criteria**:
- [ ] Screen 8 displays Question 12 correctly
- [ ] "Other" text input works for Q12
- [ ] Screen 9 displays Question 13 correctly
- [ ] Text area has 4 rows and 500 char limit
- [ ] Navigation works
- [ ] Progress accurate
- [ ] State persists
- [ ] Accessible
- [ ] Responsive

---

## Task 18: Survey Summary Screen

**PR Title**: `feat: Implement Survey Summary screen with review and edit functionality`

**Description**: Build the summary screen where users can review all answers before final submission.

**Implementation Details**:
- Create summary screen in `/components/onboarding/IntakeSurvey.jsx`:
  - Display answers grouped by category:
    - Basic Information
    - Symptoms & Concerns
    - History
    - Goals
  - Show question text and selected answer(s) for each
  - Display progress: "You've answered X of Y questions"
  - "Edit" button for each category section
    - Jumps back to first question in that section
    - After editing, returns to summary
  - "Previous" button goes back to Question 13
  - "Complete Assessment" button at bottom
- Edit functionality:
  - Clicking "Edit" on a category navigates to first question of that category
  - After editing, automatically return to summary
  - Preserve all other answers
- Design:
  - Clear, organized layout
  - Easy to scan
  - Accessible
- Functionality:
  - "Complete Assessment" shows brief confirmation message: "Thank you! Your assessment has been submitted."
  - After 1-2 seconds, automatically proceeds to scheduling assistant page
  - No separate confirmation screen needed

**Acceptance Criteria**:
- [ ] Summary screen displays all answers grouped by category
- [ ] Progress shows "X of Y questions" correctly
- [ ] Edit buttons work for each category
- [ ] Navigation after editing returns to summary
- [ ] Previous button goes to Q13
- [ ] "Complete Assessment" works
- [ ] Confirmation message shows
- [ ] Auto-proceeds to scheduling
- [ ] Accessible
- [ ] Responsive

---

## Task 19: Scheduling Assistant Page

**PR Title**: `feat: Implement Scheduling Assistant completion page`

**Description**: Build the final scheduling page with mock calendar and contact information.

**Implementation Details**:
- Create `/components/onboarding/SchedulingAssistant.jsx`:
  - Congratulatory message on completing onboarding
  - Summary of next steps: Care coordinator will reach out within 1-2 business days
  - Mock calendar interface:
    - Show next 7 days (including today)
    - Time slots: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM (4 slots per day)
    - Some slots "Available" (visual indicator)
    - Some slots "Unavailable" (grayed out)
    - Clicking slots does nothing (non-functional)
  - "Schedule Your First Appointment" button (non-functional)
  - Contact options:
    - Phone: "(555) 123-4567" (mock) - clickable tel: link with "Call us" label
    - Email: "support@daybreakhealth.com" (mock) - clickable mailto: link with "Email us" label
  - Information about first session: Brief supportive message about meeting clinician, discussing goals, creating treatment plan
  - Confirmation that care coordinator will be in touch
  - Progress indicator: "Step 5 of 5"
  - FAQ/Chatbot bubble (persistent)
- Design:
  - Celebratory but not overwhelming tone
  - Clear next steps
  - Reassurance
  - Accessible

**Acceptance Criteria**:
- [ ] SchedulingAssistant component created
- [ ] Congratulatory message displays
- [ ] Next steps information shows
- [ ] Mock calendar displays with time slots
- [ ] Contact information displays with clickable links
- [ ] First session information displays
- [ ] Progress indicator shows "Step 5 of 5"
- [ ] FAQ bubble present
- [ ] All elements non-functional (mock)
- [ ] Accessible
- [ ] Responsive design

---

## Task 20: Main Onboarding Flow Integration

**PR Title**: `feat: Integrate all screens into main onboarding flow with navigation`

**Description**: Create the main app component that orchestrates the entire onboarding flow.

**Implementation Details**:
- Create `/app/page.js` (or main component):
  - Use OnboardingContext to determine current step
  - Conditionally render screens based on step:
    - Step 1: LandingPage
    - Step 2: InsuranceUpload
    - Step 3: InsuranceResults
    - Step 4: IntakeSurvey (handles all survey screens internally)
    - Step 5: SchedulingAssistant
  - Handle step transitions
  - Integrate FAQ/Chatbot (persistent across all)
  - Handle browser back button navigation
  - Restore state on page load
- Navigation logic:
  - Each screen advances to next step
  - Browser back button navigates between steps
  - State persists throughout
- Error handling:
  - Graceful handling of missing state
  - Default to step 1 if state invalid

**Acceptance Criteria**:
- [ ] Main flow component created
- [ ] All screens integrate correctly
- [ ] Step navigation works
- [ ] Browser back button works
- [ ] State restoration works
- [ ] FAQ persists across screens
- [ ] Error handling works
- [ ] Accessible
- [ ] Responsive

---

## Task 21: Accessibility Enhancements

**PR Title**: `feat: Comprehensive accessibility enhancements and WCAG 2.1 AA compliance`

**Description**: Ensure all components meet WCAG 2.1 AA accessibility standards.

**Implementation Details**:
- Visual design:
  - Verify minimum contrast ratios (4.5:1 normal text, 3:1 large text)
  - Ensure text resizable up to 200% without loss of functionality
  - Verify no information conveyed by color alone
- Keyboard navigation:
  - Test all interactive elements accessible via keyboard
  - Verify visible focus indicators on all focusable elements
  - Ensure logical tab order throughout
  - Test keyboard shortcuts work
- Screen reader support:
  - Add semantic HTML (nav, main, section, etc.)
  - Verify proper heading hierarchy (h1, h2, h3)
  - Add alt text for all images
  - Add ARIA labels for complex interactions
  - Ensure form labels properly associated
  - Verify error messages announced
  - Add aria-live regions for loading states
- Forms & inputs:
  - Verify all fields have clear, descriptive labels
  - Ensure error messages explain issue and how to fix
  - Verify no required field indicators (all optional)
- Focus management:
  - Implement focus movement on step transitions
  - Ensure focus trapped in modals (if any)
  - Verify focus visible on all interactive elements
- Testing:
  - Test with screen reader (NVDA/JAWS/VoiceOver)
  - Test keyboard-only navigation
  - Test with browser zoom at 200%

**Acceptance Criteria**:
- [ ] All contrast ratios meet WCAG 2.1 AA
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all elements
- [ ] Screen reader announces all content correctly
- [ ] Semantic HTML used throughout
- [ ] Proper heading hierarchy
- [ ] All images have alt text
- [ ] ARIA labels on complex interactions
- [ ] Error messages announced
- [ ] Loading states announced
- [ ] Focus management works
- [ ] Passes accessibility audit

---

## Task 22: Responsive Design Polish

**PR Title**: `feat: Polish responsive design for all screen sizes`

**Description**: Ensure the application works perfectly on mobile, tablet, and desktop.

**Implementation Details**:
- Mobile (< 640px):
  - Test all screens on mobile viewport
  - Ensure touch targets are adequate (44x44px minimum)
  - Verify text is readable (minimum 16px)
  - Test file upload on mobile
  - Verify FAQ bubble works on mobile
  - Test all interactions
  - Ensure progress indicator readable
- Tablet (640px-1024px):
  - Test all screens on tablet viewport
  - Verify layout adapts appropriately
  - Test all interactions
- Desktop (> 1024px):
  - Test all screens on desktop
  - Verify maximum content width (680-800px) maintained
  - Ensure proper spacing
  - Test all interactions
- Cross-browser testing:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
- Fix any layout issues:
  - Overflow problems
  - Text wrapping
  - Image scaling
  - Button sizing
  - Spacing issues

**Acceptance Criteria**:
- [ ] All screens work on mobile
- [ ] All screens work on tablet
- [ ] All screens work on desktop
- [ ] Touch targets adequate on mobile
- [ ] Text readable on all sizes
- [ ] Layout adapts correctly
- [ ] Works in all modern browsers
- [ ] No overflow issues
- [ ] No layout breaks

---

## Task 23: Micro-interactions and Transitions

**PR Title**: `feat: Add micro-interactions and smooth transitions`

**Description**: Add polish with smooth transitions and micro-interactions throughout the app.

**Implementation Details**:
- Transitions:
  - Step transitions (200-300ms)
  - Button hover states (200-300ms)
  - FAQ expand/collapse (200-300ms)
  - File upload feedback
  - Loading state transitions
- Micro-interactions:
  - Button press feedback
  - File upload drag feedback
  - Progress bar animations
  - Form input focus states
  - Error message appearance
- Performance:
  - Ensure transitions don't cause jank
  - Use CSS transitions where possible
  - Optimize animations
- Accessibility:
  - Respect `prefers-reduced-motion`
  - Disable animations if user prefers

**Acceptance Criteria**:
- [ ] Smooth transitions on step changes
- [ ] Button hover states work
- [ ] FAQ animations smooth
- [ ] File upload feedback works
- [ ] Progress bar animates
- [ ] Respects reduced motion preference
- [ ] No performance issues
- [ ] All interactions feel polished

---

## Task 24: Error Handling and Edge Cases

**PR Title**: `feat: Comprehensive error handling and edge case management`

**Description**: Handle all error cases and edge cases gracefully.

**Implementation Details**:
- File upload errors:
  - File too large: Show specific error message
  - Unsupported file type: Show specific error message
  - Upload failure: Show friendly error message
  - Handle network errors gracefully
- Navigation edge cases:
  - Browser back button works correctly
  - Page refresh restores state seamlessly
  - Invalid state handling (default to step 1)
  - Browser history management
- Form edge cases:
  - Handle very long text inputs
  - Handle special characters
  - Handle empty submissions (all optional, so allow)
- State persistence edge cases:
  - Handle localStorage disabled
  - Handle localStorage full
  - Handle corrupted state
  - Handle state from different session
- Browser compatibility:
  - Handle unsupported features gracefully
  - Provide fallbacks where needed

**Acceptance Criteria**:
- [ ] All file upload errors handled
- [ ] Error messages are specific and helpful
- [ ] Browser back button works
- [ ] Page refresh restores state
- [ ] Invalid state handled gracefully
- [ ] localStorage edge cases handled
- [ ] No console errors
- [ ] Graceful degradation

---

## Task 25: Final Testing and Documentation

**PR Title**: `feat: Final testing, code cleanup, and documentation`

**Description**: Final pass for testing, code quality, and documentation.

**Implementation Details**:
- Code cleanup:
  - Remove console.logs
  - Remove commented code
  - Ensure consistent code style
  - Add JSDoc comments where helpful
  - Verify no unused imports
  - Verify no unused variables
- Testing:
  - End-to-end user flow testing
  - Test all navigation paths
  - Test all form submissions
  - Test all error cases
  - Test state persistence
  - Test browser compatibility
  - Test accessibility with screen readers
  - Test keyboard navigation
  - Test mobile devices (if possible)
- Documentation:
  - Update README with setup instructions
  - Document component usage
  - Document state management
  - Document design system usage
- Performance:
  - Check bundle size
  - Optimize if needed
  - Verify no memory leaks
  - Check Lighthouse scores

**Acceptance Criteria**:
- [ ] Code is clean and consistent
- [ ] All user flows tested
- [ ] All edge cases tested
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Ready for review

---

## Implementation Order Summary

1. **Foundation** (Tasks 1-3): Project setup, design system, state management
2. **Shared Components** (Tasks 4-8): Reusable components (Button, ProgressIndicator, FileUpload, QuestionCard, FAQ)
3. **Mock Data** (Task 9): Survey questions structure
4. **Screen Implementation** (Tasks 10-19): All onboarding screens in order
5. **Integration** (Task 20): Main flow integration
6. **Polish** (Tasks 21-24): Accessibility, responsive design, interactions, error handling
7. **Final** (Task 25): Testing and documentation

Each task is designed to be a complete, reviewable pull request that can be merged independently while building toward the complete solution.

