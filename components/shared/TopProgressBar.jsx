'use client'

import { useCallback } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import DaybreakLogo from '@/components/shared/DaybreakLogo'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { clearOnboardingState } from '@/lib/utils/localStorage'

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
  const { appointmentConfirmed, setCurrentStep } = useOnboardingState()
  const { goToPreviousStep, canGoPrevious } = useStepNavigation()

  // Handle logo click - reset all progress and return to landing screen
  const handleLogoClick = useCallback(() => {
    // Clear all onboarding state from sessionStorage
    clearOnboardingState()
    // Reset to landing page (step 1)
    setCurrentStep(1)
  }, [setCurrentStep])
  // Don't show on landing page (step 1)
  if (currentStep === 1) {
    return null
  }

  // Map internal steps to user-facing steps
  // Internal: 1=Landing, 2=Demo1, 3=Survey, 4=Encouragement, 6=Insurance Upload, 7=Insurance Results, 8=Scheduling
  // User-facing: 1=Demo1, 2=Survey, 3=Encouragement, 4=Insurance, 5=Scheduling
  
  let displayStep
  if (currentStep <= 4) {
    displayStep = currentStep - 1 // Steps 2-4 map to 1-3
  } else if (currentStep === 6 || currentStep === 7) {
    displayStep = 4 // Insurance upload and results both show as step 4
  } else if (currentStep === 8) {
    displayStep = 5 // Scheduling shows as step 5
  } else {
    displayStep = 1 // Fallback
  }

  // Calculate percentage (5 total steps)
  const percentage = Math.round((displayStep / 5) * 100)

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center relative">
          {/* Left side: Logo and Back button */}
          <div className="flex items-center gap-4 -ml-2">
            {/* Logo - clickable to reset progress */}
            <button
              onClick={handleLogoClick}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50"
              aria-label="Return to home"
            >
              <DaybreakLogo size="default" />
            </button>

            {/* Back Button */}
            {canGoPrevious && (
              <button
                onClick={goToPreviousStep}
                className="flex items-center gap-2 text-primary-500 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-50"
                aria-label="Go back to previous step"
              >
                <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                <span className="text-base font-medium">Back</span>
              </button>
            )}
          </div>

          {/* Progress Indicator - Pills Only - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <ProgressIndicator
              currentStep={displayStep}
              totalSteps={5}
              percentage={percentage}
              skipSteps={[]}
              label="Step"
              completedSteps={appointmentConfirmed && displayStep === 5 ? [5] : []}
              showLabels={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

