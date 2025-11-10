'use client'

import { useState, useCallback, forwardRef } from 'react'

const RATING_LABELS = {
  1: 'Mild',
  2: '',
  3: '',
  4: '',
  5: 'Severe',
}

/**
 * QuestionCard Component
 * 
 * A reusable component for displaying survey questions with different input types.
 * 
 * @param {Object} props
 * @param {string} props.question - Question text
 * @param {string} props.type - Question type: 'multiple-choice' | 'checkbox' | 'rating' | 'text' | 'textarea'
 * @param {Array} props.options - Array of option objects { value, label }
 * @param {*} props.value - Current value(s)
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Always false (all questions optional)
 * @param {string} props.questionId - Unique question ID
 * @param {string} props.className - Additional CSS classes
 */
const QuestionCard = forwardRef(function QuestionCard({
  question,
  type,
  options = [],
  value,
  onChange,
  required = false, // Always false per PRD
  questionId,
  className = '',
}, ref) {
  const [otherText, setOtherText] = useState('')

  // Ensure "Prefer not to answer" is in options for applicable question types
  const optionsWithPreferNot = type === 'textarea' || type === 'text'
    ? options
    : [...options, { value: 'prefer-not-to-answer', label: 'Prefer not to answer' }]

  // Handle value change
  const handleChange = useCallback((newValue) => {
    onChange?.(newValue)
  }, [onChange])

  // Handle checkbox change
  const handleCheckboxChange = useCallback((optionValue, checked) => {
    const currentValues = Array.isArray(value) ? value : []
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter(v => v !== optionValue)
    handleChange(newValues)
  }, [value, handleChange])

  // Handle "Other" option selection
  const handleOtherChange = useCallback((selected, otherValue) => {
    if (selected) {
      // If "Other" is selected, include it in the value
      if (type === 'checkbox') {
        const currentValues = Array.isArray(value) ? value : []
        handleChange([...currentValues, 'other'])
      } else {
        handleChange('other')
      }
      setOtherText(otherValue || '')
    } else {
      // If "Other" is deselected, remove it
      if (type === 'checkbox') {
        const currentValues = Array.isArray(value) ? value : []
        handleChange(currentValues.filter(v => v !== 'other'))
      } else {
        handleChange(null)
      }
      setOtherText('')
    }
  }, [type, value, handleChange])

  // Check if "Other" is selected
  const isOtherSelected = type === 'checkbox'
    ? Array.isArray(value) && value.includes('other')
    : value === 'other'

  // Render multiple choice (radio buttons)
  const renderMultipleChoice = () => (
    <fieldset className="space-y-3">
      <legend className="sr-only">{question}</legend>
      {optionsWithPreferNot.map((option) => (
        <div key={option.value} className="flex items-start">
            <input
              type="radio"
              id={`${questionId}-${option.value}`}
              name={questionId}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => handleChange(e.target.value)}
              className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 transition-colors duration-normal"
            />
          <label
            htmlFor={`${questionId}-${option.value}`}
            className="ml-3 text-base text-neutral-700 cursor-pointer"
          >
            {option.label}
          </label>
        </div>
      ))}
      {options.some(opt => opt.value === 'other' || opt.label?.toLowerCase() === 'other') && (
        <>
          {isOtherSelected && (
            <div className="ml-7 mt-2">
              <input
                type="text"
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value)
                  handleOtherChange(true, e.target.value)
                }}
                placeholder="Please specify"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-normal"
              />
            </div>
          )}
        </>
      )}
    </fieldset>
  )

  // Render checkboxes
  const renderCheckboxes = () => (
    <fieldset className="space-y-3">
      <legend className="sr-only">{question}</legend>
      {optionsWithPreferNot.map((option) => (
        <div key={option.value} className="flex items-start">
            <input
              type="checkbox"
              id={`${questionId}-${option.value}`}
              checked={Array.isArray(value) && value.includes(option.value)}
              onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded transition-colors duration-normal"
            />
          <label
            htmlFor={`${questionId}-${option.value}`}
            className="ml-3 text-base text-neutral-700 cursor-pointer"
          >
            {option.label}
          </label>
        </div>
      ))}
      {options.some(opt => opt.value === 'other' || opt.label?.toLowerCase() === 'other') && (
        <>
          {isOtherSelected && (
            <div className="ml-7 mt-2">
              <input
                type="text"
                value={otherText}
                onChange={(e) => {
                  setOtherText(e.target.value)
                  handleOtherChange(true, e.target.value)
                }}
                placeholder="Please specify"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-normal"
              />
            </div>
          )}
        </>
      )}
    </fieldset>
  )

  // Render rating scale (1-5)
  const renderRating = () => (
    <fieldset className="space-y-3">
      <legend className="sr-only">{question}</legend>
      <div className="flex items-center justify-between gap-4">
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex flex-col items-center flex-1">
            <input
              type="radio"
              id={`${questionId}-${rating}`}
              name={questionId}
              value={rating}
              checked={value === rating}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
            />
            <label
              htmlFor={`${questionId}-${rating}`}
              className="mt-2 text-sm text-neutral-700 cursor-pointer text-center"
            >
              <span className="block font-medium">{rating}</span>
              {RATING_LABELS[rating] && (
                <span className="block text-xs text-neutral-500 mt-1">
                  {RATING_LABELS[rating]}
                </span>
              )}
            </label>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-neutral-500">Mild</span>
        <span className="text-xs text-neutral-500">Severe</span>
      </div>
    </fieldset>
  )

  // Render text input
  const renderText = () => {
    const maxLength = 1000 // Reasonable limit for text inputs
    const currentLength = (value || '').length
    
    return (
      <div>
        <input
          type="text"
          id={questionId}
          value={value || ''}
          onChange={(e) => {
            const newValue = e.target.value
            // Allow all characters but limit length
            if (newValue.length <= maxLength) {
              handleChange(newValue)
            }
          }}
          maxLength={maxLength}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-normal"
          aria-label={question}
          aria-describedby={currentLength > maxLength * 0.9 ? `${questionId}-char-hint` : undefined}
        />
        {currentLength > maxLength * 0.9 && (
          <p id={`${questionId}-char-hint`} className="mt-1 text-xs text-neutral-500">
            {currentLength}/{maxLength} characters
          </p>
        )}
      </div>
    )
  }

  // Render textarea
  const renderTextarea = () => {
    const charCount = value?.length || 0
    const maxChars = 500

    return (
      <div>
        <textarea
          id={questionId}
          value={value || ''}
          onChange={(e) => {
            const newValue = e.target.value
            if (newValue.length <= maxChars) {
              handleChange(newValue)
            }
          }}
          rows={4}
          maxLength={maxChars}
          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          aria-label={question}
        />
        <div className="mt-1 text-right">
          <span className={`text-xs ${charCount >= maxChars ? 'text-warning-600' : 'text-neutral-500'}`}>
            {charCount}/{maxChars} characters
          </span>
        </div>
      </div>
    )
  }

  // Render based on type
  const renderInput = () => {
    switch (type) {
      case 'multiple-choice':
        return renderMultipleChoice()
      case 'checkbox':
        return renderCheckboxes()
      case 'rating':
        return renderRating()
      case 'text':
        return renderText()
      case 'textarea':
        return renderTextarea()
      default:
        return null
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <label
          htmlFor={type === 'textarea' || type === 'text' ? questionId : undefined}
          className="block text-lg font-medium text-neutral-900 mb-2"
        >
          {question}
        </label>
      </div>
      <div ref={ref}>
        {renderInput()}
      </div>
    </div>
  )
})

QuestionCard.displayName = 'QuestionCard'

export default QuestionCard

