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
      // Note: Step 5 is removed (was Demographics Part 2)
      // Valid steps: 1=Landing, 2=Demo1, 3=Survey, 4=Encouragement, 6=Insurance Upload, 7=Insurance Results, 8=Scheduling
      if (typeof currentStep !== 'number' || isNaN(currentStep) || currentStep < 1 || currentStep > 8 || currentStep === 5) {
        console.warn(`Invalid currentStep detected: ${currentStep}. Resetting to step 1.`)
        setCurrentStep(1)
      }
    }
  }, [isInitialized, currentStep, setCurrentStep])

  // Scroll to top whenever step changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      // Find the main scrollable container and scroll it to top
      const mainElement = document.querySelector('main[role="main"]')
      if (mainElement) {
        mainElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      }
      // Also scroll window as fallback
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    }
  }, [currentStep, isInitialized])

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

  // Demographics Part 2 removed - EncouragementScreen now goes directly to InsuranceUpload

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

  // Render appropriate screen based on current step
  // Internal steps: 1=Landing, 2=Demo1, 3=Survey, 4=Encouragement, 6=Insurance Upload, 7=Insurance Results, 8=Scheduling
  // User-facing steps: 1=Demo1, 2=Survey, 3=Encouragement, 4=Insurance, 5=Scheduling
  const renderScreen = () => {
    switch (currentStep) {
      case 1: // Landing Page (not counted in progress)
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
      case 4: // User-facing Step 3: Encouragement Screen
        return <EncouragementScreen />
      case 6: // User-facing Step 4: Insurance Upload
        return <InsuranceUpload />
      case 7: // User-facing Step 4: Insurance Results (same step as upload)
        return <InsuranceResults />
      case 8: // User-facing Step 5: Scheduling
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
