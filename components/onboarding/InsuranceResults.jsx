'use client'

import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceResults Component
 * 
 * Results screen showing insurance approval with supportive messaging.
 * Always shows approved outcome.
 */
export default function InsuranceResults() {
  const { goToNextStep } = useStepNavigation()

  const handleContinue = () => {
    goToNextStep()
  }

  return (
    <main className="min-h-screen bg-background-cream" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={3}
            totalSteps={5}
            percentage={60}
          />
        </div>

        {/* Success Content */}
        <div className="text-center mb-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-success-100 p-4">
              <CheckCircleIcon className="w-16 h-16 text-success-600" aria-hidden="true" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
            Great news! Your insurance is accepted.
          </h1>

          {/* Next Steps */}
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <p className="text-base sm:text-lg text-text-body">
              We&apos;re ready to help you and your child take the next step.
            </p>
            <p className="text-base text-text-body">
              Next, we&apos;ll ask you a few questions about your child&apos;s needs.
              This helps us understand how we can best support your family and match
              you with the right clinician.
            </p>
            <p className="text-base text-text-secondary">
              All questions are optional, and you can take your time answering them.
            </p>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              variant="primary"
              size="large"
              ariaLabel="Continue to intake survey"
            >
              Continue to Survey
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

