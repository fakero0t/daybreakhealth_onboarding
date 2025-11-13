'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import TopProgressBar from '@/components/shared/TopProgressBar'

// Lazy load all onboarding screens for faster initial load
const LandingPage = dynamic(() => import('@/components/onboarding/LandingPage'), {
  loading: () => <div className="min-h-screen bg-neutral-50 flex items-center justify-center"><p className="text-neutral-600">Loading...</p></div>
})

const DemographicsWizard = dynamic(() => import('@/components/demographics/DemographicsWizard'))
const IntakeSurvey = dynamic(() => import('@/components/onboarding/IntakeSurvey'))
const EncouragementScreen = dynamic(() => import('@/components/onboarding/EncouragementScreen'))
const InsuranceUpload = dynamic(() => import('@/components/onboarding/InsuranceUpload'))
const InsuranceResults = dynamic(() => import('@/components/onboarding/InsuranceResults'))
const SchedulingAssistant = dynamic(() => import('@/components/onboarding/SchedulingAssistant'))

/**
 * Main Onboarding Flow
 * 
 * Orchestrates the entire onboarding flow by conditionally rendering
 * screens based on the current step from OnboardingContext.
 * Components are lazy loaded for optimal performance.
 */
export default function Home() {
  const { currentStep, isInitialized, setCurrentStep } = useOnboardingState()

  // Handle invalid state - default to step 1 (landing page)
  useEffect(() => {
    if (isInitialized) {
      // Validate currentStep is a valid number between 1 and 8 (internal routing)
      // Note: Landing page (1) is not counted in user-facing step count
      if (typeof currentStep !== 'number' || isNaN(currentStep) || currentStep < 1 || currentStep > 8) {
        console.warn(`Invalid currentStep detected: ${currentStep}. Resetting to step 1.`)
        setCurrentStep(1)
      }
    }
  }, [isInitialized, currentStep, setCurrentStep])

  // Demographics Part 1 completion handler
  const handleDemographicsPart1Complete = useCallback((data) => {
    console.log('Demographics Part 1 completed:', data)
    // Navigate to Intake Survey (Step 3)
    setCurrentStep(3)
  }, [setCurrentStep])

  // Demographics Part 1 skip handler
  const handleDemographicsPart1Skip = useCallback(() => {
    console.log('User skipped demographics part 1')
    // Navigate to Intake Survey anyway
    setCurrentStep(3)
  }, [setCurrentStep])

  // Demographics Part 2 completion handler
  const handleDemographicsPart2Complete = useCallback((data) => {
    console.log('Demographics Part 2 completed:', data)
    // Navigate to Insurance Upload (Step 6)
    setCurrentStep(6)
  }, [setCurrentStep])

  // Demographics Part 2 skip handler
  const handleDemographicsPart2Skip = useCallback(() => {
    console.log('User skipped demographics part 2')
    // Navigate to Insurance Upload anyway
    setCurrentStep(6)
  }, [setCurrentStep])

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
  // Internal routing uses 1-8, but user-facing steps are 1-6 (landing page not counted, insurance combined)
  const renderScreen = () => {
    switch (currentStep) {
      case 1: // Landing Page (not counted as a step in progress)
        return <LandingPage />
      case 2: // User-facing Step 1: Demographics - Basic Information
        return (
          <DemographicsWizard 
            patientId="temp-patient-id" 
            onComplete={handleDemographicsPart1Complete}
            onSkipAll={handleDemographicsPart1Skip}
            part={1}
          />
        )
      case 3: // User-facing Step 2: Intake Survey
        return <IntakeSurvey />
      case 4: // User-facing Step 3: Encouragement Screen (hidden in progress pills)
        return <EncouragementScreen />
      case 5: // User-facing Step 4: Additional Information
        return (
          <DemographicsWizard 
            patientId="temp-patient-id" 
            onComplete={handleDemographicsPart2Complete}
            onSkipAll={handleDemographicsPart2Skip}
            part={2}
          />
        )
      case 6: // User-facing Step 5: Insurance Upload
        return <InsuranceUpload />
      case 7: // User-facing Step 5: Insurance Results (same step as upload)
        return <InsuranceResults />
      case 8: // User-facing Step 6: Scheduling
        return <SchedulingAssistant />
      default:
        // Fallback to step 1 if invalid step
        return <LandingPage />
    }
  }

  return (
    <>
      {/* Universal top progress bar - shows on all pages except landing */}
      <TopProgressBar currentStep={currentStep} />
      
      <div className="page-transition">
        {renderScreen()}
      </div>
    </>
  )
}
