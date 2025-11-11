'use client'

import { useState, useCallback } from 'react'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import FileUpload from '@/components/shared/FileUpload'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceUpload Component
 * 
 * Screen for uploading front and back of insurance card with validation and processing.
 */
export default function InsuranceUpload() {
  const { goToNextStep } = useStepNavigation()
  const { setInsuranceUploaded } = useOnboardingState()
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontError, setFrontError] = useState(null)
  const [backError, setBackError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle file selection for front
  const handleFrontSelect = useCallback((file) => {
    setFrontFile(file)
    setFrontError(null)
  }, [])

  // Handle file removal for front
  const handleFrontRemove = useCallback(() => {
    setFrontFile(null)
    setFrontError(null)
  }, [])

  // Handle file selection for back
  const handleBackSelect = useCallback((file) => {
    setBackFile(file)
    setBackError(null)
  }, [])

  // Handle file removal for back
  const handleBackRemove = useCallback(() => {
    setBackFile(null)
    setBackError(null)
  }, [])

  // Mock insurance verification
  // In production, this would be a real API call with proper error handling
  const mockInsuranceVerification = useCallback(async () => {
    // Simulate 2-3 second delay
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Always return approved (mock implementation)
    return {
      status: 'accepted',
      message: 'Great news! Your insurance is accepted.',
      canProceed: true,
    }
  }, [])

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!frontFile || !backFile) {
      // Set specific error messages for missing files
      if (!frontFile) {
        setFrontError('Please upload the front of your insurance card.')
      }
      if (!backFile) {
        setBackError('Please upload the back of your insurance card.')
      }
      return
    }

    // Clear any previous errors
    setFrontError(null)
    setBackError(null)
    setIsProcessing(true)

    try {
      const result = await mockInsuranceVerification()
      
      if (result && result.canProceed) {
        // Save upload status
        setInsuranceUploaded(true)
        
        // Small delay for smooth transition
        setTimeout(() => {
          goToNextStep()
        }, 100)
      } else {
        // Handle unexpected response
        setBackError('We couldn\'t verify your insurance. Please try again or contact support if the problem continues.')
      }
    } catch (error) {
      // Handle network errors and other exceptions
      const errorMessage = error?.message || 'An unexpected error occurred'
      console.error('Insurance verification error:', error)
      
      if (errorMessage.includes('Network') || errorMessage.includes('network')) {
        setBackError('We couldn\'t connect to our servers. Please check your internet connection and try again.')
      } else {
        setBackError('We couldn\'t verify your insurance at this time. Please try again or contact support if the problem continues.')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [frontFile, backFile, mockInsuranceVerification, setInsuranceUploaded, goToNextStep])

  const canSubmit = frontFile && backFile && !isProcessing

  return (
    <main className="min-h-screen bg-background-muted-teal" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator
            currentStep={2}
            totalSteps={5}
            percentage={40}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
            Insurance Information
          </h1>
          <p className="text-base sm:text-lg text-text-body">
            Let&apos;s check your insurance coverage. This will only take a moment.
          </p>
        </div>

        {/* Empty State Message (when no files uploaded) */}
        {!frontFile && !backFile && (
          <div className="bg-informational-50 border border-informational-200 rounded-lg p-6 mb-8">
            <p className="text-base text-informational-800 text-center">
              Please submit your insurance card to continue. We&apos;ll need both the front and back of your card.
            </p>
          </div>
        )}

        {/* File Upload Forms */}
        <div className="space-y-6 mb-8">
          {/* Front of Insurance Card */}
          <FileUpload
            label="Front of Insurance Card"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            maxSize={10 * 1024 * 1024}
            onFileSelect={handleFrontSelect}
            onFileRemove={handleFrontRemove}
            preview={frontFile}
            error={frontError}
            required={true}
          />

          {/* Back of Insurance Card */}
          <FileUpload
            label="Back of Insurance Card"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            maxSize={10 * 1024 * 1024}
            onFileSelect={handleBackSelect}
            onFileRemove={handleBackRemove}
            preview={backFile}
            error={backError}
            required={true}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="large"
            disabled={!canSubmit}
            loading={isProcessing}
            ariaLabel={isProcessing ? 'Processing insurance verification' : 'Submit insurance cards'}
          >
            {isProcessing ? 'Processing...' : 'Submit Insurance Cards'}
          </Button>
        </div>

        {/* Loading Announcement for Screen Readers */}
        {isProcessing && (
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Processing insurance verification, please wait...
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            Both front and back of your insurance card are required to proceed.
          </p>
        </div>
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}

