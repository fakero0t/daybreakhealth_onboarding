'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import { detectUserTimezone } from '@/lib/utils/timezone-utils'
import FAQChatbot from '@/components/shared/FAQChatbot'
import NaturalLanguageScheduling from './NaturalLanguageScheduling'
import AvailabilityResults from './AvailabilityResults'
import SchedulingConfirmation from './SchedulingConfirmation'

// Flow phases (moved outside component to avoid recreation on each render)
const PHASES = {
  INPUT: 'input',
  INTERPRETING: 'interpreting',
  MATCHING: 'matching',
  RESULTS: 'results',
  CONFIRMATION: 'confirmation',
}

/**
 * SchedulingAssistant Component
 * 
 * Natural language scheduling interface with AI-powered interpretation and matching.
 */
export default function SchedulingAssistant() {
  const {
    schedulingInput,
    interpretedPreferences,
    matchedSlots,
    selectedSlot,
    appointmentConfirmed,
    setSchedulingInput,
    setInterpretedPreferences,
    setMatchedSlots,
    setSelectedSlot,
    setAppointmentConfirmed,
    isInitialized,
  } = useOnboardingState()

  const [phase, setPhase] = useState(PHASES.INPUT)
  const [userTimezone, setUserTimezone] = useState('America/Los_Angeles')
  const [error, setError] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Initialize phase based on context state
  useEffect(() => {
    if (!isInitialized) return

    // Restore confirmed state from context
    if (appointmentConfirmed) {
      setIsConfirmed(true)
    }

    // Restore phase based on context state
    if (appointmentConfirmed && selectedSlot) {
      setPhase(PHASES.CONFIRMATION)
    } else if (selectedSlot) {
      setPhase(PHASES.CONFIRMATION)
    } else if (matchedSlots && matchedSlots.length > 0) {
      setPhase(PHASES.RESULTS)
    } else if (schedulingInput) {
      setPhase(PHASES.INPUT)
    }
  }, [isInitialized, selectedSlot, matchedSlots, schedulingInput, appointmentConfirmed])

  // Detect user timezone on mount
  useEffect(() => {
    const detectedTimezone = detectUserTimezone()
    setUserTimezone(detectedTimezone)
  }, [])

  // Handle form submit
  const handleSubmit = async (input) => {
    setSchedulingInput(input)
    setError(null)
    setPhase(PHASES.INTERPRETING)

    try {
      // Step 1: Interpret scheduling preferences
      const interpretResponse = await fetch('/api/interpret-scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: input,
          userTimezone: userTimezone,
        }),
      })

      const interpretData = await interpretResponse.json()

      if (!interpretData.success) {
        throw new Error(interpretData.error || 'Failed to interpret availability')
      }

      setInterpretedPreferences(interpretData.interpretedPreferences)

      // Step 2: Match availability
      setPhase(PHASES.MATCHING)

      const matchResponse = await fetch('/api/match-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interpretedPreferences: interpretData.interpretedPreferences,
          organizationId: 85685,
        }),
      })

      const matchData = await matchResponse.json()

      if (!matchData.success) {
        throw new Error(matchData.error || 'Failed to match availability')
      }

      // Success - show results
      setMatchedSlots(matchData.matchedSlots || [])
      setPhase(PHASES.RESULTS)
    } catch (err) {
      console.error('Scheduling error:', err)

      // Handle different error types
      if (err.message.includes('Connection') || err.message.includes('network')) {
        setError('Connection error. Please check your internet and try again.')
      } else if (err.message.includes('understanding') || err.message.includes('interpret')) {
        setError('We\'re having trouble understanding your availability. Please try rephrasing or contact us for help.')
    } else {
        setError(err.message || 'An error occurred. Please try again.')
      }

      setPhase(PHASES.INPUT)
    }
  }

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
    setPhase(PHASES.CONFIRMATION)
  }

  // Handle confirmation
  const handleConfirm = () => {
    // Show success message
    // Note: No actual appointment booking - just storing preference
    setIsConfirmed(true)
    setAppointmentConfirmed(true)
    // TODO: Navigate to completion/confirmation screen in final onboarding step
  }

  // Handle try again
  const handleTryAgain = () => {
    setPhase(PHASES.INPUT)
    setError(null)
    setMatchedSlots([])
    setSelectedSlot(null)
  }

  // Handle back from confirmation
  const handleBackFromConfirmation = () => {
    setPhase(PHASES.RESULTS)
  }

  // Determine if loading
  const isLoading = phase === PHASES.INTERPRETING || phase === PHASES.MATCHING

  return (
    <main className="min-h-screen bg-background-cream" role="main">
      <div className="container mx-auto px-4 py-16 sm:py-20 max-w-content">
        {/* Show checkmark circle when confirmed, otherwise show normal flow */}
        {isConfirmed ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <CheckCircleIcon className="w-32 h-32 text-primary-500 mb-6" aria-hidden="true" />
            <div
              className="bg-success-50 border-2 border-success-200 rounded-lg p-6 max-w-2xl"
              role="alert"
              aria-live="polite"
            >
              <p className="text-base text-success-800 text-center">
                Amazing! You are one step closer to quality care. Please check your email for more details.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Page Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-primary-500 mb-4">
                Schedule Appointment
              </h1>
              <p className="text-base sm:text-lg text-text-body">
                When are you available?
              </p>
            </div>

            {/* Main Content */}
            <section
              aria-labelledby="scheduling-heading"
              className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8"
            >
              <h2 id="scheduling-heading" className="sr-only">
                Schedule Appointment
              </h2>

              {phase === PHASES.INPUT && (
                <NaturalLanguageScheduling
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  error={error}
                />
              )}

              {phase === PHASES.INTERPRETING && (
                <div className="text-center py-12" role="status" aria-live="polite">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4" />
                  <p className="text-base text-text-body">
                    Processing...
                  </p>
                </div>
              )}

              {phase === PHASES.MATCHING && (
                <div className="text-center py-12" role="status" aria-live="polite">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4" />
                  <p className="text-base text-text-body">
                    Finding appointments...
                  </p>
                </div>
              )}

              {phase === PHASES.RESULTS && (
                <AvailabilityResults
                  slots={matchedSlots}
                  onSelectSlot={handleSelectSlot}
                  onTryAgain={handleTryAgain}
                />
              )}

              {phase === PHASES.CONFIRMATION && selectedSlot && !isConfirmed && (
                <SchedulingConfirmation
                  selectedSlot={selectedSlot}
                  onConfirm={handleConfirm}
                  onBack={handleBackFromConfirmation}
                />
              )}
            </section>

            {/* Help Section - Only show during input phase */}
            {phase === PHASES.INPUT && (
              <section aria-labelledby="help-heading" className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
                <h2 id="help-heading" className="text-lg font-semibold text-primary-900 mb-3">
                  Need Help?
                </h2>
                <p className="text-base text-primary-800 mb-4">
                  You can describe your availability in any way that works for you. For example:
                </p>
                <ul className="list-disc list-inside text-base text-primary-800 space-y-2">
                  <li>&quot;I&apos;m only free on weekdays after 5pm&quot;</li>
                  <li>&quot;I can do an appointment between 9am and 11am next Tuesday and Thursday&quot;</li>
                  <li>&quot;Weekends in the morning&quot;</li>
                  <li>&quot;Next week, any day after 2pm&quot;</li>
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {/* FAQ Chatbot */}
      <FAQChatbot />
    </main>
  )
}
