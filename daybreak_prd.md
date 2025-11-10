# Daybreak Health Parent Onboarding App - Product Requirements Document

## Executive Summary

The Parent Onboarding App is a new feature developed by Daybreak Health aimed at enhancing the onboarding experience for parents seeking mental health services for their children. The solution addresses key pain points in the current process—understanding a child's mental health needs, providing insurance information, and managing parental emotions during onboarding.

## Product Vision

Create an intuitive, supportive, and streamlined onboarding experience that reduces friction, provides clarity, and empowers parents to make informed decisions about their child's mental health care.

## Primary User

**Parents of children requiring mental health services**

### User Needs
- Clarity on child's mental health requirements
- Simplified insurance submission
- Emotional support throughout the process

### User Pain Points
- Confusion about symptoms and appropriate services
- Insurance complexities and coverage uncertainty
- Emotional stress during a vulnerable time

## User Stories

1. **As a parent**, I want to assess if Daybreak Health services are suitable for my child so that I can make informed decisions about their mental health care.

2. **As a parent**, I want to submit insurance information easily so that I can quickly move forward with the onboarding process.

3. **As a parent**, I want to receive support and reassurance throughout the onboarding process so that I feel confident in the care my child will receive.

## Technical Stack

### Front-end
- **Framework**: Next.js (latest stable version, using App Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS (or CSS Modules for component-based styling)
- **UI Components**: Custom components with accessibility focus

### Key Technical Notes
- No backend implementation required for this phase
- Single-page application flow with component state management (no routing between pages)
- Mock data for all processing functions
- State persistence: Application state should be preserved on page refresh using localStorage or sessionStorage

## User Interface Flow

### 1. Landing Page
**Purpose**: Welcome parents and provide initial context

**Components**:
- Hero section with welcoming headline and supportive messaging
- Brief value proposition (3-4 key benefits)
- Clear call-to-action button to begin onboarding
- Progress indicator showing "Step 1 of 5" (subtle, not prominent)
- FAQ/Chatbot bubble (expandable, persistent throughout flow)

**Content Requirements**:
- Headline should be warm and welcoming, emphasizing support for both parent and child
- Value propositions should highlight key benefits (e.g., expert care, convenient scheduling, insurance support, personalized approach)
- CTA button text should be clear and action-oriented (e.g., "Get Started", "Begin Onboarding")
- Supporting copy should acknowledge the emotional journey and provide reassurance

**Design Considerations**:
- Clean, minimal design to reduce cognitive load
- Warm color palette to convey trust and care
- Accessible typography (minimum 16px body text)
- Mobile-first responsive design

**User Actions**:
- Click "Get Started" or similar CTA
- Access FAQ/Chatbot for questions
- Navigate to insurance upload screen

---

### 2. Insurance Upload Screen
**Purpose**: Collect and verify insurance information

**Components**:
- Clear instructions for insurance card upload
- Two separate file upload interfaces (one for front, one for back of card)
  - Each labeled clearly: "Front of Insurance Card" and "Back of Insurance Card"
  - Both support drag-and-drop and click-to-browse
  - Both can accept files simultaneously
- Preview of uploaded images (both front and back)
- Submit button (enabled only when both front and back are uploaded)
- Progress indicator showing current step
- FAQ/Chatbot bubble (persistent)
- Empty state messaging that encourages user to submit their insurance card

**Requirements**:
- Both front and back of insurance card are required before submission
- Users can upload both files at once (using either input)
- Users can remove/replace uploaded files before submitting (handle immediately, no confirmation needed)

**Supported File Types**:
- JPEG, PNG, PDF
- Maximum file size: 10MB per file

**File Preview**:
- Show thumbnails for uploaded images (JPEG, PNG) - display size: 150px x 100px (maintain aspect ratio)
- Show filename for uploaded PDFs

**Client-Side Validation** (UI only, no server validation):
- Validate file type (show specific error if unsupported type)
- Validate file size (show specific error if exceeds 10MB)
- Ensure both front and back are uploaded before allowing submission
- Error messages displayed inline below the respective file input
- No validation for wrong file placement (front vs back) - users can manually remove and re-upload if needed

**Loading State**:
- Display loading spinner during 2-3 second processing delay
- Replace submit button with loading spinner (button becomes disabled with spinner)
- Loading state must be announced to screen readers

**Mock Processing Logic**:
- Simulate 2-3 second processing delay
- Always return insurance approved result (no random outcomes)
- Display success message indicating insurance is accepted

**User Actions**:
- Upload front and back of insurance card (both required)
- Review uploaded images
- Remove/replace files if needed
- Submit for verification
- Proceed to results screen

---

### 3. Insurance Verification Results Screen
**Purpose**: Communicate insurance status clearly and supportively

**Components**:
- Clear status indicator (success icon)
- Result message in plain language
- Next steps information
- Continue button
- FAQ/Chatbot bubble (persistent)

**Result**:
- Always displays insurance approved outcome
- Positive, reassuring message: "Great news! Your insurance is accepted."
- Next steps information: Brief supportive message about proceeding to the intake survey to help understand their child's needs
- Encouragement to continue

**User Actions**:
- Review insurance status
- Access additional insurance information via FAQ/Chatbot
- Continue to intake survey

---

### 4. Clinical Intake Survey/Symptom Questionnaire
**Purpose**: Gather information about the child's mental health needs

**Components**:
- Introduction screen before questions begin (see content requirements below)
- Multi-step form with progress indicator
- Clear, empathetic question formatting
- Mix of question types:
  - Multiple choice
  - Checkboxes
  - Rating scales (1-5 scale) - displayed as radio buttons with labels (1 = Mild, 5 = Severe)
  - Optional text areas for additional context
- Previous/Next navigation (forward and backward only, no skipping ahead)
- Previous button disabled/hidden on first question
- Save progress indicator (visual only, no actual saving)
- FAQ/Chatbot bubble (persistent)

**Introduction Screen Content**:
- Warm welcome acknowledging this important step
- Brief overview of what to expect (gathering information about child's needs)
- Time estimate: "This will take about 10-15 minutes"
- Reassurance that all questions are optional
- Encouragement to answer honestly
- "Begin Survey" button to start

**Survey Structure**:
- 1-3 questions per screen
- Introduction screen before questions begin
- Question grouping by screen:
  - **Screen 1**: Questions 1-3 (Basic Information - all three questions together)
  - **Screen 2**: Question 4 (Primary concerns - checkbox list, single question for clarity)
  - **Screen 3**: Questions 5-6 (Duration and severity - related questions together)
  - **Screen 4**: Question 7 (Impact on daily functioning - single question)
  - **Screen 5**: Question 8 (Previous mental health services - single question)
  - **Screen 6**: Questions 9-10 (Medications - related, conditional logic applies)
  - **Screen 7**: Question 11 (School support services - single question)
  - **Screen 8**: Question 12 (Goals - checkbox list, single question for clarity)
  - **Screen 9**: Question 13 (Specific areas to focus on - text area, single question)
  - **Screen 10**: Summary screen (review all answers before final submission)

**Question Categories** (Mock Data):

1. **Basic Information**
   - **Question 1**: What is your child's age?
     - Type: Multiple choice
     - Options: Under 5, 5-7, 8-10, 11-13, 14-16, 17-18, Prefer not to answer
   
   - **Question 2**: What grade is your child in?
     - Type: Multiple choice
     - Options: Not in school yet, Kindergarten, 1st grade, 2nd grade, 3rd grade, 4th grade, 5th grade, 6th grade, 7th grade, 8th grade, 9th grade, 10th grade, 11th grade, 12th grade, Prefer not to answer
   
   - **Question 3**: What is your child's living situation?
     - Type: Multiple choice
     - Options: Lives with both parents, Lives with one parent, Lives with parent and step-parent, Lives with other family members, Other, Prefer not to answer
     - If "Other" is selected: Show optional text input field below for user to specify

2. **Symptoms & Concerns**
   - **Question 4**: What are your primary concerns? (Select all that apply)
     - Type: Checkboxes
     - Options: Anxiety or worry, Depression or sadness, Behavioral issues, Difficulty focusing, Social challenges, Sleep problems, Eating concerns, School performance, Family conflicts, Other, Prefer not to answer
     - If "Other" is selected: Show optional text input field below for user to specify
   
   - **Question 5**: How long have you noticed these concerns?
     - Type: Multiple choice
     - Options: Less than a month, 1-3 months, 3-6 months, 6-12 months, More than a year, Prefer not to answer
   
   - **Question 6**: On a scale of 1-5, how would you rate the severity of these concerns? (1 = mild, 5 = severe)
     - Type: Rating scale (1-5)
     - UI: Radio buttons with labels: 1 (Mild), 2, 3, 4, 5 (Severe), Prefer not to answer
     - Options: 1, 2, 3, 4, 5, Prefer not to answer
   
   - **Question 7**: How much do these concerns impact your child's daily functioning?
     - Type: Multiple choice
     - Options: Not at all, Slightly, Moderately, Significantly, Extremely, Prefer not to answer

3. **History**
   - **Question 8**: Has your child received mental health services before?
     - Type: Multiple choice
     - Options: Yes, currently receiving, Yes, in the past, No, Prefer not to answer
   
   - **Question 9**: Is your child currently taking any medications?
     - Type: Multiple choice
     - Options: Yes, No, Prefer not to answer
   
   - **Question 10**: If yes, please describe the medications (optional)
     - Type: Text area (optional)
     - Size: 4 rows, maximum 500 characters
     - Conditional logic: Only show this question on the next screen if Question 9 answer is "Yes"
     - If Question 9 is "No" or "Prefer not to answer", skip Question 10 entirely
     - Adjust total question count for progress calculation (answered questions / applicable questions)
   
   - **Question 11**: Does your child receive support services at school?
     - Type: Multiple choice
     - Options: Yes, No, Not sure, Prefer not to answer

4. **Goals**
   - **Question 12**: What do you hope to achieve through mental health services? (Select all that apply)
     - Type: Checkboxes
     - Options: Better emotional regulation, Improved school performance, Stronger family relationships, Better social skills, Reduced anxiety or stress, Improved self-esteem, Better communication, Other, Prefer not to answer
     - If "Other" is selected: Show optional text input field below for user to specify
   
   - **Question 13**: Are there specific areas you'd like to focus on?
     - Type: Text area (optional)
     - Size: 4 rows, maximum 500 characters

**Survey Summary Screen**:
- Display summary of answers grouped by category (Basic Information, Symptoms & Concerns, History, Goals)
- Show question text and selected answer(s) for each question
- Display progress: "You've answered X of Y questions" (where Y is applicable questions based on conditional logic)
- "Edit" button for each category section to jump back to first question in that section
- After editing, return to summary screen
- "Previous" button goes back to last question (Question 13)
- "Complete Assessment" button at bottom to finalize

**Validation Rules**:
- All fields are optional (no required fields)
- No validation rules needed - users can proceed with any combination of answers

**Design Considerations**:
- 1-3 questions per screen (see question grouping above)
- Progress indicator shows:
  - Main flow: "Step 3 of 5" when in survey (survey counts as one step in overall flow)
  - Within survey: "Question X of Y" where Y is applicable questions (accounts for conditional questions)
  - Progress percentage: answered questions / applicable questions (accounts for conditional logic)
  - Visual: Linear progress bar showing percentage completion
- Navigation limited to forward/backward only (no skipping to specific steps)
- Previous button disabled/hidden on first question (introduction screen)
- Ability to go back and edit previous answers
- Clear skip/prefer not to answer options where appropriate
- Auto-save indicator (visual only)
- State automatically restores on page refresh (no "resume" message needed - seamless restoration)

**Focus Management**:
- On step transitions, focus should automatically move to the first question/input on the new step

**Mock Processing Logic**:
- Store responses in component state
- Upon clicking "Complete Assessment": Show brief confirmation message ("Thank you! Your assessment has been submitted.")
- After 1-2 seconds, automatically proceed to scheduling assistant page
- No separate confirmation screen needed

**User Actions**:
- Answer questions at their own pace
- Navigate forward/backward to review/edit answers
- Skip any questions (all optional)
- Submit completed survey
- Proceed to scheduling assistant

---

### 5. Scheduling Assistant Page
**Purpose**: Guide parents to schedule their first appointment

**Components**:
- Congratulatory message on completing onboarding
- Summary of next steps: Brief message that a care coordinator will reach out within 1-2 business days to schedule the first appointment
- Mock calendar interface or scheduling CTA
- Information about what to expect in first session: Brief supportive message explaining the first session will be an opportunity to meet the clinician, discuss goals, and create a personalized treatment plan
- FAQ/Chatbot bubble (persistent)

**Mock Scheduling Elements**:
- Visual representation of appointment booking with time slots (non-functional)
  - Show next 7 days (including today)
  - Time slots: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM (4 slots per day)
  - Some slots marked "Available" (visual indicator), some "Unavailable" (grayed out)
  - Clicking slots does nothing (non-functional)
- "Schedule Your First Appointment" button (non-functional)
- Alternative contact options:
  - Phone: "(555) 123-4567" (mock) - clickable tel: link with "Call us" label
  - Email: "support@daybreakhealth.com" (mock) - clickable mailto: link with "Email us" label
- Confirmation that a care coordinator will be in touch

**Design Considerations**:
- Celebratory but not overwhelming tone
- Clear next steps
- Reassurance about the process ahead
- Easy access to support if needed

**User Actions**:
- View completion summary
- Interact with mock scheduling interface
- Access additional resources
- Complete onboarding flow

---

## Persistent UI Elements

### FAQ/Chatbot Bubble
**Purpose**: Provide just-in-time support throughout the flow

**Functionality**:
- Expandable/collapsible bubble in bottom-right corner
- Collapsed state: Shows "Have questions?" text with expand icon
- Expanded state: Shows all 6 questions as clickable headings
- Clicking a question expands its answer below
- Multiple answers can be open at once
- "Close" button to collapse the entire FAQ
- Simple Q&A mock interface (responses from predefined Q&A set)
- Accessible via keyboard navigation

**FAQ Content** (Mock Q&A):
- **Q**: What services does Daybreak Health offer?
  **A**: Daybreak Health offers comprehensive mental health services for children and adolescents, including individual therapy, family therapy, and specialized support for anxiety, depression, and behavioral challenges. Our licensed clinicians work with families to create personalized treatment plans.

- **Q**: What if my insurance isn't accepted?
  **A**: If your insurance isn't accepted, we offer flexible payment options and can work with you to find a solution that fits your family's needs. Our care coordinators can discuss payment plans and alternative options with you.

- **Q**: How long does the intake survey take?
  **A**: The intake survey typically takes about 10-15 minutes to complete. You can take your time and answer at your own pace. All questions are optional, and you can skip any that you prefer not to answer.

- **Q**: What happens after I complete onboarding?
  **A**: After completing onboarding, a care coordinator will reach out to you within 1-2 business days to discuss next steps, answer any questions, and help schedule your first appointment with a clinician who's a good fit for your child.

- **Q**: How do I know if my child needs mental health services?
  **A**: If you're noticing changes in your child's behavior, mood, school performance, or relationships that concern you, it may be helpful to speak with a mental health professional. There's no harm in seeking support, and early intervention can make a significant difference.

- **Q**: Is my information secure?
  **A**: Yes, we take your privacy and security seriously. All information you provide is kept confidential and secure. We follow HIPAA guidelines and use industry-standard security measures to protect your family's information.

---

## Accessibility Requirements (WCAG 2.1 AA Compliance)

### Visual Design
- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text and UI components
- Text resizable up to 200% without loss of functionality
- No information conveyed by color alone

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Visible focus indicators on all focusable elements
- Logical tab order throughout the interface
- Do not add skip links (skip to main content links are not required)

### Screen Reader Support
- Semantic HTML elements (nav, main, section, etc.)
- Proper heading hierarchy (h1, h2, h3)
- Alt text for all images
- ARIA labels for complex interactions
- Form labels properly associated with inputs
- Error messages announced to screen readers
- Loading states must be announced to screen readers (use aria-live regions)

### Forms & Inputs
- Clear, descriptive labels for all form fields
- Error messages that clearly explain the issue and how to fix it
- All fields are optional (no required fields, no required field indicators needed)
- Sufficient time to complete forms (no automatic timeouts)

### Content
- Plain language, avoiding jargon
- Reading level appropriate for general audience
- Clear instructions and guidance

---

## Tone & Messaging Guidelines

### Voice Characteristics
- **Warm & Empathetic**: Acknowledge the emotional weight of seeking help
- **Clear & Simple**: Use plain language, avoid medical jargon
- **Reassuring**: Provide confidence without making promises
- **Supportive**: Frame as a partnership, not a transaction
- **Non-judgmental**: No assumptions about parenting or situations

### Example Messaging

**Landing Page**:
"We're here to support you and your child every step of the way."

**Insurance Upload**:
"Let's check your insurance coverage. This will only take a moment."

**Survey Introduction**:
"Help us understand your child's needs so we can provide the best support possible. There are no wrong answers, and you can take your time."

**Completion**:
"You've taken an important step in supporting your child's mental health. Let's schedule your first appointment."

---

## Mock Data Specifications

### Insurance Processing Mock
```javascript
// Mock function returns after simulated delay
function mockInsuranceVerification(insuranceImages) {
  // Simulate processing time
  setTimeout(() => {
    // Always return insurance approved result
    return {
      status: 'accepted',
      message: 'Great news! Your insurance is accepted.',
      canProceed: true
    };
  }, 2500);
}
```

### Survey Questions Mock Data
Store predefined mock questions and answer options in component state or constants file. See detailed question list in Clinical Intake Survey section above. No validation rules required. No actual data processing or scoring required.

### Scheduling Mock
Display static scheduling interface with time slots. Display mock contact information (phone and email). No actual appointment booking functionality needed.

---

## Component Architecture

### Recommended Component Structure

```
/components
  /onboarding
    - LandingPage.jsx
    - InsuranceUpload.jsx
    - InsuranceResults.jsx
    - IntakeSurvey.jsx
    - SchedulingAssistant.jsx
  /shared
    - ProgressIndicator.jsx (shows step number and percentage, not clickable; landing page counts as step 1)
    - FAQChatbot.jsx
    - Button.jsx
    - FileUpload.jsx
    - QuestionCard.jsx
```

### State Management
- Use React hooks (useState, useEffect) for local state
- Consider useContext for global state if needed (FAQ visibility, progress tracking)
- No external state management library required
- State persistence: Use localStorage or sessionStorage (whichever is most appropriate) to persist application state on page refresh

**State Persistence Scope**:
- Current step/position in onboarding flow
- All survey answers (question ID → answer mapping)
- Insurance upload status (both files uploaded: yes/no)
- FAQ open/closed state (optional, can reset to closed on refresh)
- Do not persist: actual file data (only persist metadata that files were uploaded)

---

## Design System Recommendations

### Color Palette
- **Primary**: Calming blue or teal (trust, stability) - no specific hex codes required
- **Secondary**: Warm accent color (compassion, care) - no specific hex codes required
- **Success**: Soft green - no specific hex codes required
- **Informational**: Blue - no specific hex codes required
- **Warning/Attention**: Amber (not red, to avoid alarm) - no specific hex codes required
- **Neutral**: Grays for text and backgrounds - no specific hex codes required

### Typography
- **Font Source**: Google Fonts
- **Headings**: Clear, modern sans-serif (e.g., Inter, Poppins)
- **Body**: Highly readable sans-serif
- **Minimum sizes**: 16px body, 24px+ headings

### Spacing & Layout
- Generous white space to reduce visual stress
- Consistent padding and margins
- Maximum content width for readability (680-800px)
- Mobile-first responsive design with standard breakpoints (mobile: < 640px, tablet: 640px-1024px, desktop: > 1024px)

### Icons
- Use FontAwesome or Heroicons (whichever is easiest to implement)

### Interactive Elements
- Clear hover states
- Distinct focus states for accessibility
- Smooth transitions (200-300ms)
- Tactile feeling buttons (adequate padding, clear boundaries)

---

## Error Handling & Edge Cases

### File Upload Errors
- **File too large**: "This file is too large. Please upload a file that is 10MB or smaller."
- **Unsupported file type**: "This file type is not supported. Please upload a JPEG, PNG, or PDF file."
- **Upload failure**: "We couldn't upload your file. Please try again or contact support if the problem continues."
- **No file selected**: Empty state should encourage user to submit their insurance card

**Handling**: Display specific, friendly error messages with clear instructions on how to proceed. All validation is client-side only (no server validation).

### Form Validation
- All fields are optional (no required fields)
- No validation rules needed

**Handling**: Users can proceed with any combination of answers. All questions are optional.

### Navigation Edge Cases
- Browser back button behavior: Should navigate between steps in the onboarding flow (not exit the application). Use industry-standard browser history management (e.g., history.pushState/history.replaceState) to enable proper back button navigation.
- Accidental page refresh: State should be preserved using localStorage/sessionStorage. Automatically restore user to their previous position (no "resume" message - seamless restoration).
- Moving backward in flow: Supported via Previous button and browser back button
- No explicit exit/cancel option - users can close browser or navigate away if needed

**Handling**: Preserve state using localStorage/sessionStorage. Browser back button should navigate between steps within the onboarding flow using standard browser history management. State restoration should be seamless and automatic.

---

## Success Metrics (Future Consideration)

While not implemented in this UI-only version, the interface should be designed with these metrics in mind:

- Onboarding completion rate
- Time to complete each step
- Drop-off points
- FAQ/Chatbot usage patterns
- Accessibility compliance score
- User satisfaction scores
- Insurance submission success rate

---

## Future Enhancements (Out of Scope for Current Implementation)

- Actual insurance verification API integration
- Real-time chatbot with AI support
- User authentication and account creation
- Data persistence and retrieval
- Appointment booking system integration
- Email/SMS notifications
- Multi-language support
- PDF generation of intake forms
- Provider matching algorithm
- Parent portal for ongoing care management

---

## Implementation Plan

### Phase 1: Foundation Setup
- Initialize Next.js project with required dependencies
- Set up component structure and file organization
- Create design system constants (colors, typography, spacing)
- Implement base layout and navigation structure

### Phase 2: Core Components
- Build shared components (Button, ProgressIndicator, etc.)
- Develop FAQ/Chatbot bubble component
- Create mock data structures

### Phase 3: Flow Implementation
- Implement Landing Page with CTA
- Build Insurance Upload with file handling
- Create Insurance Results screen with conditional rendering
- Develop multi-step Intake Survey component
- Build Scheduling Assistant completion screen

### Phase 4: Polish & Accessibility
- Implement comprehensive keyboard navigation
- Add ARIA labels and semantic HTML
- Test with screen readers
- Refine responsive design for all screen sizes
- Add micro-interactions and transitions

### Phase 5: Testing & Refinement
- Cross-browser testing (all modern browsers)
- Mobile device testing
- Accessibility audit (WCAG 2.1 AA)
- User flow testing
- Performance optimization

### Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge - latest versions)
- No specific legacy browser support required

### Build & Deployment
- No specific build or deployment constraints

---

## Compliance & Security Considerations

### HIPAA Compliance Preparation
While this is a UI-only implementation with no data storage, the design should anticipate future HIPAA compliance:
- Privacy messaging throughout interface
- Clear data usage explanations
- Secure design patterns
- Minimal data collection approach

### Data Privacy
- Display clear privacy policy links
- Explain what information is collected and why
- Provide transparency about data usage

---

## Appendix

### Glossary
- **Clinical Intake**: Initial assessment process to understand patient needs
- **Onboarding**: Process of introducing and registering new users
- **WCAG**: Web Content Accessibility Guidelines
- **Out-of-pocket costs**: Healthcare expenses paid directly by patient

### References
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Next.js Documentation: https://nextjs.org/docs
- Accessible Form Design: https://www.w3.org/WAI/tutorials/forms/

---

## Document Control

**Version**: 1.0  
**Status**: Draft  
**Last Updated**: November 10, 2025  
**Owner**: Product Team  
**Stakeholders**: Engineering, Design, Clinical Operations, Compliance