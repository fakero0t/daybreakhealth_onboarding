# Demographics Intake Form - Product Requirements Document

## Table of Contents
1. [Overview](#overview)
2. [Executive Summary](#executive-summary)
3. [Purpose](#purpose)
4. [Key Requirements](#key-requirements)
5. [Form Sections and Fields](#form-sections-and-fields)
6. [User Flow](#user-flow)
7. [Technical Considerations](#technical-considerations)
8. [Accessibility](#accessibility)
9. [Privacy and Security](#privacy-and-security)
10. [Future Considerations](#future-considerations)
11. [Success Metrics](#success-metrics)
12. [Design Decisions Summary](#design-decisions-summary)
13. [Updating Demographics After Initial Intake](#updating-demographics-after-initial-intake)
14. [Dependencies](#dependencies)

---

## Overview
This document outlines the requirements for a demographics intake form that will be presented to patients before the symptom questionnaire. This form collects basic demographic and background information about the child patient.

## Executive Summary

**What:** A multi-step demographics intake form collecting patient background information

**When:** Step 1 of onboarding, before the symptom questionnaire

**Key Features:**
- 6-page wizard format (Basic Info, Guardian Info, Education, Developmental History, Life Changes, Activities)
- All fields optional with "Prefer not to answer" options for sensitive questions
- Auto-save with resume capability
- Character limits: 100 for names, 200 for school, 500 for text areas
- Conditional follow-up fields for Yes answers
- Privacy notice displayed before form begins

**User Experience:** Clean, mobile-responsive design with progress indicators, "Continue" and "Skip" buttons, and ability to return later

## Purpose
- Collect essential demographic and background information about the patient
- Provide context for clinical care
- Serve as the first step in the onboarding flow, appearing before the symptom questionnaire

## Key Requirements
- All fields are **optional** - users can skip any question
- This form must appear as the **first step** before the symptom questionnaire
- The form can be completed by the child, parent, or both
- Auto-save functionality allows users to complete the form over multiple sessions
- Data can be updated after initial intake via profile/settings page

## Form Sections and Fields

### 1. Basic Information

#### Legal Name
- **Field Type:** Text input
- **Label:** "Legal Name:"
- **Required:** No
- **Max Length:** 100 characters
- **Description:** Patient's legal name

#### Preferred Name
- **Field Type:** Text input
- **Label:** "Preferred Name:"
- **Required:** No
- **Max Length:** 100 characters
- **Description:** Name the patient prefers to be called

#### Gender Assigned at Birth
- **Field Type:** Dropdown select
- **Label:** "Gender Assigned at Birth:"
- **Options:**
  - Male
  - Female
  - Intersex
  - Prefer not to answer
  - Other (with text input field)
- **Required:** No
- **Description:** Gender assigned to patient at birth

#### Pronouns
- **Field Type:** Single choice (radio buttons)
- **Label:** "Pronouns:"
- **Options:**
  - she/hers
  - he/his
  - they/them
  - ze/zer
  - ask me
  - prefer not to answer
- **Required:** No
- **Description:** Patient's preferred pronouns

### 2. Guardian Information

#### Parent/Legal Guardian Name
- **Field Type:** Text input
- **Label:** "Parent/Legal Guardian Name:"
- **Required:** No
- **Max Length:** 100 characters
- **Description:** Name of parent or legal guardian

#### Legal Shared Parenting Agreement
- **Field Type:** Yes/No radio buttons
- **Label:** "Legal shared parenting agreement?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

#### Custody Concerns
- **Field Type:** Yes/No radio buttons
- **Label:** "Custody concerns?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

### 3. Education

#### School/Day Care Name
- **Field Type:** Text input
- **Label:** "School/Day Care Name:"
- **Required:** No
- **Max Length:** 200 characters
- **Description:** Name of school or daycare facility

#### Current Grade
- **Field Type:** Dropdown select
- **Label:** "Current Grade:"
- **Options:** Pre-K, Kindergarten, 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, 10th, 11th, 12th, College, Not in school, Other
- **Required:** No
- **Description:** Student's current grade level

#### IEP or 504 Plan
- **Field Type:** Yes/No radio buttons
- **Label:** "Have an IEP or 504 Plan?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

#### Behavioral or Academic Concerns
- **Field Type:** Yes/No radio buttons
- **Label:** "Any behavioral or academic concerns?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

### 4. Developmental History

#### Complications Prior to Birth
- **Field Type:** Yes/No radio buttons
- **Label:** "Complications prior to birth?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

#### Complications at Birth
- **Field Type:** Yes/No radio buttons
- **Label:** "Complications at birth?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "Yes", display optional text area for details (500 char max)

#### Developmental Milestones
- **Field Type:** Yes/No radio buttons
- **Label:** "All developmental milestones met?"
- **Options:** Yes, No, Prefer not to answer
- **Required:** No
- **Follow-up:** If "No", display optional text area for details (500 char max)

### 5. Significant Life Changes

#### Any Significant Changes in Life
- **Field Type:** Multiple choice (checkboxes - multiple selection allowed)
- **Label:** "Any significant changes in life such as:"
- **Options:**
  - Frequent moves
  - Changes in Caregivers
  - Death of a friend/relative
  - Witness to violence
  - History of Abuse/Neglect
  - Other (with text input field for specification, 500 char max)
  - Prefer not to answer
- **Required:** No
- **Note:** Multiple selections allowed; "Other" field appears when "Other" checkbox is selected

### 6. Activities and Interests

#### Part-Time Job
- **Field Type:** Yes/No radio buttons
- **Label:** "Work a part time job?"
- **Options:** Yes, No
- **Required:** No

#### Extra-Curricular Activities
- **Field Type:** Yes/No radio buttons
- **Label:** "Involved in extra-curricular activities (sports, youth groups, or clubs)?"
- **Options:** Yes, No
- **Required:** No
- **Follow-up:** If "Yes", display optional text area to describe activities (500 char max)

#### Fun Activities
- **Field Type:** Text area (multi-line)
- **Label:** "What do you like to do for fun?"
- **Required:** No
- **Max Length:** 500 characters
- **Description:** Open-ended question about hobbies and interests

#### Spirituality
- **Field Type:** Single choice (radio buttons)
- **Label:** "Is spirituality a part of your life?"
- **Options:**
  - Yes
  - No
  - It's complicated
  - Prefer not to answer
- **Required:** No

## User Flow

1. User starts onboarding process
2. Privacy notice is displayed (informational text about data usage and HIPAA compliance)
3. Demographics form is presented as **Step 1** in a multi-step wizard format:
   - **Page 1:** Basic Information
   - **Page 2:** Guardian Information  
   - **Page 3:** Education
   - **Page 4:** Developmental History
   - **Page 5:** Significant Life Changes
   - **Page 6:** Activities and Interests
4. User completes desired fields on each page (all optional)
5. User clicks "Continue" button to advance to next page or "Skip" to bypass entire form
6. System auto-saves progress after each page
7. Progress indicator shows current step (e.g., "Step 1 of 7: Demographics")
8. After final demographics page, user proceeds to symptom questionnaire (Step 2)
9. User can return later and resume from where they left off

## Technical Considerations

### Data Storage
- All demographic data should be stored securely in the database
- Data should be associated with the patient record
- HIPAA compliance required for all data handling
- Auto-save after each page completion or 30 seconds of inactivity
- Store completion state to allow users to resume later
- Track which sections have been viewed vs completed

### Suggested Data Model
```
demographics {
  id: UUID
  patient_id: UUID (foreign key)
  
  // Basic Information
  legal_name: VARCHAR(100)
  preferred_name: VARCHAR(100)
  gender_assigned_at_birth: VARCHAR(50)
  gender_other_text: VARCHAR(100)
  pronouns: VARCHAR(50)
  
  // Guardian Information
  guardian_name: VARCHAR(100)
  shared_parenting_agreement: ENUM('yes', 'no', 'prefer_not_to_answer')
  shared_parenting_details: TEXT(500)
  custody_concerns: ENUM('yes', 'no', 'prefer_not_to_answer')
  custody_concerns_details: TEXT(500)
  
  // Education
  school_name: VARCHAR(200)
  current_grade: VARCHAR(50)
  has_iep_504: ENUM('yes', 'no', 'prefer_not_to_answer')
  iep_504_details: TEXT(500)
  behavioral_academic_concerns: ENUM('yes', 'no', 'prefer_not_to_answer')
  behavioral_academic_details: TEXT(500)
  
  // Developmental History
  complications_prior_birth: ENUM('yes', 'no', 'prefer_not_to_answer')
  complications_prior_details: TEXT(500)
  complications_at_birth: ENUM('yes', 'no', 'prefer_not_to_answer')
  complications_birth_details: TEXT(500)
  milestones_met: ENUM('yes', 'no', 'prefer_not_to_answer')
  milestones_details: TEXT(500)
  
  // Life Changes (stored as JSON array or separate junction table)
  life_changes: JSONB
  life_changes_other_text: TEXT(500)
  
  // Activities
  has_part_time_job: BOOLEAN
  has_extracurriculars: BOOLEAN
  extracurriculars_details: TEXT(500)
  fun_activities: TEXT(500)
  spirituality: ENUM('yes', 'no', 'complicated', 'prefer_not_to_answer')
  
  // Metadata
  completed: BOOLEAN
  sections_completed: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  created_by: UUID
  updated_by: UUID
}
```

### Validation
- Character limits enforced on all text inputs (see field specifications)
- No required field validation since all fields are optional
- Sanitize all user input to prevent XSS and injection attacks
- Validate character counts client-side with real-time feedback
- Show remaining character count for text areas

### UI/UX Guidelines
- **Layout:** Multi-step wizard with one section per page (6 pages total)
- **Navigation:** "Continue" button (primary) and "Skip" button (secondary) on each page
- **Progress Indicator:** Show "Step 1 of 7: Demographics - [Section Name]" at top
- **Auto-save:** Display subtle indicator when data is auto-saved
- **Mobile-responsive:** Optimize for mobile, tablet, and desktop
- **Conditional Fields:** Show follow-up text areas only when triggered by Yes answers
- **Visual Hierarchy:** Use clear section headers and adequate spacing
- **Return Users:** If form partially completed, offer to resume or start over

### Accessibility
- All form fields must have proper labels for screen readers
- Keyboard navigation support
- Sufficient color contrast
- Clear focus indicators
- Error messages announced to screen readers

## Privacy and Security

- All data collection must comply with HIPAA regulations
- **Privacy Notice:** Display informational notice before form begins explaining:
  - What data is collected and why
  - How data will be used for care
  - HIPAA compliance and data protection measures
  - Link to full privacy policy
- **No Explicit Consent Required:** Privacy notice is informational only (consent obtained at account creation)
- Secure transmission (HTTPS/TLS) and storage of all demographic information
- Encrypt sensitive data at rest
- Audit logging for data access and modifications

## Future Considerations

- Export demographics data for clinical review (PDF or print format)
- Integration with external EHR systems
- Bulk import for organization-wide deployments
- Analytics dashboard for demographic trends (aggregated/anonymized)
- Multi-language support for non-English speakers
- Voice input option for accessibility

## Success Metrics

- Completion rate of demographics form
- Time to complete the form
- Drop-off points (if any)
- User feedback on form experience
- Percentage of fields completed on average

## Design Decisions Summary

### Character Limits
- **Names:** 100 characters (Legal Name, Preferred Name, Guardian Name)
- **School/Facility:** 200 characters
- **Text Areas:** 500 characters (follow-up details, fun activities, "Other" specifications)

### Field Types
- **Pronouns:** Single select (radio buttons) - one choice only
- **Gender Assigned at Birth:** Dropdown with inclusive options including "Other" free text
- **Grade Level:** Dropdown with standard options (Pre-K through College, plus "Not in school" and "Other")
- **Yes/No Questions:** Radio buttons (not checkboxes) with "Prefer not to answer" option

### Follow-up Questions
- All "Yes" answers to sensitive questions (IEP, complications, concerns, etc.) trigger optional text area for details
- Follow-up fields are optional and appear conditionally
- Maximum 500 characters for all follow-up text

### "Prefer Not to Answer" Option
- Added to all sensitive questions:
  - Gender assigned at birth
  - Pronouns
  - Custody-related questions
  - Developmental history questions
  - Academic/behavioral concerns
  - Life changes
  - Spirituality

### Form Layout
- **Multi-step wizard:** 6 pages, one per section
- **Auto-save:** After each page or 30 seconds of inactivity
- **Navigation:** "Continue" (primary) and "Skip" (secondary) buttons
- **Resume capability:** Users can return later and continue where they left off

### Privacy Notice
- **Timing:** Display before form begins (not after)
- **Type:** Informational text with link to full privacy policy
- **Consent:** Not required (already obtained at account creation)

### Data Management
- **Updating:** Users can update demographics via profile/settings page after initial intake
- **Required Fields:** None - all fields remain optional to reduce barriers to entry

## Updating Demographics After Initial Intake

Users should be able to update their demographics information after completing the initial intake:

- **Access Point:** Profile or Settings page in main application
- **Edit Mode:** Same multi-step wizard format with all fields pre-populated
- **Save Behavior:** Updates saved immediately (auto-save enabled)
- **Audit Trail:** Track when demographics are updated and by whom
- **Notification:** Optional notification to care team when significant changes are made

## Dependencies

### Technical Requirements
- Database schema updates to store all demographic fields with appropriate data types
- New database tables or columns for:
  - Follow-up text fields for Yes/No questions
  - Completion state tracking
  - Audit logging of changes
- Backend API endpoints:
  - POST/PUT for saving demographics data
  - GET for retrieving existing demographics
  - PATCH for auto-save updates
  - GET for checking completion state

### Integration Points
- This form must be integrated **before** the existing symptom questionnaire in onboarding flow
- Updates to onboarding flow navigation/routing logic
- Session management for multi-page wizard
- Integration with user profile/settings for post-intake updates

### UI Components
- Multi-step wizard component
- Progress indicator component
- Auto-save indicator
- Conditional field rendering logic
- Character counter component for text areas
- Privacy notice modal or page

