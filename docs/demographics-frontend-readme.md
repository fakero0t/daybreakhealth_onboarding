# Demographics Frontend - User Guide

## Overview

The Demographics Frontend is a multi-step wizard that collects patient demographic and background information during the onboarding process. It's built with React/Next.js and features auto-save, resume capability, and full accessibility support.

---

## Quick Start

### Using the Component

```jsx
import { DemographicsWizard } from '@/components/demographics';

function OnboardingPage() {
  const handleComplete = (data) => {
    console.log('Demographics completed:', data);
    // Navigate to next step
    router.push('/onboarding/symptoms');
  };

  const handleSkip = () => {
    // User skipped the form
    router.push('/onboarding/symptoms');
  };

  return (
    <DemographicsWizard
      patientId="patient-uuid-here"
      onComplete={handleComplete}
      onSkipAll={handleSkip}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `patientId` | string | Yes | UUID of the patient |
| `onComplete` | function | Yes | Called when form is completed |
| `onSkipAll` | function | Yes | Called when user skips entire form |

---

## Component Architecture

### Reusable Components

All form components are reusable and accept standard props:

#### TextInput

```jsx
<TextInput
  label="Field Label"
  name="field_name"
  value={value}
  onChange={(newValue) => setValue(newValue)}
  maxLength={100}
  placeholder="Enter text..."
  helpText="Additional help text"
  error="Error message if any"
  required={false}
  disabled={false}
/>
```

**Props:**
- `label` (string) - Field label
- `name` (string) - Field name for accessibility
- `value` (string) - Current value
- `onChange` (function) - Called when value changes
- `maxLength` (number) - Maximum character limit
- `placeholder` (string) - Placeholder text
- `helpText` (string) - Help text below field
- `error` (string) - Error message to display
- `required` (boolean) - Show required indicator
- `disabled` (boolean) - Disable field

#### TextArea

Same props as TextInput, plus:
- `rows` (number) - Number of rows (default: 4)

#### RadioGroup

```jsx
<RadioGroup
  label="Question?"
  name="field_name"
  value={value}
  onChange={(newValue) => setValue(newValue)}
  options={[
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ]}
  helpText="Help text"
  showFollowUp={true}
  followUpValue={followUpText}
  onFollowUpChange={(text) => setFollowUpText(text)}
  followUpLabel="Please provide details"
/>
```

**Props:**
- Standard props (label, name, value, onChange, etc.)
- `options` (array) - Array of {value, label} objects or strings
- `showFollowUp` (boolean) - Show conditional text area when "yes"
- `followUpValue` (string) - Value for follow-up field
- `onFollowUpChange` (function) - Callback for follow-up field
- `followUpLabel` (string) - Label for follow-up field

#### Dropdown

```jsx
<Dropdown
  label="Select Option"
  name="field_name"
  value={value}
  onChange={(newValue) => setValue(newValue)}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  placeholder="Select an option"
  hasOtherOption={true}
  otherValue={otherText}
  onOtherChange={(text) => setOtherText(text)}
/>
```

**Props:**
- Standard props
- `options` (array) - Array of {value, label} objects
- `placeholder` (string) - Placeholder for dropdown
- `hasOtherOption` (boolean) - Include "Other" option
- `otherValue` (string) - Value for "Other" text field
- `onOtherChange` (function) - Callback for "Other" field

#### CheckboxGroup

```jsx
<CheckboxGroup
  label="Select all that apply"
  name="field_name"
  value={selectedValues}
  onChange={(newValues) => setSelectedValues(newValues)}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
  hasOtherOption={true}
  otherValue={otherText}
  onOtherChange={(text) => setOtherText(text)}
/>
```

**Props:**
- Standard props
- `value` (array) - Array of selected values
- `onChange` (function) - Called with array of selected values
- `options` (array) - Array of {value, label} objects
- `hasOtherOption` (boolean) - Include "Other" option
- `otherValue` (string) - Value for "Other" text field
- `onOtherChange` (function) - Callback for "Other" field

---

## Wizard Flow

### Step-by-Step

1. **Privacy Notice** - User sees HIPAA/privacy information first
2. **Basic Information** - Legal name, preferred name, gender, pronouns
3. **Guardian Information** - Guardian name, custody information
4. **Education** - School, grade, IEP/504, concerns
5. **Developmental History** - Birth complications, milestones
6. **Life Changes** - Significant life events (multi-select)
7. **Activities** - Job, extracurriculars, fun activities, spirituality
8. **Completion** - Redirects to next onboarding step

### Navigation Options

- **Continue** - Saves current page and advances
- **Back** - Goes to previous page (no save)
- **Skip this section** - Moves to next page without saving
- **Skip entire form** - Exits demographics (only on first page)

---

## Auto-Save Feature

### How It Works

- **Trigger 1:** Automatically saves after 30 seconds of inactivity
- **Trigger 2:** Saves when clicking "Continue" button
- **Visual Feedback:**
  - "Saving..." with spinner
  - "Saved just now" (or timestamp)
  - "Error saving" with retry button

### Technical Details

- Uses debounced timer to prevent excessive API calls
- Partial updates (PATCH) for auto-save
- Full updates (PUT) when clicking Continue
- Clears timer on unmount (no memory leaks)
- Retries on error

### Disabling Auto-Save

Auto-save cannot be disabled as it's a core feature for data safety.

---

## Resume Capability

### How It Works

1. On mount, wizard checks for existing demographics
2. If found, loads all saved data
3. Jumps to first incomplete section automatically
4. Shows "Saved [time] ago" indicator
5. User continues from where they left off

### Completion Tracking

Sections are marked complete when:
- User clicks "Continue" on that page
- Section is added to `sections_completed` array
- Saved to database

---

## Conditional Fields

### Follow-Up Questions

When user selects "Yes" for certain questions, a text area appears:
- Shared parenting agreement details
- Custody concerns details
- IEP/504 plan details
- Behavioral/academic concerns details
- Complications details
- Developmental milestone details
- Extracurricular activities details

**Behavior:**
- Appears with smooth transition
- Clears when user switches to "No"
- 500 character limit
- Optional (can leave blank)

### "Other" Fields

When user selects "Other" option, a text field appears:
- Gender other text (100 chars)
- Life changes other text (500 chars)

---

## Character Limits

### Enforcement

All text fields have character limits:
- **Names:** 100 characters
- **School:** 200 characters
- **Text areas:** 500 characters

### User Experience

- Real-time character counter
- Warning when approaching limit (80%)
- Counter always visible for text areas
- Counter shows on focus for text inputs
- Prevents typing beyond limit

---

## Accessibility

### Keyboard Navigation

- **Tab** - Move between fields
- **Shift + Tab** - Move backward
- **Enter** - Submit/Continue
- **Space** - Toggle checkboxes
- **Arrow Keys** - Navigate radio buttons

### Screen Readers

- All fields have proper labels
- ARIA attributes on form controls
- Live regions announce:
  - Page changes
  - Save status
  - Error messages
  - Character count warnings
- Error messages associated with fields

### Visual Accessibility

- High contrast mode support
- Focus indicators visible
- Color is not only indicator
- Text size adjustable
- Touch targets ≥44px

---

## Styling & Customization

### Design Tokens

The component uses Tailwind CSS classes. To customize:

```css
/* In your global CSS */
.demographics-wizard {
  --primary-color: #2563EB; /* Blue 600 */
  --success-color: #059669; /* Green 600 */
  --error-color: #DC2626; /* Red 600 */
}
```

### Component Customization

Components accept className prop for custom styling:

```jsx
<TextInput
  className="my-custom-class"
  // other props
/>
```

---

## Error Handling

### Network Errors

If save fails:
1. "Error saving" indicator appears
2. User sees "Retry" button
3. Clicking retry attempts save again
4. Continue button remains enabled

### Validation Errors

Character limits are enforced client-side:
- Cannot type beyond max length
- Visual counter shows limit
- No server validation needed (all optional)

### 404 Errors

If demographics don't exist:
- Treated as new record
- Creates record on first save
- No error shown to user

---

## Data Structure

### Form Data Object

```javascript
{
  // Basic Information
  legal_name: "string",
  preferred_name: "string",
  gender_assigned_at_birth: "male|female|intersex|other|prefer_not_to_answer",
  gender_other_text: "string",
  pronouns: "she/hers|he/his|they/them|ze/zer|ask me|prefer_not_to_answer",
  
  // Guardian Information
  guardian_name: "string",
  shared_parenting_agreement: "yes|no|prefer_not_to_answer",
  shared_parenting_details: "string",
  custody_concerns: "yes|no|prefer_not_to_answer",
  custody_concerns_details: "string",
  
  // Education
  school_name: "string",
  current_grade: "pre-k|kindergarten|1st|...|12th|college|not in school|other",
  has_iep_504: "yes|no|prefer_not_to_answer",
  iep_504_details: "string",
  behavioral_academic_concerns: "yes|no|prefer_not_to_answer",
  behavioral_academic_details: "string",
  
  // Developmental History
  complications_prior_birth: "yes|no|prefer_not_to_answer",
  complications_prior_details: "string",
  complications_at_birth: "yes|no|prefer_not_to_answer",
  complications_birth_details: "string",
  milestones_met: "yes|no|prefer_not_to_answer",
  milestones_details: "string",
  
  // Life Changes
  life_changes: ["frequent_moves", "other", ...],
  life_changes_other_text: "string",
  
  // Activities
  has_part_time_job: boolean,
  has_extracurriculars: boolean,
  extracurriculars_details: "string",
  fun_activities: "string",
  spirituality: "yes|no|complicated|prefer_not_to_answer",
  
  // Metadata
  completed: boolean,
  sections_completed: ["basic_information", "education", ...]
}
```

---

## API Integration

The wizard uses the demographics API client:

```javascript
import { 
  getDemographics,
  saveDemographics,
  getCompletionState 
} from '@/lib/api/demographics-client';

// Fetch existing data
const data = await getDemographics(patientId);

// Save data (auto-detects create vs update)
const saved = await saveDemographics(patientId, data, isPartial);

// Check completion
const state = await getCompletionState(patientId);
```

### Endpoints Used

- `GET /api/demographics?patientId={id}` - Fetch data
- `POST /api/demographics` - Create new record
- `PUT /api/demographics?patientId={id}` - Full update
- `PATCH /api/demographics?patientId={id}` - Partial update (auto-save)

---

## Testing

### Manual Testing

Use this patient ID for testing:
```
123e4567-e89b-12d3-a456-426614174000
```

### Test Scenarios

1. **First time user**
   - Privacy notice shows
   - All fields empty
   - Can complete all pages
   - Saves successfully

2. **Returning user**
   - Loads saved data
   - Jumps to incomplete section
   - Shows "Saved X ago"

3. **Auto-save**
   - Enter data
   - Wait 30 seconds
   - See "Saving..." then "Saved"

4. **Skip functionality**
   - Click "Skip this section"
   - Moves to next page
   - Section not marked complete

5. **Error handling**
   - Disable network
   - Try to save
   - See error with retry button

---

## Troubleshooting

### Auto-save not working

**Check:**
- Patient ID is valid UUID
- Backend API is running
- No console errors
- Network tab shows PATCH requests

**Fix:**
- Verify patient ID
- Check backend logs
- Check browser network tab

### Data not loading

**Check:**
- Patient ID correct
- Backend API running
- Demographics record exists

**Fix:**
- Create new record by filling form
- Check backend database

### Conditional fields not showing

**Check:**
- Selected "Yes" for the question
- No JavaScript errors in console

**Fix:**
- Clear browser cache
- Check component state in React DevTools

### Character counter wrong

**Check:**
- Using correct maxLength prop
- Value is string (not undefined/null)

**Fix:**
- Ensure value defaults to empty string

---

## Performance Tips

### Optimization

- Components use React hooks efficiently
- Auto-save is debounced (30 seconds)
- Re-renders minimized with proper state management
- Scroll position optimized

### Bundle Size

- No external UI libraries used
- Tailwind for minimal CSS
- Next.js code splitting enabled
- Components can be lazy-loaded

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Mobile Chrome (Android 10+)

---

## Known Issues

### None Currently

If you find issues, please report them.

---

## Future Enhancements

- [ ] Offline support with local storage
- [ ] Export to PDF
- [ ] Print-friendly view
- [ ] Multi-language support
- [ ] Voice input
- [ ] Progress sync across devices
- [ ] Collaborative editing (guardian + patient)

---

## Support

For questions or issues:
- Check API documentation: `docs/demographics-api.md`
- Review PRD: `demographics_prd.md`
- Check backend README: `docs/demographics-backend-readme.md`
- Review code comments in components

---

## License

Copyright © 2024 Daybreak Health. All rights reserved.

