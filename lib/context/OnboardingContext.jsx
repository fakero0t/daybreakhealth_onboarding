'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  saveToLocalStorage, 
  loadFromLocalStorage 
} from '../utils/localStorage'

/**
 * OnboardingContext
 * 
 * Manages global state for the onboarding flow including:
 * - Current step (1-5)
 * - Survey answers
 * - Insurance upload status
 * - FAQ open/closed state
 */

const OnboardingContext = createContext(undefined)

const STORAGE_KEYS = {
  CURRENT_STEP: 'current_step',
  SURVEY_ANSWERS: 'survey_answers',
  INSURANCE_UPLOADED: 'insurance_uploaded',
  FAQ_OPEN: 'faq_open',
}

const INITIAL_STATE = {
  currentStep: 1,
  surveyAnswers: {},
  insuranceUploaded: false,
  faqOpen: false,
}

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Validate and sanitize state
  const validateState = useCallback((state) => {
    // Validate currentStep (must be 1-5)
    const step = typeof state.currentStep === 'number' && !isNaN(state.currentStep) && state.currentStep >= 1 && state.currentStep <= 5
      ? state.currentStep
      : 1

    // Validate surveyAnswers (must be object)
    const answers = typeof state.surveyAnswers === 'object' && state.surveyAnswers !== null && !Array.isArray(state.surveyAnswers)
      ? state.surveyAnswers
      : {}

    // Validate insuranceUploaded (must be boolean)
    const insurance = typeof state.insuranceUploaded === 'boolean'
      ? state.insuranceUploaded
      : false

    // Validate faqOpen (must be boolean)
    const faq = typeof state.faqOpen === 'boolean'
      ? state.faqOpen
      : false

    return {
      currentStep: step,
      surveyAnswers: answers,
      insuranceUploaded: insurance,
      faqOpen: faq,
    }
  }, [])

  // Load state from localStorage on mount
  useEffect(() => {
    try {
    const savedStep = loadFromLocalStorage(STORAGE_KEYS.CURRENT_STEP, 1)
    const savedAnswers = loadFromLocalStorage(STORAGE_KEYS.SURVEY_ANSWERS, {})
    const savedInsurance = loadFromLocalStorage(STORAGE_KEYS.INSURANCE_UPLOADED, false)
    const savedFaq = loadFromLocalStorage(STORAGE_KEYS.FAQ_OPEN, false)

    const loadedState = {
      currentStep: savedStep,
      surveyAnswers: savedAnswers,
      insuranceUploaded: savedInsurance,
      faqOpen: savedFaq,
    }

    // Validate and sanitize loaded state
    const validatedState = validateState(loadedState)
    setState(validatedState)
    } catch (error) {
      console.error('Error initializing state:', error)
      setState(INITIAL_STATE)
    } finally {
      // CRITICAL: Always set isInitialized, even if there's an error
    setIsInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return

    saveToLocalStorage(STORAGE_KEYS.CURRENT_STEP, state.currentStep)
    saveToLocalStorage(STORAGE_KEYS.SURVEY_ANSWERS, state.surveyAnswers)
    saveToLocalStorage(STORAGE_KEYS.INSURANCE_UPLOADED, state.insuranceUploaded)
    saveToLocalStorage(STORAGE_KEYS.FAQ_OPEN, state.faqOpen)
  }, [state, isInitialized])

  // Update current step
  const setCurrentStep = useCallback((step) => {
    // Validate step before setting
    const validStep = typeof step === 'number' && !isNaN(step) && step >= 1 && step <= 5
      ? step
      : 1

    setState(prev => ({ ...prev, currentStep: validStep }))
    
    // Update browser history
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      try {
        const url = `/?step=${validStep}`
        window.history.pushState({ step: validStep }, '', url)
      } catch (error) {
        // Fallback if history API fails
        console.warn('Unable to update browser history:', error)
      }
    }
  }, [])

  // Update survey answer
  const setSurveyAnswer = useCallback((questionId, answer) => {
    // Validate questionId is a string
    if (typeof questionId !== 'string' || questionId.length === 0) {
      console.warn('Invalid questionId provided to setSurveyAnswer')
      return
    }

    // Sanitize answer - allow null, undefined, string, number, boolean, or array
    // but ensure arrays contain only valid values
    let sanitizedAnswer = answer
    if (Array.isArray(answer)) {
      sanitizedAnswer = answer.filter(item => item !== null && item !== undefined)
    }

    setState(prev => ({
      ...prev,
      surveyAnswers: {
        ...prev.surveyAnswers,
        [questionId]: sanitizedAnswer,
      },
    }))
  }, [])

  // Update multiple survey answers at once
  const setSurveyAnswers = useCallback((answers) => {
    setState(prev => ({
      ...prev,
      surveyAnswers: {
        ...prev.surveyAnswers,
        ...answers,
      },
    }))
  }, [])

  // Update insurance upload status
  const setInsuranceUploaded = useCallback((uploaded) => {
    setState(prev => ({ ...prev, insuranceUploaded: uploaded }))
  }, [])

  // Toggle FAQ open/closed
  const setFaqOpen = useCallback((open) => {
    setState(prev => ({ ...prev, faqOpen: open }))
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (event) => {
      if (event.state && event.state.step) {
        setState(prev => ({ ...prev, currentStep: event.state.step }))
      } else {
        // Parse step from URL if state doesn't have it
        const urlParams = new URLSearchParams(window.location.search)
        const step = parseInt(urlParams.get('step') || '1', 10)
        if (step >= 1 && step <= 5) {
          setState(prev => ({ ...prev, currentStep: step }))
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Initialize URL state on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return

    const urlParams = new URLSearchParams(window.location.search)
    const stepFromUrl = parseInt(urlParams.get('step') || state.currentStep.toString(), 10)
    
    if (stepFromUrl >= 1 && stepFromUrl <= 5 && stepFromUrl !== state.currentStep) {
      setState(prev => ({ ...prev, currentStep: stepFromUrl }))
    } else {
      // Update URL to match current step
      const url = `/?step=${state.currentStep}`
      window.history.replaceState({ step: state.currentStep }, '', url)
    }
  }, [isInitialized, state.currentStep])

  const value = {
    ...state,
    setCurrentStep,
    setSurveyAnswer,
    setSurveyAnswers,
    setInsuranceUploaded,
    setFaqOpen,
    isInitialized,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

/**
 * Hook to access onboarding state
 * @returns {Object} Onboarding state and setters
 */
export function useOnboardingState() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboardingState must be used within an OnboardingProvider')
  }
  return context
}

