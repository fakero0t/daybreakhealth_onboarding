'use client'

import { useState, useCallback } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import FileUpload from '@/components/shared/FileUpload'
import Button from '@/components/shared/Button'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceUpload Component
 * 
 * Screen for uploading front of insurance card with validation and processing.
 */
export default function InsuranceUpload() {
  const { goToNextStep, goToPreviousStep, canGoPrevious } = useStepNavigation()
  const { setInsuranceUploaded } = useOnboardingState()
  const [cardFile, setCardFile] = useState(null)
  const [cardError, setCardError] = useState(null)

  // Handle file selection
  const handleCardSelect = useCallback((file) => {
    setCardFile(file)
    setCardError(null)
  }, [])

  // Handle file removal
  const handleCardRemove = useCallback(() => {
    setCardFile(null)
    setCardError(null)
  }, [])

  // Handle submit - always proceed to next step (no data sent)
  const handleSubmit = useCallback((e) => {
    // Prevent default if called from a form
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    
    // Clear any errors
    setCardError(null)
    
    // Save upload status (even if no file) and proceed to next step
    setInsuranceUploaded(true)
    goToNextStep()
  }, [setInsuranceUploaded, goToNextStep])

  return (
    <main className="min-h-screen bg-background-muted-teal" role="main">
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
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
              Back
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
            Insurance Card
          </h1>
          <p className="text-base sm:text-lg text-text-body">
            Upload a photo of your insurance card.
          </p>
        </div>

        {/* File Upload Form */}
        <div className="mb-8 max-w-xl mx-auto">
          <FileUpload
            label="Insurance Card"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            maxSize={10 * 1024 * 1024}
            onFileSelect={handleCardSelect}
            onFileRemove={handleCardRemove}
            preview={cardFile}
            error={cardError}
            required={false}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-8">
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            size="large"
            ariaLabel="Continue to next step"
          >
            Continue
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Make sure the photo is clear and readable.
          </p>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

