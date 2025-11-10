'use client'

import { useEffect } from 'react'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import LandingPage from '@/components/onboarding/LandingPage'
import InsuranceUpload from '@/components/onboarding/InsuranceUpload'
import InsuranceResults from '@/components/onboarding/InsuranceResults'
import IntakeSurvey from '@/components/onboarding/IntakeSurvey'
import SchedulingAssistant from '@/components/onboarding/SchedulingAssistant'

/**
 * Main Onboarding Flow
 * 
 * Orchestrates the entire onboarding flow by conditionally rendering
 * screens based on the current step from OnboardingContext.
 */
export default function Home() {
  const { currentStep, isInitialized, setCurrentStep } = useOnboardingState()

  // Handle invalid state - default to step 1
  useEffect(() => {
    if (isInitialized) {
      // Validate currentStep is a valid number between 1 and 5
      if (typeof currentStep !== 'number' || isNaN(currentStep) || currentStep < 1 || currentStep > 5) {
        console.warn(`Invalid currentStep detected: ${currentStep}. Resetting to step 1.`)
        setCurrentStep(1)
      }
    }
  }, [isInitialized, currentStep, setCurrentStep])

  // Wait for state to initialize before rendering
  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  // Render appropriate screen based on current step with smooth transition
  const renderScreen = () => {
    switch (currentStep) {
      case 1:
        return <LandingPage />
      case 2:
        return <InsuranceUpload />
      case 3:
        return <InsuranceResults />
      case 4:
        return <IntakeSurvey />
      case 5:
        return <SchedulingAssistant />
      default:
        // Fallback to step 1 if invalid step
        return <LandingPage />
    }
  }

  return (
    <div className="page-transition">
      {renderScreen()}
    </div>
  )
}
