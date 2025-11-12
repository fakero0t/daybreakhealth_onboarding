'use client'

import { useState, useEffect } from 'react'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import SlotCard from './SlotCard'

/**
 * AvailabilityResults Component
 * 
 * Displays matched appointment time slots and handles selection.
 */
export default function AvailabilityResults({ slots, onSelectSlot, onTryAgain }) {
  const { selectedSlot, setSelectedSlot } = useOnboardingState()
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  // Sync selectedSlotId with context
  useEffect(() => {
    if (selectedSlot) {
      setSelectedSlotId(selectedSlot.availabilityId)
    } else {
      setSelectedSlotId(null)
    }
  }, [selectedSlot])

  const handleSlotSelect = (slot) => {
    setSelectedSlotId(slot.availabilityId)
    setSelectedSlot(slot) // Update context
    onSelectSlot(slot)
  }

  // No matches found
  if (!slots || slots.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div
          className="bg-warning-50 border-2 border-warning-200 rounded-lg p-6 text-center"
          role="alert"
          aria-live="polite"
        >
          <p className="text-base text-text-primary mb-2">
            We couldn&apos;t find any available times matching your preferences.
          </p>
          <p className="text-sm text-text-body mb-4">
            Please try different times or contact us for assistance.
          </p>
          <Button
            variant="primary"
            size="medium"
            onClick={onTryAgain}
            ariaLabel="Try different times"
          >
            Try Different Times
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Results Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-semibold text-primary-500 mb-2">
          Available Appointment Times
        </h2>
        <p className="text-base text-text-body">
          We found {slots.length} available time{slots.length !== 1 ? 's' : ''} matching your preferences.
          {slots.length < 3 && (
            <span className="block mt-2 text-sm text-text-secondary">
              If you&apos;d like to see more options, try adjusting your availability preferences.
            </span>
          )}
        </p>
      </div>

      {/* Slot Cards */}
      <div
        className="space-y-4"
        role="listbox"
        aria-label="Available appointment time slots"
      >
        {slots.map((slot) => (
          <div
            key={slot.availabilityId || slot.startTime}
            role="option"
            aria-selected={selectedSlotId === slot.availabilityId}
          >
            <SlotCard
              slot={slot}
              isSelected={selectedSlotId === slot.availabilityId}
              onSelect={() => handleSlotSelect(slot)}
            />
          </div>
        ))}
      </div>

      {/* Try Again Button */}
      <div className="pt-4 border-t border-neutral-200">
        <Button
          variant="text"
          size="medium"
          onClick={onTryAgain}
          ariaLabel="Try different times"
          className="w-full sm:w-auto"
        >
          Try Different Times
        </Button>
      </div>
    </div>
  )
}

