'use client'

import { useCallback, useEffect, useRef } from 'react'
import { SYMPTOMS, SYMPTOM_CATEGORIES, getSymptomsByCategory } from '@/lib/constants/symptom-mapping'
import Button from '@/components/shared/Button'
import ProgressIndicator from '@/components/shared/ProgressIndicator'

/**
 * SymptomReviewForm Component
 * 
 * Displays and allows editing of extracted symptoms organized by category.
 * Features auto-save with visual confirmation and professional clinical format.
 */
export default function SymptomReviewForm({ extractedSymptoms, onSymptomChange, onContinue, saveConfirmations = {} }) {
  const continueButtonRef = useRef(null)
  const firstEmptyDropdownRef = useRef(null)
  const firstDropdownRef = useRef(null)

  // Calculate summary counts
  const calculateSummary = useCallback(() => {
    let daily = 0
    let some = 0
    let none = 0
    let notFilled = 0

    SYMPTOMS.forEach(symptom => {
      const value = extractedSymptoms[symptom.key] || ''
      if (value === 'Daily') {
        daily++
      } else if (value === 'Some') {
        some++
      } else if (value === 'None') {
        none++
      } else {
        notFilled++
      }
    })

    return { daily, some, none, notFilled }
  }, [extractedSymptoms])

  const summary = calculateSummary()

  // Handle symptom change - call parent handler (debouncing handled in parent)
  const handleSymptomChange = useCallback((symptomKey, newValue) => {
    onSymptomChange(symptomKey, newValue)
  }, [onSymptomChange])

  // Get category order (as defined in SYMPTOM_CATEGORIES)
  const categoryOrder = Object.keys(SYMPTOM_CATEGORIES)

  // Focus management: Focus first empty symptom dropdown on load (if any), otherwise first dropdown
  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstEmptyDropdownRef.current) {
        firstEmptyDropdownRef.current.focus()
      } else if (firstDropdownRef.current) {
        firstDropdownRef.current.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Skip link */}
      <a
        href="#continue-button"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
      >
        Skip to continue button
      </a>

      {/* Progress Indicator - Steps 1-5 */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={2}
          totalSteps={5}
          percentage={40}
          label="Step"
          skipSteps={[]}
        />
      </div>

      {/* Explanatory text */}
      <div className="mb-6">
        <p className="text-base text-text-body">
          Based on your answers, we've identified the following symptoms. Please review and adjust as needed.
        </p>
      </div>

      {/* Summary count display */}
      <div id="symptom-review-summary" className="mb-8 p-4 bg-white rounded-lg border border-neutral-200">
        <p className="text-base text-text-body">
          <strong>{summary.daily}</strong> symptoms marked as <strong>Daily</strong>,{' '}
          <strong>{summary.some}</strong> as <strong>Some</strong>,{' '}
          <strong>{summary.none}</strong> as <strong>None</strong>,{' '}
          <strong>{summary.notFilled}</strong> not yet filled
        </p>
      </div>

      {/* ARIA live region for summary updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {summary.daily} symptoms marked as Daily, {summary.some} as Some, {summary.none} as None, {summary.notFilled} not yet filled
      </div>

      {/* Category sections */}
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const categorySymptoms = getSymptomsByCategory(category)

          return (
            <div key={category} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {/* Category header */}
              <div 
                className="px-4 py-4 bg-gray-100 border-b border-gray-200"
                style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}
              >
                <h2 className="text-xl font-semibold text-primary-500" style={{ fontSize: '20px' }}>
                  {category}
                </h2>
              </div>

              {/* Symptoms in category */}
              <div className="px-4 py-4 space-y-4" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
                {categorySymptoms.map((symptom) => {
                  const value = extractedSymptoms[symptom.key] || ''
                  const isEmpty = value === ''
                  const showCheckmark = saveConfirmations[symptom.key]

                  return (
                    <div
                      key={symptom.key}
                      className={`p-4 rounded-lg border transition-colors ${
                        isEmpty
                          ? 'bg-yellow-100 border-yellow-300'
                          : 'bg-white border-neutral-200'
                      }`}
                      style={
                        isEmpty
                          ? { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }
                          : {}
                      }
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Symptom label */}
                        <div className="flex-1">
                          <label
                            htmlFor={`symptom-${symptom.key}`}
                            className="text-base text-text-body block mb-2"
                            style={{ fontSize: '16px' }}
                          >
                            {symptom.label}
                            {isEmpty && (
                              <span className="ml-2 text-yellow-600" aria-label="Warning: not filled">
                                ⚠️
                              </span>
                            )}
                          </label>
                        </div>

                        {/* Dropdown and checkmark */}
                        <div className="flex items-center gap-2">
                          {/* Dropdown */}
                          <select
                            id={`symptom-${symptom.key}`}
                            ref={
                              categoryOrder.indexOf(category) === 0 && categorySymptoms.indexOf(symptom) === 0
                                ? (isEmpty ? firstEmptyDropdownRef : firstDropdownRef)
                                : isEmpty && !firstEmptyDropdownRef.current
                                  ? firstEmptyDropdownRef
                                  : null
                            }
                            value={value}
                            onChange={(e) => handleSymptomChange(symptom.key, e.target.value)}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                              isEmpty ? 'border-yellow-400' : 'border-neutral-300'
                            }`}
                            aria-label={`Select value for ${symptom.label}`}
                          >
                            <option value="">-- Select --</option>
                            <option value="Daily">Daily</option>
                            <option value="Some">Some</option>
                            <option value="None">None</option>
                          </select>

                          {/* Checkmark confirmation */}
                          {showCheckmark && (
                            <span
                              className="text-primary-500 transition-opacity duration-300"
                              aria-label="Saved"
                              role="status"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Continue button */}
      <div className="mt-8 flex justify-center">
        <Button
          id="continue-button"
          ref={continueButtonRef}
          onClick={onContinue}
          variant="primary"
          size="medium"
          ariaLabel="Continue to next step"
        >
          Continue
        </Button>
      </div>

      {/* ARIA live region for auto-save confirmations */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {Object.keys(saveConfirmations).length > 0 && 'Saved'}
      </div>
    </div>
  )
}

