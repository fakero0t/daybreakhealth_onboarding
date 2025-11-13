'use client'

import ProgressIndicator from '@/components/shared/ProgressIndicator'
import { useOnboardingState } from '@/lib/context/OnboardingContext'

/**
 * TopProgressBar Component
 * 
 * Universal top menu bar that displays progress across all onboarding steps.
 * Shows on all pages except the landing page.
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Current internal step number (1-8)
 */
export default function TopProgressBar({ currentStep }) {
  const { appointmentConfirmed } = useOnboardingState()
  // Don't show on landing page (step 1)
  if (currentStep === 1) {
    return null
  }

  // Map internal steps to user-facing steps
  // Internal: 1=Landing, 2=Demo1, 3=Survey, 4=Encouragement, 5=Demo2, 6=Insurance Upload, 7=Insurance Results, 8=Scheduling
  // User-facing: 1=Demo1, 2=Survey, 3=Encouragement+Demo2, 4=Insurance, 5=Scheduling
  
  let displayStep = currentStep - 1 // Adjust for landing page
  
  // Encouragement (4) and Demo2 (5) both show as step 3
  if (currentStep === 4 || currentStep === 5) {
    displayStep = 3
  } else if (currentStep === 6 || currentStep === 7) {
    // Insurance upload (6) and results (7) both show as step 4
    displayStep = 4
  } else if (currentStep === 8) {
    displayStep = 5
  }

  // Calculate percentage (5 total steps)
  const percentage = Math.round((displayStep / 5) * 100)

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <ProgressIndicator
          currentStep={displayStep}
          totalSteps={5}
          percentage={percentage}
          skipSteps={[]}
          label="Step"
          completedSteps={appointmentConfirmed && displayStep === 5 ? [5] : []}
        />
      </div>
    </div>
  )
}

