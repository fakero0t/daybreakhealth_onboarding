/**
 * useStepNavigation Hook
 * 
 * Custom hook for handling step navigation in the onboarding flow.
 * Provides functions to navigate between steps with browser history support.
 */

import { useCallback } from 'react'
import { useOnboardingState } from '../context/OnboardingContext'

/**
 * Hook for step navigation
 * @returns {Object} Navigation functions and current step info
 */
export function useStepNavigation() {
  const { currentStep, setCurrentStep } = useOnboardingState()

  /**
   * Navigate to a specific step
   * @param {number} step - Step number (1-8, where 1 is landing page)
   */
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= 8) {
      setCurrentStep(step)
    }
  }, [setCurrentStep])

  /**
   * Navigate to next step
   */
  const goToNextStep = useCallback(() => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, setCurrentStep])

  /**
   * Navigate to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep, setCurrentStep])

  /**
   * Check if can go to next step
   * @returns {boolean} True if there is a next step
   */
  const canGoNext = currentStep < 8

  /**
   * Check if can go to previous step
   * @returns {boolean} True if there is a previous step
   */
  const canGoPrevious = currentStep > 1

  /**
   * Check if at first step
   * @returns {boolean} True if at step 1
   */
  const isFirstStep = currentStep === 1

  /**
   * Check if at last step
   * @returns {boolean} True if at step 8
   */
  const isLastStep = currentStep === 8

  return {
    currentStep,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
  }
}

