'use client'

import { CheckCircleIcon } from '@heroicons/react/24/solid'
import Button from '@/components/shared/Button'

/**
 * SchedulingConfirmation Component
 * 
 * Displays selected appointment slot for confirmation.
 */
export default function SchedulingConfirmation({ selectedSlot, onConfirm, onBack }) {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (e.key === ' ') {
        e.preventDefault() // Prevent page scroll
      }
      handleConfirm()
    }
  }

  if (!selectedSlot) {
    return null
  }

  return (
    <div className="w-full space-y-6">
      {/* Selected Slot Display */}
      <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
        <h2 className="text-xl font-heading font-semibold text-primary-500 mb-4">
          Confirm Your Appointment Preference
        </h2>
        
        <div className="space-y-3">
          <div>
            <div className="text-sm text-text-secondary mb-1">Date</div>
            <div className="text-lg font-medium text-text-primary">
              {selectedSlot.formattedDate}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-text-secondary mb-1">Time</div>
            <div className="text-lg font-medium text-text-primary">
              {selectedSlot.formattedTime}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-text-secondary mb-1">Timezone</div>
            <div className="text-lg font-medium text-text-primary">
              {selectedSlot.timezoneName}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="large"
          onClick={handleConfirm}
          onKeyDown={handleKeyDown}
          ariaLabel="Confirm appointment preference"
        >
          Confirm Appointment
        </Button>
      </div>

      {/* Info Message */}
      <div className="bg-informational-50 border border-informational-200 rounded-lg p-4">
        <p className="text-sm text-informational-800">
          <strong>Note:</strong> This confirms your preference. A care coordinator will reach out to you within 1-2 business days to finalize the appointment.
        </p>
      </div>
    </div>
  )
}

