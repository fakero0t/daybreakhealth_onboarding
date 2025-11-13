'use client'

import { CheckIcon } from '@heroicons/react/24/solid'
import Button from '@/components/shared/Button'

/**
 * SlotCard Component
 * 
 * Displays a single appointment time slot with selection capability.
 */
export default function SlotCard({ slot, isSelected, onSelect }) {
  const handleSelect = () => {
    onSelect()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (e.key === ' ') {
        e.preventDefault() // Prevent page scroll
      }
      handleSelect()
    }
  }

  return (
    <div
      className={`
        bg-white rounded-xl border-2 p-4 sm:p-6
        transition-all duration-normal
        ${isSelected
          ? 'border-primary-500 shadow-md bg-primary-50'
          : 'border-neutral-200 hover:border-primary-300 hover:shadow-sm'
        }
      `}
      role="option"
      aria-selected={isSelected}
      aria-label={`Appointment slot: ${slot.formattedDate} at ${slot.formattedTime} ${slot.timezoneName}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Slot Information */}
        <div className="flex-1">
          <div className="flex items-start gap-3">
            {isSelected && (
              <CheckIcon
                className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div className="flex-1">
              <div className="font-heading font-semibold text-primary-500 text-lg mb-1">
                {slot.formattedDate}
              </div>
              <div className="text-text-body text-base mb-1">
                {slot.formattedTime}
              </div>
              <div className="text-text-secondary text-sm">
                {slot.timezoneName}
              </div>
            </div>
          </div>
        </div>

        {/* Select Button */}
        <div className="flex-shrink-0">
          <Button
            variant={isSelected ? 'primary' : 'outline'}
            size="medium"
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
            ariaLabel={`Select appointment on ${slot.formattedDate} at ${slot.formattedTime}`}
            className="min-w-[140px]"
          >
            {isSelected ? 'Selected' : 'Select This Time'}
          </Button>
        </div>
      </div>
    </div>
  )
}

