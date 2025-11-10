# Daybreak Health - Parent Onboarding Application

A comprehensive onboarding flow for parents seeking mental health services for their children through Daybreak Health. Built with Next.js, React, and Tailwind CSS.

## Features

- **Multi-step onboarding flow**: Landing page → Insurance upload → Insurance verification → Intake survey → Scheduling
- **Insurance card upload**: Drag-and-drop file upload with validation
- **Comprehensive intake survey**: 13 questions across multiple categories with conditional logic
- **State persistence**: Automatic saving to localStorage with error handling
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Responsive design**: Mobile-first approach with breakpoints for tablet and desktop
- **FAQ chatbot**: Persistent help bubble with common questions
- **Smooth transitions**: Micro-interactions and animations throughout

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **Icons**: Heroicons
- **Fonts**: Inter (Google Fonts)
- **Language**: JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd daybreakhealth_onboarding
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
daybreakhealth_onboarding/
├── app/
│   ├── layout.js          # Root layout with providers
│   ├── page.js            # Main onboarding flow orchestrator
│   └── globals.css        # Global styles and animations
├── components/
│   ├── shared/            # Reusable components
│   │   ├── Button.jsx
│   │   ├── FileUpload.jsx
│   │   ├── ProgressIndicator.jsx
│   │   ├── QuestionCard.jsx
│   │   └── FAQChatbot.jsx
│   └── onboarding/        # Onboarding-specific screens
│       ├── LandingPage.jsx
│       ├── InsuranceUpload.jsx
│       ├── InsuranceResults.jsx
│       ├── IntakeSurvey.jsx
│       └── SchedulingAssistant.jsx
├── lib/
│   ├── constants/
│   │   ├── design-system.js      # Design tokens
│   │   └── survey-questions.js   # Survey question definitions
│   ├── context/
│   │   └── OnboardingContext.jsx # Global state management
│   ├── hooks/
│   │   └── useStepNavigation.js  # Navigation hook
│   └── utils/
│       └── localStorage.js        # localStorage utilities
└── public/                # Static assets
```

## Component Usage

### Button

A reusable, accessible button component with multiple variants and sizes.

```jsx
import Button from '@/components/shared/Button'

<Button
  onClick={handleClick}
  variant="primary"  // 'primary' | 'secondary' | 'outline' | 'text'
  size="medium"      // 'small' | 'medium' | 'large'
  disabled={false}
  loading={false}
  ariaLabel="Button label"
>
  Click me
</Button>
```

### FileUpload

File upload component with drag-and-drop support and validation.

```jsx
import FileUpload from '@/components/shared/FileUpload'

<FileUpload
  label="Upload File"
  accept="image/jpeg,image/png,application/pdf"
  maxSize={10 * 1024 * 1024}  // 10MB
  onFileSelect={(file) => handleFile(file)}
  onFileRemove={() => handleRemove()}
  preview={selectedFile}
  error={errorMessage}
  required={true}
/>
```

### ProgressIndicator

Displays progress through the onboarding flow.

```jsx
import ProgressIndicator from '@/components/shared/ProgressIndicator'

<ProgressIndicator
  currentStep={2}
  totalSteps={5}
  percentage={40}
  label="Step"
  subtle={false}
/>
```

### QuestionCard

Renders survey questions with various input types.

```jsx
import QuestionCard from '@/components/shared/QuestionCard'

<QuestionCard
  question="What is your child's age?"
  type="multiple-choice"  // 'multiple-choice' | 'checkbox' | 'rating' | 'text' | 'textarea'
  options={[
    { value: '5-7', label: '5-7' },
    { value: '8-10', label: '8-10' }
  ]}
  value={answer}
  onChange={(newValue) => setAnswer(newValue)}
  questionId="q1"
/>
```

## State Management

The application uses React Context API for global state management via `OnboardingContext`.

### Using the Context

```jsx
import { useOnboardingState } from '@/lib/context/OnboardingContext'

function MyComponent() {
  const {
    currentStep,
    surveyAnswers,
    insuranceUploaded,
    faqOpen,
    setCurrentStep,
    setSurveyAnswer,
    setInsuranceUploaded,
    setFaqOpen,
    isInitialized
  } = useOnboardingState()

  // Use state and setters...
}
```

### State Structure

```javascript
{
  currentStep: 1-5,              // Current onboarding step
  surveyAnswers: {},              // { questionId: answer }
  insuranceUploaded: false,      // Insurance upload status
  faqOpen: false,                // FAQ chatbot open/closed
  isInitialized: false           // Whether state has loaded from localStorage
}
```

### State Persistence

State is automatically persisted to `localStorage` with the prefix `daybreak_onboarding_`. The following keys are used:

- `current_step`: Current step number
- `survey_answers`: Survey responses object
- `insurance_uploaded`: Boolean insurance status
- `faq_open`: Boolean FAQ state

State is validated and sanitized on load to handle corrupted data gracefully.

## Design System

The design system is defined in `lib/constants/design-system.js` and integrated with Tailwind CSS.

### Colors

- **Primary**: Calming blue/teal (`primary-500: #00bcd4`)
- **Secondary**: Warm accent (`secondary-500: #ff9800`)
- **Success**: Soft green (`success-500: #4caf50`)
- **Informational**: Blue (`informational-500: #2196f3`)
- **Warning**: Amber (`warning-500: #ffc107`)
- **Neutral**: Grays (`neutral-50` to `neutral-950`)

### Typography

- **Font Family**: Inter (Google Fonts)
- **Font Sizes**: xs (12px) to 5xl (48px)
- **Font Weights**: light (300), normal (400), medium (500), semibold (600), bold (700)

### Spacing

Consistent spacing scale from 0.5 (2px) to 24 (96px).

### Breakpoints

- **Mobile**: max-width 639px
- **Tablet**: 640px - 1024px
- **Desktop**: min-width 1025px

## Survey Questions

Survey questions are defined in `lib/constants/survey-questions.js`. The survey includes:

- **13 questions** across 4 categories:
  - Basic Information (Q1-Q3)
  - Symptoms & Concerns (Q4-Q7)
  - History (Q8-Q11)
  - Goals (Q12-Q13)

- **Conditional logic**: Q10 (medication details) only shows if Q9 answer is "yes"

- **Question types**: Multiple choice, checkboxes, rating scale (1-5), text input, textarea

- **All questions are optional**: Users can skip any question

## Navigation

Navigation between steps is handled by the `useStepNavigation` hook:

```jsx
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'

const {
  currentStep,
  goToStep,
  goToNextStep,
  goToPreviousStep,
  isFirstStep,
  isLastStep
} = useStepNavigation()
```

Browser history is automatically managed, and the back/forward buttons work correctly.

## Accessibility

The application is designed to be WCAG 2.1 AA compliant:

- **Keyboard navigation**: All interactive elements are keyboard accessible
- **Screen reader support**: ARIA labels and semantic HTML throughout
- **Focus indicators**: Visible focus states on all interactive elements
- **Reduced motion**: Respects `prefers-reduced-motion` media query
- **Color contrast**: Meets WCAG AA standards
- **Text resizing**: Supports up to 200% text zoom

## Error Handling

Comprehensive error handling is implemented throughout:

- **File upload errors**: Specific messages for file size, type, and network errors
- **localStorage errors**: Handles disabled storage, quota exceeded, and corrupted data
- **State validation**: Invalid state is detected and reset to defaults
- **Network errors**: Graceful handling with user-friendly messages
- **Browser compatibility**: Fallbacks for unsupported features

## Performance

- **Code splitting**: Automatic with Next.js App Router
- **Image optimization**: Next.js Image component (when used)
- **Lazy loading**: Components loaded on demand
- **Transition optimization**: CSS transitions respect reduced motion preferences

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### Code Style

- ESLint configuration: `next/core-web-vitals`
- JavaScript ES6+ features
- Functional components with hooks
- Consistent naming conventions

### Adding New Questions

1. Add question definition to `lib/constants/survey-questions.js`
2. Include in appropriate screen number
3. Add conditional logic if needed
4. Question will automatically appear in the survey flow

### Customizing the Design System

Edit `lib/constants/design-system.js` to modify:
- Colors
- Typography
- Spacing
- Layout constraints
- Transitions
- Border radius
- Shadows

Changes will automatically be available via Tailwind classes.

## Testing

Manual testing checklist:

- [ ] Complete onboarding flow end-to-end
- [ ] Test all navigation paths (next, previous, browser back/forward)
- [ ] Test file upload with various file types and sizes
- [ ] Test survey with all question types
- [ ] Test state persistence (refresh page)
- [ ] Test error cases (invalid files, network errors)
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Test on mobile devices
- [ ] Test with localStorage disabled

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Or deploy to a platform like Vercel, Netlify, or AWS.

## License

[Add your license here]

## Support

For questions or issues, please contact the development team.
