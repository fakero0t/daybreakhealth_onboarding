'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceResults Component
 * 
 * Results screen showing insurance validation status (valid/invalid).
 * User can always proceed regardless of validation status.
 */
export default function InsuranceResults() {
  const { goToNextStep, goToPreviousStep } = useStepNavigation()
  const { insuranceValidationResults, extractedInsuranceData } = useOnboardingState()

  const handleContinue = () => {
    goToNextStep()
  }

  const handleEdit = () => {
    goToPreviousStep()
  }

  // Determine status and icon
  const is_valid = insuranceValidationResults?.is_valid_insurance || false
  const message = insuranceValidationResults?.message || 'Unable to validate insurance. You can still proceed.'
  const insuranceName = extractedInsuranceData?.insurance_company_name || insuranceValidationResults?.matched_insurance?.name || 'Your insurance'

  // Check if message indicates not in network
  const isNotInNetwork = message.toLowerCase().includes('not currently in our network') || message.toLowerCase().includes('not in our network')

  // Determine status type
  let statusType = 'invalid'
  let StatusIcon = XCircleIcon
  let statusColor = 'text-text-secondary'
  let bgColor = 'bg-neutral-100'
  let iconColor = 'text-neutral-500'

  if (is_valid) {
    if (isNotInNetwork) {
      // Insurance is valid but not in network - show yellow
      statusType = 'not_in_network'
      StatusIcon = CheckCircleIcon
      statusColor = 'text-warning-600'
      bgColor = 'bg-warning-100'
      iconColor = 'text-warning-600'
    } else {
      // Insurance is valid and in network - show green
      statusType = 'valid'
      StatusIcon = CheckCircleIcon
      statusColor = 'text-success-600'
      bgColor = 'bg-success-100'
      iconColor = 'text-success-600'
    }
  }

  return (
    <main className="h-screen bg-background-cream overflow-y-auto" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Results Content */}
        <div className="text-center mb-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className={`rounded-full ${bgColor} p-4`}>
              <StatusIcon className={`w-16 h-16 ${iconColor}`} aria-hidden="true" />
            </div>
          </div>

          {/* Insurance Company Name */}
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
            {insuranceName}
          </h1>

          {/* Validation Status Message */}
          <div className="max-w-2xl mx-auto mb-6">
            <p className={`text-lg font-medium ${statusColor} mb-2`}>
              {message}
            </p>
          </div>

          {/* Status Details */}
          <div className="max-w-2xl mx-auto mb-8">
            {statusType === 'invalid' && (
              <p className="text-base text-text-body">
                We couldn&apos;t verify your insurance information. You can still proceed with your appointment.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleEdit}
              variant="secondary"
              size="large"
              ariaLabel="Edit insurance information"
            >
              Edit Insurance Info
            </Button>
            <Button
              onClick={handleContinue}
              variant="primary"
              size="large"
              ariaLabel="Continue to next step"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}
