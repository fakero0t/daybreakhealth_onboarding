'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { 
  saveToLocalStorage, 
  loadFromLocalStorage,
  removeFromLocalStorage
} from '../utils/localStorage'
import { getAllSymptomKeys } from '../constants/symptom-mapping'

/**
 * OnboardingContext
 * 
 * Manages global state for the onboarding flow including:
 * - Current step (1-5)
 * - Extracted symptoms (UI-only, not persisted to backend)
 * - Extraction metadata
 * - Insurance upload status
 * - FAQ open/closed state
 */

const OnboardingContext = createContext(undefined)

const STORAGE_KEYS = {
  CURRENT_STEP: 'current_step',
  EXTRACTED_SYMPTOMS: 'extracted_symptoms',
  EXTRACTION_METADATA: 'extraction_metadata',
  INSURANCE_UPLOADED: 'insurance_uploaded',
  FAQ_OPEN: 'faq_open',
  SCHEDULING_INPUT: 'scheduling_input',
  INTERPRETED_PREFERENCES: 'interpreted_preferences',
  MATCHED_SLOTS: 'matched_slots',
  SELECTED_SLOT: 'selected_slot',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
}

const INITIAL_STATE = {
  currentStep: 1,
  extractedSymptoms: {},
  extractionMetadata: { extractedAt: null, model: null },
  insuranceUploaded: false,
  faqOpen: false,
  schedulingInput: '',
  interpretedPreferences: null,
  matchedSlots: [],
  selectedSlot: null,
  appointmentConfirmed: false,
}

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)
  const [isInitialized, setIsInitialized] = useState(false)

  // Validate and sanitize state
  const validateState = useCallback((state) => {
    // Validate currentStep (must be 1-8)
    const step = typeof state.currentStep === 'number' && !isNaN(state.currentStep) && state.currentStep >= 1 && state.currentStep <= 8
      ? state.currentStep
      : 1

    // Validate extractedSymptoms (must be object with valid symptom keys and values)
    let symptoms = {}
    if (typeof state.extractedSymptoms === 'object' && state.extractedSymptoms !== null && !Array.isArray(state.extractedSymptoms)) {
      const allowedValues = ['Daily', 'Some', 'None', '']
      const expectedKeys = getAllSymptomKeys()
      
      // Validate each symptom value
      for (const key of expectedKeys) {
        const value = state.extractedSymptoms[key]
        if (value === undefined || value === null || allowedValues.includes(value)) {
          symptoms[key] = value || ''
        } else {
          // Invalid value, use empty string
          symptoms[key] = ''
        }
      }
      
      // Remove any unexpected keys
      const cleanedSymptoms = {}
      for (const key of expectedKeys) {
        cleanedSymptoms[key] = symptoms[key] || ''
      }
      symptoms = cleanedSymptoms
    }

    // Validate extractionMetadata (must be object with extractedAt and model)
    const metadata = typeof state.extractionMetadata === 'object' && state.extractionMetadata !== null && !Array.isArray(state.extractionMetadata)
      ? {
          extractedAt: typeof state.extractionMetadata.extractedAt === 'number' || state.extractionMetadata.extractedAt === null
            ? state.extractionMetadata.extractedAt
            : null,
          model: typeof state.extractionMetadata.model === 'string' || state.extractionMetadata.model === null
            ? state.extractionMetadata.model
            : null,
        }
      : { extractedAt: null, model: null }

    // Validate insuranceUploaded (must be boolean)
    const insurance = typeof state.insuranceUploaded === 'boolean'
      ? state.insuranceUploaded
      : false

    // Validate faqOpen (must be boolean)
    const faq = typeof state.faqOpen === 'boolean'
      ? state.faqOpen
      : false

    // Validate schedulingInput (must be string)
    const schedulingInput = typeof state.schedulingInput === 'string'
      ? state.schedulingInput
      : ''

    // Validate interpretedPreferences (must be object or null)
    const interpretedPreferences = (state.interpretedPreferences === null || 
      (typeof state.interpretedPreferences === 'object' && !Array.isArray(state.interpretedPreferences)))
      ? state.interpretedPreferences
      : null

    // Validate matchedSlots (must be array)
    const matchedSlots = Array.isArray(state.matchedSlots)
      ? state.matchedSlots
      : []

    // Validate selectedSlot (must be object or null)
    const selectedSlot = (state.selectedSlot === null || 
      (typeof state.selectedSlot === 'object' && !Array.isArray(state.selectedSlot)))
      ? state.selectedSlot
      : null

    // Validate appointmentConfirmed (must be boolean)
    const appointmentConfirmed = typeof state.appointmentConfirmed === 'boolean'
      ? state.appointmentConfirmed
      : false

    return {
      currentStep: step,
      extractedSymptoms: symptoms,
      extractionMetadata: metadata,
      insuranceUploaded: insurance,
      faqOpen: faq,
      schedulingInput,
      interpretedPreferences,
      matchedSlots,
      selectedSlot,
      appointmentConfirmed,
    }
  }, [])

  // Load state from sessionStorage on mount
  useEffect(() => {
    try {
      // Check URL step parameter first (takes precedence over sessionStorage)
      let initialStep = 1
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const stepFromUrl = parseInt(urlParams.get('step') || '0', 10)
        if (stepFromUrl >= 1 && stepFromUrl <= 8) {
          initialStep = stepFromUrl
        }
      }
      
      const savedStep = loadFromLocalStorage(STORAGE_KEYS.CURRENT_STEP, 1)
      const savedSymptoms = loadFromLocalStorage(STORAGE_KEYS.EXTRACTED_SYMPTOMS, {})
      const savedMetadata = loadFromLocalStorage(STORAGE_KEYS.EXTRACTION_METADATA, { extractedAt: null, model: null })
      const savedInsurance = loadFromLocalStorage(STORAGE_KEYS.INSURANCE_UPLOADED, false)
      const savedFaq = loadFromLocalStorage(STORAGE_KEYS.FAQ_OPEN, false)
      const savedSchedulingInput = loadFromLocalStorage(STORAGE_KEYS.SCHEDULING_INPUT, '')
      const savedInterpretedPreferences = loadFromLocalStorage(STORAGE_KEYS.INTERPRETED_PREFERENCES, null)
      const savedMatchedSlots = loadFromLocalStorage(STORAGE_KEYS.MATCHED_SLOTS, [])
      const savedSelectedSlot = loadFromLocalStorage(STORAGE_KEYS.SELECTED_SLOT, null)
      const savedAppointmentConfirmed = loadFromLocalStorage(STORAGE_KEYS.APPOINTMENT_CONFIRMED, false)

      // One-time migration: Clear old surveyAnswers if it exists
      const oldSurveyAnswers = loadFromLocalStorage('survey_answers', null)
      if (oldSurveyAnswers !== null) {
        try {
          removeFromLocalStorage('survey_answers')
        } catch (migrationError) {
          console.warn('Error during migration from surveyAnswers:', migrationError)
        }
      }

      // Use URL step if valid, otherwise use saved step
      const finalStep = (initialStep >= 1 && initialStep <= 5) ? initialStep : savedStep

      const loadedState = {
        currentStep: finalStep,
        extractedSymptoms: savedSymptoms,
        extractionMetadata: savedMetadata,
        insuranceUploaded: savedInsurance,
        faqOpen: savedFaq,
        schedulingInput: savedSchedulingInput,
        interpretedPreferences: savedInterpretedPreferences,
        matchedSlots: savedMatchedSlots,
        selectedSlot: savedSelectedSlot,
        appointmentConfirmed: savedAppointmentConfirmed,
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

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return

    try {
      const saved = saveToLocalStorage(STORAGE_KEYS.CURRENT_STEP, state.currentStep)
      if (!saved) {
        console.warn('Unable to save currentStep to sessionStorage. Continuing with in-memory storage only.')
      }
    } catch (error) {
      console.warn('Error saving currentStep to sessionStorage:', error)
    }

    try {
      const saved = saveToLocalStorage(STORAGE_KEYS.EXTRACTED_SYMPTOMS, state.extractedSymptoms)
      if (!saved) {
        console.warn('Unable to save extractedSymptoms to sessionStorage. Continuing with in-memory storage only.')
      }
    } catch (error) {
      console.warn('Error saving extractedSymptoms to sessionStorage:', error)
    }

    try {
      const saved = saveToLocalStorage(STORAGE_KEYS.EXTRACTION_METADATA, state.extractionMetadata)
      if (!saved) {
        console.warn('Unable to save extractionMetadata to sessionStorage. Continuing with in-memory storage only.')
      }
    } catch (error) {
      console.warn('Error saving extractionMetadata to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.INSURANCE_UPLOADED, state.insuranceUploaded)
    } catch (error) {
      console.warn('Error saving insuranceUploaded to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.FAQ_OPEN, state.faqOpen)
    } catch (error) {
      console.warn('Error saving faqOpen to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.SCHEDULING_INPUT, state.schedulingInput)
    } catch (error) {
      console.warn('Error saving schedulingInput to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.INTERPRETED_PREFERENCES, state.interpretedPreferences)
    } catch (error) {
      console.warn('Error saving interpretedPreferences to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.MATCHED_SLOTS, state.matchedSlots)
    } catch (error) {
      console.warn('Error saving matchedSlots to sessionStorage:', error)
    }

    try {
      saveToLocalStorage(STORAGE_KEYS.SELECTED_SLOT, state.selectedSlot)
    } catch (error) {
      console.warn('Error saving selectedSlot to sessionStorage:', error)
    }
  }, [state, isInitialized])

  // Update current step
  const setCurrentStep = useCallback((step) => {
    // Validate step before setting
    const validStep = typeof step === 'number' && !isNaN(step) && step >= 1 && step <= 8
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

  // Update extracted symptoms object
  const setExtractedSymptoms = useCallback((symptoms) => {
    // Validate symptoms is an object
    if (typeof symptoms !== 'object' || symptoms === null || Array.isArray(symptoms)) {
      console.warn('Invalid symptoms object provided to setExtractedSymptoms')
      return
    }

    setState(prev => ({
      ...prev,
      extractedSymptoms: symptoms,
    }))
  }, [])

  // Update individual extracted symptom
  const setExtractedSymptom = useCallback((symptomKey, value) => {
    // Validate symptomKey is a string
    if (typeof symptomKey !== 'string' || symptomKey.length === 0) {
      console.warn('Invalid symptomKey provided to setExtractedSymptom')
      return
    }

    // Validate value is one of the allowed values or empty string
    const allowedValues = ['Daily', 'Some', 'None', '']
    if (value !== null && value !== undefined && !allowedValues.includes(value)) {
      console.warn(`Invalid symptom value provided: ${value}. Allowed values: Daily, Some, None, or empty string.`)
      return
    }

    setState(prev => ({
      ...prev,
      extractedSymptoms: {
        ...prev.extractedSymptoms,
        [symptomKey]: value || '',
      },
    }))
  }, [])

  // Update extraction metadata
  const setExtractionMetadata = useCallback((metadata) => {
    // Validate metadata is an object
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      console.warn('Invalid metadata object provided to setExtractionMetadata')
      return
    }

    setState(prev => ({
      ...prev,
      extractionMetadata: {
        extractedAt: typeof metadata.extractedAt === 'number' || metadata.extractedAt === null
          ? metadata.extractedAt
          : prev.extractionMetadata.extractedAt,
        model: typeof metadata.model === 'string' || metadata.model === null
          ? metadata.model
          : prev.extractionMetadata.model,
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

  // Update scheduling input
  const setSchedulingInput = useCallback((input) => {
    if (typeof input !== 'string') {
      console.warn('Invalid schedulingInput provided to setSchedulingInput')
      return
    }
    setState(prev => ({ ...prev, schedulingInput: input }))
  }, [])

  // Update interpreted preferences
  const setInterpretedPreferences = useCallback((preferences) => {
    if (preferences !== null && (typeof preferences !== 'object' || Array.isArray(preferences))) {
      console.warn('Invalid interpretedPreferences provided to setInterpretedPreferences')
      return
    }
    setState(prev => ({ ...prev, interpretedPreferences: preferences }))
  }, [])

  // Update matched slots
  const setMatchedSlots = useCallback((slots) => {
    if (!Array.isArray(slots)) {
      console.warn('Invalid matchedSlots provided to setMatchedSlots')
      return
    }
    setState(prev => ({ ...prev, matchedSlots: slots }))
  }, [])

  // Update selected slot
  const setSelectedSlot = useCallback((slot) => {
    if (slot !== null && (typeof slot !== 'object' || Array.isArray(slot))) {
      console.warn('Invalid selectedSlot provided to setSelectedSlot')
      return
    }
    setState(prev => ({ ...prev, selectedSlot: slot }))
  }, [])

  // Update appointment confirmed status
  const setAppointmentConfirmed = useCallback((confirmed) => {
    if (typeof confirmed !== 'boolean') {
      console.warn('Invalid appointmentConfirmed provided to setAppointmentConfirmed')
      return
    }
    setState(prev => ({ ...prev, appointmentConfirmed: confirmed }))
    saveToLocalStorage(STORAGE_KEYS.APPOINTMENT_CONFIRMED, confirmed)
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
        if (step >= 1 && step <= 8) {
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
    
    if (stepFromUrl >= 1 && stepFromUrl <= 8 && stepFromUrl !== state.currentStep) {
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
    setExtractedSymptoms,
    setExtractedSymptom,
    setExtractionMetadata,
    setInsuranceUploaded,
    setFaqOpen,
    setSchedulingInput,
    setInterpretedPreferences,
    setMatchedSlots,
    setSelectedSlot,
    setAppointmentConfirmed,
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

