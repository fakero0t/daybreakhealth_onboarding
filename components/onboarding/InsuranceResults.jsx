'use client'

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceResults Component
 * 
 * Results screen showing insurance validation status (valid/invalid, in-network/out-of-network).
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
  const is_in_network = insuranceValidationResults?.is_in_network || false
  const message = insuranceValidationResults?.message || 'Unable to validate insurance. You can still proceed.'
  const confidence = insuranceValidationResults?.confidence || 'low'
  const insuranceName = extractedInsuranceData?.insurance_company_name || insuranceValidationResults?.matched_insurance?.name || 'Your insurance'

  // Determine status type
  let statusType = 'invalid'
  let StatusIcon = XCircleIcon
  let statusColor = 'text-text-secondary'
  let bgColor = 'bg-neutral-100'
  let iconColor = 'text-neutral-500'

  if (is_valid && is_in_network) {
    statusType = 'valid_in_network'
    StatusIcon = CheckCircleIcon
    statusColor = 'text-success-600'
    bgColor = 'bg-success-100'
    iconColor = 'text-success-600'
  } else if (is_valid && !is_in_network) {
    statusType = 'valid_out_of_network'
    StatusIcon = ExclamationTriangleIcon
    statusColor = 'text-warning-600'
    bgColor = 'bg-warning-100'
    iconColor = 'text-warning-600'
  }

  return (
    <main className="min-h-screen bg-background-cream" role="main">
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
            
            {/* Match Confidence Badge */}
            {confidence && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-sm text-text-secondary mt-2">
                <span className="mr-2">Match Confidence:</span>
                <span className="font-medium capitalize">{confidence}</span>
              </div>
            )}
          </div>

          {/* Status Details */}
          <div className="max-w-2xl mx-auto mb-8">
            {statusType === 'valid_in_network' && (
              <p className="text-base text-text-body">
                Your insurance is accepted by our network of clinicians.
              </p>
            )}
            {statusType === 'valid_out_of_network' && (
              <p className="text-base text-text-body">
                Your insurance is recognized but not currently accepted by our network. You can still proceed with your appointment.
              </p>
            )}
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
