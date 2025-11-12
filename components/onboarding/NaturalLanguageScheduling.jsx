'use client'

import { useState, useEffect } from 'react'
import { useOnboardingState } from '@/lib/context/OnboardingContext'
import Button from '@/components/shared/Button'
import CharacterCounter from '@/components/shared/CharacterCounter'

/**
 * NaturalLanguageScheduling Component
 * 
 * Allows users to input their availability preferences in natural language.
 */
export default function NaturalLanguageScheduling({ onSubmit, isLoading, error }) {
  const { schedulingInput, setSchedulingInput } = useOnboardingState()
  const [input, setInput] = useState(schedulingInput || '')
  const [characterCount, setCharacterCount] = useState(0)

  // Restore input from context on mount
  useEffect(() => {
    if (schedulingInput) {
      setInput(schedulingInput)
    }
  }, [schedulingInput])

  const MIN_LENGTH = 10
  const MAX_LENGTH = 500

  // Update character count when input changes
  useEffect(() => {
    setCharacterCount(input.length)
  }, [input])

  // Validate input
  const isValid = input.length >= MIN_LENGTH && input.length <= MAX_LENGTH
  const isDisabled = !isValid || isLoading

  // Update context when input changes (on submit)
  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid && !isLoading) {
      setSchedulingInput(input) // Update context
      onSubmit(input)
    }
  }

  // Handle Enter key (submit) - but allow Shift+Enter for new lines
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && isValid && !isLoading) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-4">
        {/* Textarea Input */}
        <div>
          <label htmlFor="availability-input" className="sr-only">
            Enter your availability preferences
          </label>
          <textarea
            id="availability-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell us when you're available. For example: 'I'm only free on weekdays after 5pm' or 'I can do an appointment between 9am and 11am next Tuesday and Thursday'"
            disabled={isLoading}
            rows={5}
            maxLength={MAX_LENGTH}
            className={`
              w-full px-4 py-3 rounded-lg border-2
              font-body text-base text-text-primary
              placeholder:text-text-secondary
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
              transition-colors duration-normal
              ${error ? 'border-warning-500 focus:ring-warning-500' : 'border-neutral-300'}
            `}
            aria-label="Enter your availability preferences"
            aria-describedby={error ? 'error-message' : 'character-count'}
            aria-invalid={error ? 'true' : 'false'}
          />
        </div>

        {/* Character Count and Error Message */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div id="character-count">
            <CharacterCounter currentCount={characterCount} maxCount={MAX_LENGTH} />
          </div>
          {error && (
            <div
              id="error-message"
              className="text-sm text-warning-600"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isDisabled}
            loading={isLoading}
            ariaLabel={isLoading ? 'Finding available appointments' : 'Find available times'}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Finding Available Times...' : 'Find Available Times'}
          </Button>
        </div>

        {/* Loading State Message */}
        {isLoading && (
          <div className="text-center text-text-body" role="status" aria-live="polite">
            <p className="text-sm">Finding available appointments...</p>
          </div>
        )}
      </div>
    </form>
  )
}

