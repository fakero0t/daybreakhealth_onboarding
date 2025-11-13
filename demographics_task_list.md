# Demographics Intake Form - Implementation Task List

This document breaks down the Demographics Intake Form PRD into two sequential pull requests.

---

## PR #1: Backend Infrastructure & Data Layer

**Goal:** Establish the complete backend foundation for demographics data collection, storage, and retrieval.

**Estimated Effort:** 3-5 days

### Tasks

#### 1. Database Schema & Migrations
- [ ] Create `demographics` table with all fields per PRD data model:
  - Basic information fields (legal_name, preferred_name, gender, pronouns)
  - Guardian information fields (guardian_name, parenting agreement, custody concerns)
  - Education fields (school_name, grade, IEP/504, behavioral concerns)
  - Developmental history fields (complications, milestones)
  - Life changes field (JSONB for multi-select)
  - Activities fields (job, extracurriculars, fun activities, spirituality)
  - Metadata fields (completed, sections_completed, timestamps, audit fields)
- [ ] Set appropriate field types:
  - VARCHAR(100) for names
  - VARCHAR(200) for school name
  - VARCHAR(50) for dropdowns/enums
  - TEXT(500) for text areas
  - JSONB for life_changes and sections_completed
  - ENUM types for yes/no/prefer_not_to_answer questions
  - BOOLEAN for simple yes/no
- [ ] Add foreign key constraint to patient_id
- [ ] Add indexes for patient_id and commonly queried fields
- [ ] Create migration scripts (up and down)
- [ ] Test migrations on local/dev environment

#### 2. Data Models & Validation
- [ ] Create `Demographics` model class/entity
- [ ] Define model properties matching database schema
- [ ] Add model-level validations:
  - Character limit validations (100, 200, 500)
  - Enum value validations
  - Data type validations
- [ ] Create input sanitization helpers to prevent XSS
- [ ] Add model methods:
  - `isComplete()` - check if form is fully completed
  - `getSectionsCompleted()` - return array of completed sections
  - `calculateCompletionPercentage()` - return percentage complete
- [ ] Write unit tests for model validations

#### 3. API Endpoints
- [ ] **POST /api/patients/:patientId/demographics** - Create new demographics record
  - Accept partial data (all fields optional)
  - Return created demographics object
  - Return 201 status on success
- [ ] **GET /api/patients/:patientId/demographics** - Retrieve demographics
  - Return demographics object or 404 if not exists
  - Return completion state
  - Return 200 status
- [ ] **PUT /api/patients/:patientId/demographics** - Full update of demographics
  - Accept complete demographics object
  - Update all fields
  - Return updated object
- [ ] **PATCH /api/patients/:patientId/demographics** - Partial update (for auto-save)
  - Accept partial demographics data
  - Update only provided fields
  - Return updated object
  - Update `updated_at` timestamp
- [ ] **GET /api/patients/:patientId/demographics/completion** - Get completion state
  - Return completion percentage
  - Return sections completed
  - Return last updated timestamp
- [ ] Add authentication middleware to all endpoints
- [ ] Add authorization checks (patient can only access their own data)
- [ ] Add HIPAA audit logging for all endpoints

#### 4. Business Logic & Services
- [ ] Create `DemographicsService` class
- [ ] Implement `createDemographics(patientId, data)` method
- [ ] Implement `getDemographics(patientId)` method
- [ ] Implement `updateDemographics(patientId, data, isPartial)` method
- [ ] Implement `getCompletionState(patientId)` method
- [ ] Add data sanitization in service layer
- [ ] Add business logic for calculating sections completed
- [ ] Add logic to determine if form is complete
- [ ] Implement audit trail tracking:
  - Log who created/updated demographics
  - Log timestamp of changes
  - Log which fields were modified

#### 5. Error Handling & Validation
- [ ] Define error types:
  - `ValidationError` - invalid input data
  - `NotFoundError` - demographics not found
  - `AuthorizationError` - unauthorized access
  - `DatabaseError` - database operation failed
- [ ] Implement error response formatting
- [ ] Add field-level validation errors with specific messages
- [ ] Add global error handler middleware
- [ ] Add error logging

#### 6. Testing
- [ ] Write unit tests for models (validation, methods)
- [ ] Write unit tests for service layer
- [ ] Write integration tests for API endpoints:
  - Test POST endpoint with valid/invalid data
  - Test GET endpoint with existing/non-existing data
  - Test PUT endpoint
  - Test PATCH endpoint for auto-save
  - Test authorization (can't access other patient's data)
- [ ] Test character limit validations
- [ ] Test enum value validations
- [ ] Test partial data handling (all fields optional)
- [ ] Test auto-save functionality
- [ ] Test audit logging
- [ ] Achieve >80% code coverage

#### 7. Documentation
- [ ] Document API endpoints in API documentation:
  - Request/response formats
  - Field descriptions
  - Example requests/responses
  - Error responses
- [ ] Add JSDoc/docstring comments to all methods
- [ ] Document data model structure
- [ ] Create database schema diagram
- [ ] Document environment variables needed (if any)

#### 8. Security & Compliance
- [ ] Ensure all endpoints require authentication
- [ ] Implement authorization checks (patient-level access control)
- [ ] Add input sanitization to prevent SQL injection
- [ ] Add output encoding to prevent XSS
- [ ] Implement HIPAA audit logging
- [ ] Use HTTPS/TLS for all data transmission
- [ ] Implement data encryption at rest for sensitive fields
- [ ] Add rate limiting to API endpoints

---

## PR #2: Frontend UI & User Experience

**Goal:** Build the complete multi-step wizard UI for demographics intake and integrate with backend.

**Estimated Effort:** 5-7 days

### Tasks

#### 1. Multi-Step Wizard Component
- [ ] Create `DemographicsWizard` parent component
- [ ] Implement wizard state management:
  - Current page/step tracking
  - Form data state
  - Completion state per section
  - Error state
  - Loading/saving state
- [ ] Create page navigation logic:
  - Next page
  - Previous page
  - Skip entire form
  - Jump to specific page (for returning users)
- [ ] Implement progress tracking
- [ ] Create wizard layout/container

#### 2. Individual Page Components
- [ ] Create `BasicInformationPage` component:
  - Legal Name field
  - Preferred Name field
  - Gender Assigned at Birth dropdown (with "Other" text field)
  - Pronouns radio buttons
- [ ] Create `GuardianInformationPage` component:
  - Parent/Guardian Name field
  - Shared Parenting Agreement radio buttons (with conditional text area)
  - Custody Concerns radio buttons (with conditional text area)
- [ ] Create `EducationPage` component:
  - School/Day Care Name field
  - Current Grade dropdown
  - IEP/504 Plan radio buttons (with conditional text area)
  - Behavioral/Academic Concerns radio buttons (with conditional text area)
- [ ] Create `DevelopmentalHistoryPage` component:
  - Complications Prior to Birth radio buttons (with conditional text area)
  - Complications at Birth radio buttons (with conditional text area)
  - Developmental Milestones radio buttons (with conditional text area)
- [ ] Create `LifeChangesPage` component:
  - Multi-select checkboxes for life changes
  - "Other" option with text field
  - "Prefer not to answer" option
- [ ] Create `ActivitiesPage` component:
  - Part-time Job radio buttons
  - Extra-curricular Activities radio buttons (with conditional text area)
  - Fun Activities text area
  - Spirituality radio buttons

#### 3. Reusable Form Components
- [ ] Create `TextInput` component with character limit
- [ ] Create `TextArea` component with:
  - Character counter
  - Max length enforcement
  - Real-time character count display
- [ ] Create `RadioGroup` component with:
  - Options prop
  - "Prefer not to answer" support
  - Conditional follow-up field support
- [ ] Create `Dropdown` component with:
  - Options prop
  - "Other" option with text field support
- [ ] Create `CheckboxGroup` component for multi-select
- [ ] Create `ConditionalField` component for follow-up questions
- [ ] Ensure all components are accessible (ARIA labels, keyboard nav)

#### 4. Progress Indicator Component
- [ ] Create `ProgressIndicator` component showing:
  - Current step number (e.g., "Step 1 of 7")
  - Current section name (e.g., "Demographics - Basic Information")
  - Visual progress bar or stepper
- [ ] Add visual indication of completed sections
- [ ] Make progress indicator sticky/fixed during scroll

#### 5. Navigation Components
- [ ] Create `WizardNavigation` component with:
  - "Continue" button (primary action)
  - "Skip" button (secondary action)
  - "Back" button (for pages 2-6)
- [ ] Add button states (enabled, disabled, loading)
- [ ] Add loading indicators during save operations
- [ ] Implement keyboard shortcuts (Enter to continue, Esc to skip)

#### 6. Auto-Save Functionality
- [ ] Implement auto-save logic:
  - Save after clicking "Continue" button
  - Save after 30 seconds of inactivity
  - Debounce rapid changes
- [ ] Create `AutoSaveIndicator` component showing:
  - "Saving..." state
  - "Saved" state with timestamp
  - "Error saving" state with retry option
- [ ] Handle save failures gracefully:
  - Show error message
  - Offer retry option
  - Store data locally as backup
- [ ] Implement save queue to prevent concurrent saves
- [ ] Add visual feedback for save operations

#### 7. Privacy Notice Component
- [ ] Create `PrivacyNotice` component/page
- [ ] Display informational text about:
  - What data is collected
  - Why it's collected
  - How it will be used
  - HIPAA compliance statement
  - Link to full privacy policy
- [ ] Add "Continue to Demographics" button
- [ ] Make privacy notice the first thing shown in onboarding
- [ ] Store acknowledgment in session (no database record needed)

#### 8. Resume Functionality
- [ ] Detect if user has partial demographics data on load
- [ ] Show modal/dialog offering to:
  - Resume where they left off
  - Start over from beginning
- [ ] If resuming, jump to first incomplete section
- [ ] Pre-populate all saved data
- [ ] Show which sections are already completed

#### 9. Integration with Backend
- [ ] Implement API client methods:
  - `createDemographics(patientId, data)`
  - `getDemographics(patientId)`
  - `updateDemographics(patientId, data, isPartial)`
  - `getCompletionState(patientId)`
- [ ] Add error handling for API calls
- [ ] Add retry logic for failed requests
- [ ] Implement optimistic updates for better UX
- [ ] Add loading states during API calls
- [ ] Handle authentication errors
- [ ] Handle authorization errors

#### 10. Form Validation
- [ ] Implement client-side character limit validation
- [ ] Show real-time character count for text fields
- [ ] Prevent submission if character limits exceeded
- [ ] Validate enum values match allowed options
- [ ] Show field-level error messages
- [ ] Highlight invalid fields visually
- [ ] Prevent navigation with invalid data
- [ ] Add form-level validation before save

#### 11. Conditional Field Logic
- [ ] Implement show/hide logic for follow-up text areas:
  - Show when "Yes" is selected
  - Hide when "No" or "Prefer not to answer" selected
  - Clear data when hidden
- [ ] Implement "Other" field show/hide:
  - Show when "Other" option selected
  - Hide otherwise
- [ ] Smooth animation for showing/hiding fields
- [ ] Ensure proper focus management when fields appear

#### 12. Responsive Design
- [ ] Optimize layout for mobile (320px+)
- [ ] Optimize layout for tablet (768px+)
- [ ] Optimize layout for desktop (1024px+)
- [ ] Ensure touch-friendly tap targets (44px minimum)
- [ ] Test on various screen sizes
- [ ] Ensure proper scrolling behavior
- [ ] Make sure progress indicator is visible on mobile

#### 13. Accessibility
- [ ] Add proper ARIA labels to all form fields
- [ ] Implement keyboard navigation:
  - Tab through fields
  - Enter to submit
  - Arrow keys for radio buttons
  - Space to toggle checkboxes
- [ ] Add focus indicators (visible outline)
- [ ] Ensure sufficient color contrast (WCAG AA minimum)
- [ ] Add screen reader announcements for:
  - Page changes
  - Error messages
  - Save status
  - Character count warnings
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Add skip links if needed
- [ ] Ensure form labels are properly associated

#### 14. Onboarding Flow Integration
- [ ] Update onboarding routing to include demographics as Step 1
- [ ] Ensure demographics comes before symptom questionnaire
- [ ] Update progress indicator to show overall onboarding progress
- [ ] Handle navigation from demographics to symptom questionnaire
- [ ] Ensure proper session management across steps
- [ ] Update onboarding completion logic

#### 15. Post-Intake Update Functionality
- [ ] Create `EditDemographics` component for profile/settings
- [ ] Reuse same wizard components with pre-populated data
- [ ] Add "Edit Demographics" link to profile/settings page
- [ ] Show last updated timestamp
- [ ] Allow full edit capability
- [ ] Save updates with audit trail
- [ ] Show success message after updates saved

#### 16. Testing
- [ ] Write unit tests for all components
- [ ] Write integration tests for wizard flow:
  - Complete entire flow
  - Test navigation (next, back, skip)
  - Test auto-save
  - Test resume functionality
  - Test validation
  - Test conditional fields
  - Test character limits
- [ ] Test responsive behavior at different breakpoints
- [ ] Test accessibility with automated tools (axe, Lighthouse)
- [ ] Manual accessibility testing with keyboard only
- [ ] Manual accessibility testing with screen reader
- [ ] Test error scenarios:
  - Network failure during save
  - Authentication timeout
  - Invalid data
- [ ] Test browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Achieve >80% code coverage

#### 17. UI/UX Polish
- [ ] Design and implement consistent visual styling:
  - Colors matching brand
  - Typography
  - Spacing
  - Borders/shadows
- [ ] Add smooth transitions/animations:
  - Page transitions
  - Field show/hide
  - Save indicators
- [ ] Add helpful microcopy/instructions:
  - Field descriptions where needed
  - Tooltips for clarification
  - Placeholder text examples
- [ ] Add empty states where appropriate
- [ ] Ensure consistent button styling and placement
- [ ] Add loading skeletons for initial data load

#### 18. Performance Optimization
- [ ] Lazy load wizard pages (code splitting)
- [ ] Optimize bundle size
- [ ] Implement debouncing for auto-save
- [ ] Optimize re-renders
- [ ] Add loading states for async operations
- [ ] Optimize images/assets if any
- [ ] Test performance on slow networks
- [ ] Ensure fast time to interactive

#### 19. Error Handling & Edge Cases
- [ ] Handle network errors gracefully
- [ ] Handle API errors with user-friendly messages
- [ ] Handle session timeout
- [ ] Handle concurrent edits (if multiple browser tabs)
- [ ] Handle browser refresh mid-form
- [ ] Handle back button navigation
- [ ] Handle user closing browser mid-form
- [ ] Add fallback UI for JavaScript errors

#### 20. Documentation
- [ ] Add component documentation (props, usage examples)
- [ ] Document wizard state management approach
- [ ] Add user-facing help text/tooltips
- [ ] Create component storybook stories
- [ ] Document any configuration options
- [ ] Add README for demographics feature
- [ ] Document known issues/limitations

---

## Success Criteria

### PR #1 Completion Criteria
- ✅ All database migrations run successfully
- ✅ All API endpoints functional and tested
- ✅ All unit tests passing (>80% coverage)
- ✅ All integration tests passing
- ✅ API documentation complete
- ✅ Security review passed
- ✅ Code review approved

### PR #2 Completion Criteria
- ✅ All 6 wizard pages implemented and functional
- ✅ Complete demographics flow works end-to-end
- ✅ Auto-save working correctly
- ✅ Resume functionality working
- ✅ All validation working
- ✅ All tests passing (>80% coverage)
- ✅ Accessibility audit passed
- ✅ Responsive design working on all breakpoints
- ✅ Successfully integrated into onboarding flow
- ✅ Edit functionality working from profile/settings
- ✅ Code review approved
- ✅ QA testing passed

### Overall Feature Completion
- ✅ Demographics form is Step 1 of onboarding
- ✅ All questions from original forms captured
- ✅ All fields optional
- ✅ Character limits enforced
- ✅ "Prefer not to answer" options available
- ✅ Privacy notice displayed
- ✅ Auto-save and resume working
- ✅ Post-intake editing available
- ✅ HIPAA compliant
- ✅ Accessible (WCAG AA)
- ✅ Mobile responsive
- ✅ All PRD requirements fulfilled

---

## Notes

### Dependency Between PRs
- PR #2 depends on PR #1 being merged first
- Frontend development can begin in parallel once API contracts are defined
- Use API mocks for frontend development if needed

### Estimated Timeline
- **PR #1:** 3-5 days (backend developer)
- **PR #2:** 5-7 days (frontend developer)
- **Total:** 8-12 days with sequential implementation
- **Total:** 5-7 days with parallel development (using API mocks)

### Testing Strategy
- Unit tests for models, services, components
- Integration tests for API endpoints and wizard flow
- E2E tests for complete onboarding flow
- Manual accessibility testing
- Manual QA testing before release

### Deployment Strategy
- Deploy PR #1 to staging first, verify database migrations
- Run smoke tests on staging
- Deploy PR #2 to staging
- Run full regression testing
- Deploy to production with feature flag
- Monitor error rates and user feedback
- Gradually roll out to 100% of users

