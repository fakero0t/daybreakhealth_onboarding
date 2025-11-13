'use client'

import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import Button from '@/components/shared/Button'

/**
 * EncouragementScreen Component
 * 
 * Positive reinforcement screen shown between questionnaire and demographics part 2
 * Encourages users to continue and lets them know they're making progress
 */
export default function EncouragementScreen() {
  const { goToNextStep, canGoPrevious, goToPreviousStep } = useStepNavigation()

  return (
    <main className="min-h-screen bg-background-cream" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Back Button */}
        {canGoPrevious && (
          <div className="mb-6">
            <Button
              onClick={goToPreviousStep}
              variant="text"
              size="medium"
              ariaLabel="Go back to previous step"
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <CheckCircleIcon className="w-20 h-20 text-primary-500 mx-auto" aria-hidden="true" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-6">
            You're Doing Great!
          </h1>

          {/* Encouraging Message */}
          <div className="mb-8 space-y-4 text-lg text-text-body">
            <p>
              Thanks for sharing that information.
            </p>
            <p className="font-medium text-primary-500">
              Just a few more questions.
            </p>
          </div>

          {/* Continue Button */}
          <Button
            onClick={goToNextStep}
            variant="primary"
            size="large"
            ariaLabel="Continue"
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  )
}

