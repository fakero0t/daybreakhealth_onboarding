'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useStepNavigation } from '@/lib/hooks/useStepNavigation'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import CharacterCounter from '@/components/shared/CharacterCounter'
import SymptomReviewForm from '@/components/onboarding/SymptomReviewForm'
import { saveToLocalStorage, loadFromLocalStorage, removeFromLocalStorage, isLocalStorageAvailable } from '@/lib/utils/localStorage'
import { logQuestionTime, logRetry, logSymptomEdit, logFormCompletion } from '@/lib/utils/analytics'

// Narrative answers are NOT persisted to sessionStorage
// They only exist in component state during the current session

const QUESTIONS = [
  {
    id: 'q1',
    text: "Tell me what a typical day looks like for your child — from morning to bedtime. What parts of the day tend to go smoothly, and what parts are more challenging?",
    placeholder: "Share details about your child's typical day, including routines, activities, and any challenges...",
    // Purpose: Extract information about daily functioning, routines, and challenges
  },
  {
    id: 'q2',
    text: "How does your child usually respond to other people — like family, friends, or teachers? Can you share a recent example of how they handled a good day and a tough day?",
    placeholder: "Describe how your child interacts with others and handles different situations...",
    // Purpose: Extract social behavior, peer relationships, and emotional regulation
  },
  {
    id: 'q3',
    text: "How would you describe your child's energy, attention, and motivation lately? For instance, what do you notice when they're playing, doing homework, or relaxing?",
    placeholder: "Describe your child's energy levels, focus, and motivation in various activities...",
    // Purpose: Extract information about energy levels, attention span, focus, and motivation
  },
  {
    id: 'q4',
    text: "What have you noticed about your child's sleep, eating, or physical habits recently? Have any routines changed?",
    placeholder: "Share any changes or observations about sleep, eating, or physical habits...",
    // Purpose: Extract sleep patterns, eating behaviors, and physical symptoms
  },
  {
    id: 'q5',
    text: "If you had to describe what's been most different or concerning about your child in the past couple of weeks, what would that be?",
    placeholder: "Describe what's been most concerning or different about your child recently...",
    // Purpose: Extract primary concerns and recent changes
  }
]

/**
 * IntakeSurvey Component
 * 
 * Handles the 5-question narrative flow for intake assessment.
 * Questions are answered sequentially with validation and auto-save.
 */
export default function IntakeSurvey() {
  const { goToNextStep, goToPreviousStep, currentStep, canGoPrevious } = useStepNavigation()
  const { extractedSymptoms, setExtractedSymptoms, setExtractionMetadata, extractionMetadata } = useOnboardingState()
  const [currentQuestion, setCurrentQuestion] = useState(1) // 1-5
  const [narrativeAnswers, setNarrativeAnswers] = useState({
    q1: '', q2: '', q3: '', q4: '', q5: ''
  })
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [extractionError, setExtractionError] = useState(null)
  const [extractionStep, setExtractionStep] = useState(null) // 'analyzing' | 'extracting' | 'finalizing'
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [saveConfirmations, setSaveConfirmations] = useState({})
  const [localStorageWarning, setLocalStorageWarning] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const debounceTimerRef = useRef(null)
  const symptomDebounceTimersRef = useRef({})
  const textareaRef = useRef(null)
  const questionTextRef = useRef(null)
  const abortControllerRef = useRef(null)
  const inFlightRequestRef = useRef(false)
  const questionStartTimeRef = useRef(null)
  const extractionStartTimeRef = useRef(null)

  // Detect sessionStorage support on mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      setLocalStorageWarning(true)
      console.warn('sessionStorage is not available. Continuing with in-memory storage only.')
    }
  }, [])

  // Narrative answers are NOT persisted to sessionStorage
  // Users always start with a fresh question list

  // Track question time - start timer on question load
  useEffect(() => {
    if (currentQuestion >= 1 && currentQuestion <= 5 && !showReviewForm && !isProcessing) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentQuestion, showReviewForm, isProcessing])

  // Log question time on navigation
  const logQuestionTimeOnNavigation = useCallback((questionId) => {
    if (questionStartTimeRef.current) {
      const timeSpent = Date.now() - questionStartTimeRef.current
      logQuestionTime(questionId, timeSpent)
      questionStartTimeRef.current = null
    }
  }, [])

  // Narrative answers are NOT persisted to sessionStorage
  // They only exist in component state during the current session

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [narrativeAnswers])

  // Validation function
  const validateAnswer = useCallback((answer) => {
    if (!answer || answer.trim().length < 10) {
      return "Please provide at least 10 characters"
    }
    if (answer.length > 5000) {
      return "Response must be 5,000 characters or less"
    }
    return null
  }, [])

  // Handle answer change
  const handleAnswerChange = useCallback((questionId, value) => {
    setNarrativeAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    // Clear error for this question when user starts typing
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }, [errors])

  // Navigation handlers
  const handleNext = useCallback(() => {
    const questionId = `q${currentQuestion}`
    const answer = narrativeAnswers[questionId] || ''
    const error = validateAnswer(answer)

    if (error) {
      setErrors(prev => ({ ...prev, [questionId]: error }))
      return
    }

    // Log question time before navigation
    logQuestionTimeOnNavigation(questionId)

    // Clear error and move to next question
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })

    if (currentQuestion < 5) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }, [currentQuestion, narrativeAnswers, validateAnswer, logQuestionTimeOnNavigation])

  const handlePrevious = useCallback(() => {
    if (currentQuestion > 1) {
      // Log question time before navigation
      const questionId = `q${currentQuestion}`
      logQuestionTimeOnNavigation(questionId)
      setCurrentQuestion(currentQuestion - 1)
    }
  }, [currentQuestion, logQuestionTimeOnNavigation])

  // Extract symptoms from narrative answers
  const extractSymptoms = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (inFlightRequestRef.current) {
      return
    }

    inFlightRequestRef.current = true
    setIsProcessing(true)
    setExtractionError(null)
    setExtractionStep('analyzing')
    extractionStartTimeRef.current = Date.now()

    // Log question time for Q5
    logQuestionTimeOnNavigation('q5')

    // Create AbortController for request cancellation
    abortControllerRef.current = new AbortController()

    try {
      // Prepare answers array
      const answers = [
        narrativeAnswers.q1 || '',
        narrativeAnswers.q2 || '',
        narrativeAnswers.q3 || '',
        narrativeAnswers.q4 || '',
        narrativeAnswers.q5 || ''
      ]

      // Update progress step
      setExtractionStep('extracting')

      // Make API request
      const response = await fetch('/api/extract-symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
        signal: abortControllerRef.current.signal,
      })

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return
      }

      // Update progress step
      setExtractionStep('finalizing')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Unable to process responses. Please try again.'

        // Map status codes to exact error messages from PRD
        let exactErrorMessage
        if (response.status === 500) {
          exactErrorMessage = 'Unable to connect. Please check your internet connection and try again.'
        } else if (response.status === 503) {
          exactErrorMessage = 'Service temporarily unavailable. Please try again in a moment.'
        } else if (response.status === 504) {
          exactErrorMessage = 'Request took too long. Please try again.'
        } else if (response.status === 400) {
          exactErrorMessage = 'Unable to process responses. Please try again.'
        } else {
          exactErrorMessage = errorMessage
        }

        setExtractionError(exactErrorMessage)
        setIsProcessing(false)
        inFlightRequestRef.current = false
        setRetryCount(prev => prev + 1)
        logRetry()
        return
      }

      const data = await response.json()

      // Store extracted symptoms in context
      if (data.symptoms) {
        setExtractedSymptoms(data.symptoms)
      }

      // Store extraction metadata
      if (data.metadata) {
        setExtractionMetadata({
          extractedAt: data.metadata.extractedAt || Date.now(),
          model: data.metadata.model || 'gpt-3.5-turbo'
        })
      }

      // Clear narrative answers from component state
      setNarrativeAnswers({ q1: '', q2: '', q3: '', q4: '', q5: '' })

      // Show review form instead of navigating immediately
      setIsProcessing(false)
      setShowReviewForm(true)

    } catch (error) {
      // Check if request was aborted
      if (error.name === 'AbortError' || abortControllerRef.current.signal.aborted) {
        return
      }

      // Handle network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        setExtractionError('Unable to connect. Please check your internet connection and try again.')
      } else {
        setExtractionError('Unable to process responses. Please try again.')
      }

      setIsProcessing(false)
      setRetryCount(prev => prev + 1)
      logRetry()
    } finally {
      inFlightRequestRef.current = false
      abortControllerRef.current = null
    }
  }, [narrativeAnswers, setExtractedSymptoms, setExtractionMetadata, goToNextStep, logQuestionTimeOnNavigation])

  const handleContinue = useCallback(() => {
    const questionId = `q${currentQuestion}`
    const answer = narrativeAnswers[questionId] || ''
    const error = validateAnswer(answer)

    if (error) {
      setErrors(prev => ({ ...prev, [questionId]: error }))
      return
    }

    // Validate all 5 answers before proceeding
    const allAnswers = [
      narrativeAnswers.q1 || '',
      narrativeAnswers.q2 || '',
      narrativeAnswers.q3 || '',
      narrativeAnswers.q4 || '',
      narrativeAnswers.q5 || ''
    ]

    for (let i = 0; i < allAnswers.length; i++) {
      const answerError = validateAnswer(allAnswers[i])
      if (answerError) {
        setErrors(prev => ({ ...prev, [`q${i + 1}`]: answerError }))
        return
      }
    }

    // Clear errors
    setErrors({})

    // Trigger extraction
    extractSymptoms()
  }, [currentQuestion, narrativeAnswers, validateAnswer, extractSymptoms])

  // Browser navigation handling
  useEffect(() => {
    // Push state to enable back button interception
    window.history.pushState({ page: 'intake-survey' }, '', window.location.href)

    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm('Are you sure you want to go back? Your progress may be lost.')
        if (!confirmed) {
          // Push state back to prevent navigation
          window.history.pushState({ page: 'intake-survey' }, '', window.location.href)
          return
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

  // Multiple tab detection
  useEffect(() => {
    // Set flag to indicate this tab is active
    const tabFlag = `intake_survey_active_${Date.now()}`
    try {
      saveToLocalStorage('intake_survey_tab_flag', tabFlag)
    } catch (error) {
      console.warn('Could not set tab flag:', error)
    }

    const handleStorageChange = (e) => {
      if (e.key === 'daybreak_onboarding_intake_survey_tab_flag' && e.newValue && e.newValue !== tabFlag) {
        const confirmed = window.confirm('This form is open in another tab. Continuing here may overwrite changes in the other tab. Continue?')
        if (!confirmed) {
          // Reload to sync with other tab
          window.location.reload()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Focus management - focus textarea on question load
  useEffect(() => {
    if (textareaRef.current && !showReviewForm && !isProcessing) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [currentQuestion, showReviewForm, isProcessing])

  // Check if browser was closed during processing
  useEffect(() => {
    if (isProcessing && extractionStartTimeRef.current) {
      // Check if processing started but we're back (browser was closed)
      const processingTime = Date.now() - extractionStartTimeRef.current
      if (processingTime > 120000) { // More than 2 minutes suggests browser was closed
        setIsProcessing(false)
        setExtractionError('Your session was interrupted. Please try again.')
        extractionStartTimeRef.current = null
      }
    }
  }, [isProcessing])

  // Handle symptom change with debounced auto-save
  const handleSymptomChange = useCallback((symptomKey, newValue) => {
    // Clear existing debounce timer for this symptom
    if (symptomDebounceTimersRef.current[symptomKey]) {
      clearTimeout(symptomDebounceTimersRef.current[symptomKey])
    }

    // Debounce auto-save (exactly 500ms - consistent timing)
    symptomDebounceTimersRef.current[symptomKey] = setTimeout(() => {
      // Update context
      setExtractedSymptoms(prev => ({
        ...prev,
        [symptomKey]: newValue || ''
      }))

      // Show checkmark confirmation
      setSaveConfirmations(prev => ({ ...prev, [symptomKey]: true }))

      // Log symptom edit
      logSymptomEdit(symptomKey)

      // Clear checkmark after exactly 2 seconds
      setTimeout(() => {
        setSaveConfirmations(prev => {
          const newState = { ...prev }
          delete newState[symptomKey]
          return newState
        })
      }, 2000)

      // Clean up timer reference
      delete symptomDebounceTimersRef.current[symptomKey]
    }, 500)
  }, [setExtractedSymptoms])

  // Handle review continue
  const handleReviewContinue = useCallback(() => {
    // Log form completion
    logFormCompletion()
    // Proceed to Scheduling Assistant
    goToNextStep()
  }, [goToNextStep])

  // Handle going back from review form to edit questions
  const handleBackToQuestions = useCallback(() => {
    // Clear extracted symptoms and metadata to allow regeneration
    setExtractedSymptoms({})
    setExtractionMetadata({ extractedAt: null, model: null })
    // Hide review form
    setShowReviewForm(false)
    // Reset to question 5 (where they clicked Continue)
    setCurrentQuestion(5)
    // Clear any extraction errors
    setExtractionError(null)
  }, [setExtractedSymptoms, setExtractionMetadata])

  // Check if we should show review form (if symptoms exist in context)
  // Only show review form if extraction metadata exists (meaning questions were actually completed)
  useEffect(() => {
    const hasCompletedQuestions = extractionMetadata?.extractedAt !== null
    
    if (
      extractedSymptoms && 
      Object.keys(extractedSymptoms).length > 0 && 
      !showReviewForm && 
      !isProcessing && 
      !extractionError &&
      hasCompletedQuestions
    ) {
      setShowReviewForm(true)
    }
  }, [extractedSymptoms, showReviewForm, isProcessing, extractionError, extractionMetadata])

  // Cleanup on unmount - cancel any in-flight requests
  useEffect(() => {
    const timers = symptomDebounceTimersRef.current
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Clear all symptom debounce timers
      Object.values(timers).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // Get current question data
  const currentQuestionData = QUESTIONS[currentQuestion - 1]
  const currentAnswer = narrativeAnswers[currentQuestionData.id] || ''
  const currentError = errors[currentQuestionData.id]
  const isAnswerValid = currentAnswer.trim().length >= 10 && currentAnswer.length <= 5000

  // Review form UI (Phase 3)
  if (showReviewForm && extractedSymptoms && Object.keys(extractedSymptoms).length > 0) {
    return (
      <main className="min-h-screen bg-background-cream" role="main">
        <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
          {/* Back Buttons */}
          <div className="mb-6 flex gap-4">
            {/* Back to Questions Button */}
            <Button
              onClick={handleBackToQuestions}
              variant="text"
              size="medium"
              ariaLabel="Go back to edit questions"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
              Edit Questions
            </Button>
            {/* Back to Previous Step Button */}
            {canGoPrevious && (
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
            )}
          </div>

          {/* Skip link */}
          <a
            href="#symptom-review-summary"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
          >
            Skip to symptom review
          </a>

          {/* Review Form */}
          <SymptomReviewForm
            extractedSymptoms={extractedSymptoms}
            onSymptomChange={handleSymptomChange}
            onContinue={handleReviewContinue}
            saveConfirmations={saveConfirmations}
          />
        </div>
      </main>
    )
  }

  // Loading state UI (Phase 2)
  if (isProcessing && !extractionError) {
    const getStepText = () => {
      switch (extractionStep) {
        case 'analyzing':
          return 'Analyzing...'
        case 'extracting':
          return 'Extracting symptoms...'
        case 'finalizing':
          return 'Finalizing...'
        default:
          return 'Analyzing your responses...'
      }
    }

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
                <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                Back
              </Button>
            </div>
          )}

          <div className="max-w-3xl mx-auto text-center">
            {/* Spinner */}
            <div className="mb-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>

            {/* Progress message */}
            <div className="mb-4">
              <p className="text-lg font-medium text-primary-500 mb-2">
                Analyzing your responses...
              </p>
              <p className="text-base text-text-secondary">
                {getStepText()}
              </p>
            </div>

            {/* Progress steps */}
            <div className="space-y-2 mb-8">
              <div className={`text-sm ${extractionStep === 'analyzing' ? 'text-primary-500 font-medium' : 'text-text-secondary'}`}>
                {extractionStep === 'analyzing' ? '✓' : extractionStep === 'extracting' || extractionStep === 'finalizing' ? '✓' : '○'} Analyzing...
              </div>
              <div className={`text-sm ${extractionStep === 'extracting' ? 'text-primary-500 font-medium' : extractionStep === 'finalizing' ? 'text-primary-500 font-medium' : 'text-text-secondary'}`}>
                {extractionStep === 'extracting' || extractionStep === 'finalizing' ? '✓' : '○'} Extracting symptoms...
              </div>
              <div className={`text-sm ${extractionStep === 'finalizing' ? 'text-primary-500 font-medium' : 'text-text-secondary'}`}>
                {extractionStep === 'finalizing' ? '✓' : '○'} Finalizing...
              </div>
            </div>
          </div>

            {/* ARIA live region for screen readers */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {extractionStep === 'analyzing' && 'Analyzing responses'}
              {extractionStep === 'extracting' && 'Extracting symptoms'}
              {extractionStep === 'finalizing' && 'Finalizing'}
            </div>
        </div>
      </main>
    )
  }

  // Error state UI
  if (extractionError) {
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
                <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
                Back
              </Button>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            {/* Error message */}
            <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-base text-red-800 font-medium mb-2">
                Error
              </p>
              <p className="text-base text-red-700">
                {extractionError}
              </p>
            </div>

            {/* Retry button */}
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setExtractionError(null)
                  extractSymptoms()
                }}
                variant="primary"
                size="medium"
                ariaLabel="Retry extraction"
              >
                Retry
              </Button>
            </div>

            {/* ARIA live region for error announcements */}
            <div aria-live="assertive" aria-atomic="true" className="sr-only">
              {extractionError}
            </div>
          </div>
        </div>
      </main>
    )
  }

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
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
              Back
            </Button>
          </div>
        )}

        {/* Skip link */}
        <a
          href={`#question-text-${currentQuestionData.id}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
        >
          Skip to question
        </a>

        {/* localStorage warning */}
        {localStorageWarning && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p>Note: Your browser&apos;s storage is unavailable or full. Your progress will not be saved if you close this page.</p>
          </div>
        )}

        {/* Question Screen UI */}
        <div className="max-w-3xl mx-auto">
          {/* Progress text */}
          <div className="mb-6 text-center">
            <p className="text-base text-text-secondary">
              Question {currentQuestion} of 5
            </p>
          </div>

          {/* Question text */}
          <div className="mb-6" id={`question-text-${currentQuestionData.id}`} ref={questionTextRef}>
            <h2 className="text-lg font-heading font-medium text-primary-500 mb-4" style={{ fontSize: '18px' }}>
              {currentQuestionData.text}
            </h2>
          </div>

          {/* Text area */}
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              id={`answer-${currentQuestionData.id}`}
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
              placeholder={currentQuestionData.placeholder}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-y-auto bg-white shadow-sm"
              style={{ height: '200px', minHeight: '200px' }}
              aria-label={currentQuestionData.text}
              aria-describedby={`char-counter-${currentQuestionData.id} ${currentError ? `error-${currentQuestionData.id}` : ''}`}
              aria-invalid={!!currentError}
            />
          </div>

          {/* Character counter */}
          <div className="mb-2" id={`char-counter-${currentQuestionData.id}`}>
            <CharacterCounter
              currentCount={currentAnswer.length}
              maxCount={5000}
            />
          </div>

          {/* Character minimum hint */}
          {currentAnswer.length < 10 && (
            <div className="mb-4">
              <p className="text-sm text-text-secondary">
                Please provide at least 10 characters
            </p>
          </div>
          )}

          {/* Error message */}
          {currentError && (
            <div className="mb-4" id={`error-${currentQuestionData.id}`} role="alert" aria-live="assertive">
              <p className="text-sm text-red-600">
                {currentError}
              </p>
            </div>
          )}

          {/* ARIA live region for auto-save confirmations */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {hasUnsavedChanges && 'Changes are being saved automatically'}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4 mt-8">
            <Button
              onClick={handlePrevious}
              variant="outline"
              size="medium"
              disabled={currentQuestion === 1}
              ariaLabel="Go to previous question"
            >
              Previous
            </Button>

            {currentQuestion < 5 ? (
              <Button
                onClick={handleNext}
                variant="primary"
                size="medium"
                disabled={!isAnswerValid}
                ariaLabel="Go to next question"
              >
                Next
              </Button>
            ) : (
            <Button
                onClick={handleContinue}
              variant="primary"
                size="medium"
                disabled={!isAnswerValid || isProcessing}
                ariaLabel="Continue to extraction"
              >
                Continue
            </Button>
            )}
          </div>
        </div>
      </div>
      </main>
    )
}
