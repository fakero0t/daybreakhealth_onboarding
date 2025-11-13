'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import FileUpload from '@/components/shared/FileUpload'
import Button from '@/components/shared/Button'
import FAQChatbot from '@/components/shared/FAQChatbot'

/**
 * InsuranceUpload Component
 * 
 * Screen for uploading front of insurance card with extraction and review.
 */
export default function InsuranceUpload() {
  const { goToNextStep } = useStepNavigation()
  const { setInsuranceUploaded, setExtractedInsuranceData, extractedInsuranceData, setInsuranceValidationResults } = useOnboardingState()
  const [cardFile, setCardFile] = useState(null)
  const [cardError, setCardError] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [editableData, setEditableData] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const validationTimeoutRef = useRef(null)

  // Handle file selection
  const handleCardSelect = useCallback((file) => {
    setCardFile(file)
    setCardError(null)
    setShowReview(false)
    setExtractedData(null)
    setEditableData(null)
  }, [])

  // Handle file removal
  const handleCardRemove = useCallback(() => {
    setCardFile(null)
    setCardError(null)
    setShowReview(false)
    setExtractedData(null)
    setEditableData(null)
  }, [])

  // Extract insurance data from image
  const handleExtract = useCallback(async () => {
    if (!cardFile) {
      setCardError('Please select a file first')
      return
    }

    setIsExtracting(true)
    setCardError(null)

    try {
      const formData = new FormData()
      formData.append('file', cardFile)

      const response = await fetch('/api/extract-insurance', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error messages
        if (response.status === 503) {
          setCardError('Please wait a moment and try again')
        } else if (response.status === 504) {
          setCardError('Processing took too long. Please try again or enter information manually.')
        } else if (response.status === 400 && data.missingField) {
          setCardError(data.error || 'Unable to extract required information. Please enter information manually.')
        } else {
          setCardError(data.error || 'Unable to process image. Please enter information manually.')
        }
        setIsExtracting(false)
        return
      }

      // Success - show review screen
      setExtractedData(data)
      setEditableData({ ...data })
      setShowReview(true)
      setExtractedInsuranceData(data)
      setIsExtracting(false)
    } catch (error) {
      console.error('Error extracting insurance data:', error)
      setCardError('Unable to process image. Please enter information manually.')
      setIsExtracting(false)
    }
  }, [cardFile, setExtractedInsuranceData])

  // Validate insurance
  const validateInsurance = useCallback(async (insuranceName, state) => {
    if (!insuranceName || insuranceName.trim().length === 0) {
      return
    }

    setIsValidating(true)

    try {
      const response = await fetch('/api/match-insurance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insurance_company_name: insuranceName,
          plan_holder_state: state || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResults(data)
        setInsuranceValidationResults(data)
      } else {
        // Validation failed but allow user to proceed
        setValidationResults({
          is_valid_insurance: false,
          is_in_network: false,
          message: 'Unable to validate insurance. You can still proceed.',
          confidence: 'low'
        })
      }
    } catch (error) {
      console.error('Error validating insurance:', error)
      setValidationResults({
        is_valid_insurance: false,
        is_in_network: false,
        message: 'Unable to validate insurance. You can still proceed.',
        confidence: 'low'
      })
    } finally {
      setIsValidating(false)
    }
  }, [setInsuranceValidationResults])

  // Handle field edit with auto re-validation
  const handleFieldEdit = useCallback((field, value) => {
    const updatedData = {
      ...editableData,
      [field]: value
    }
    setEditableData(updatedData)

    // Auto re-validate if insurance_company_name or plan_holder_state changed
    if (field === 'insurance_company_name' || field === 'plan_holder_state') {
      // Clear existing timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      // Debounce validation (wait 500ms after user stops typing)
      validationTimeoutRef.current = setTimeout(() => {
        validateInsurance(
          updatedData.insurance_company_name,
          updatedData.plan_holder_state
        )
      }, 500)
    }
  }, [editableData, validateInsurance])

  // Handle confirm extracted data
  const handleConfirm = useCallback(async () => {
    // Update context with edited data
    setExtractedInsuranceData(editableData)
    setExtractedData(editableData)

    // Validate insurance before proceeding
    if (editableData.insurance_company_name) {
      await validateInsurance(
        editableData.insurance_company_name,
        editableData.plan_holder_state
      )
    }

    // Navigate to results screen
    setShowReview(false)
    setInsuranceUploaded(true)
    goToNextStep()
  }, [editableData, setExtractedInsuranceData, setInsuranceUploaded, goToNextStep, validateInsurance])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  // Handle submit - proceed to next step
  const handleSubmit = useCallback((e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    
    setCardError(null)
    setInsuranceUploaded(true)
    goToNextStep()
  }, [setInsuranceUploaded, goToNextStep])

  // If showing review screen
  if (showReview && editableData) {
    return (
      <main className="min-h-screen bg-background-muted-teal" role="main">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
              Review Insurance Information
            </h1>
            <p className="text-base sm:text-lg text-text-body">
              Please review and edit the extracted information.
            </p>
          </div>

          {/* Review Form */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              {/* Insurance Company Name (Required) */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Insurance Company Name <span className="text-warning-500">*</span>
                </label>
                <input
                  type="text"
                  value={editableData.insurance_company_name || ''}
                  onChange={(e) => handleFieldEdit('insurance_company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Member ID */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Member ID
                </label>
                <input
                  type="text"
                  value={editableData.member_id || ''}
                  onChange={(e) => handleFieldEdit('member_id', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Group ID */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Group ID
                </label>
                <input
                  type="text"
                  value={editableData.group_id || ''}
                  onChange={(e) => handleFieldEdit('group_id', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Plan Holder Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editableData.plan_holder_first_name || ''}
                    onChange={(e) => handleFieldEdit('plan_holder_first_name', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editableData.plan_holder_last_name || ''}
                    onChange={(e) => handleFieldEdit('plan_holder_last_name', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Date of Birth (YYYY-MM-DD)
                </label>
                <input
                  type="text"
                  value={editableData.plan_holder_dob || ''}
                  onChange={(e) => handleFieldEdit('plan_holder_dob', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={editableData.plan_holder_city || ''}
                  onChange={(e) => handleFieldEdit('plan_holder_city', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={editableData.plan_holder_state || ''}
                    onChange={(e) => handleFieldEdit('plan_holder_state', e.target.value.toUpperCase())}
                    placeholder="XX"
                    maxLength={2}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={editableData.plan_holder_zip_code || ''}
                    onChange={(e) => handleFieldEdit('plan_holder_zip_code', e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Confidence Badge */}
              {extractedData?.confidence && (
                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-sm text-text-secondary">
                    Extraction Confidence: <span className="font-medium capitalize">{extractedData.confidence}</span>
                  </p>
                </div>
              )}

              {/* Validation Status */}
              {isValidating && (
                <div className="pt-4 border-t border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                    <p className="text-sm text-text-secondary">Checking insurance...</p>
                  </div>
                </div>
              )}
              {validationResults && !isValidating && (
                <div className="pt-4 border-t border-neutral-200">
                  <p className={`text-sm font-medium ${
                    validationResults.is_valid_insurance && validationResults.is_in_network
                      ? 'text-success-600'
                      : validationResults.is_valid_insurance
                      ? 'text-warning-600'
                      : 'text-text-secondary'
                  }`}>
                    {validationResults.message}
                  </p>
                  {validationResults.confidence && (
                    <p className="text-xs text-text-secondary mt-1">
                      Match Confidence: <span className="font-medium capitalize">{validationResults.confidence}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button
              type="button"
              onClick={() => {
                setShowReview(false)
                setEditableData(null)
              }}
              variant="secondary"
              size="large"
              ariaLabel="Go back to upload"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              variant="primary"
              size="large"
              ariaLabel="Confirm extracted data"
            >
              Confirm
            </Button>
          </div>
        </div>

        <FAQChatbot />
      </main>
    )
  }

  // Main upload screen
  return (
    <main className="min-h-screen bg-background-muted-teal" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
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

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {cardFile && !isExtracting && (
            <Button
              type="button"
              onClick={handleExtract}
              variant="primary"
              size="large"
              ariaLabel="Continue"
            >
              Continue
            </Button>
          )}
          {isExtracting && (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              <span className="text-text-body">Analyzing card...</span>
            </div>
          )}
          {!cardFile && (
            <Button
              type="button"
              onClick={handleSubmit}
              variant="primary"
              size="large"
              ariaLabel="Continue to next step"
            >
              Continue
            </Button>
          )}
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
