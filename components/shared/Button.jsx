'use client'

import { forwardRef } from 'react'

/**
 * Button Component
 * 
 * A reusable, accessible button component with multiple variants, sizes, and states.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.variant - Button variant: 'primary' | 'secondary' | 'outline' | 'text'
 * @param {string} props.size - Button size: 'small' | 'medium' | 'large'
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state (shows spinner)
 * @param {string} props.type - Button type: 'button' | 'submit' | 'reset'
 * @param {string} props.ariaLabel - ARIA label for accessibility
 * @param {string} props.className - Additional CSS classes
 */
const Button = forwardRef(function Button(
  {
    children,
    onClick,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    type = 'button',
    ariaLabel,
    className = '',
    ...props
  },
  ref
) {
  // Variant styles (Daybreak Health style - pill-shaped buttons)
  const variantStyles = {
    primary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:bg-secondary-300 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md transition-shadow',
    secondary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-300 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md transition-shadow',
    outline: 'border-2 border-primary-500 text-primary-500 bg-white hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:border-primary-300 disabled:text-primary-300 disabled:cursor-not-allowed rounded-full shadow-sm hover:shadow-md transition-shadow',
    text: 'text-primary-500 bg-transparent hover:bg-primary-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:text-primary-300 disabled:cursor-not-allowed rounded-full',
  }

  // Size styles
  const sizeStyles = {
    small: 'px-3 py-2 text-sm min-h-[44px] min-w-[44px]',
    medium: 'px-4 py-2.5 text-base min-h-[44px] min-w-[44px]',
    large: 'px-6 py-3 text-lg min-h-[48px] min-w-[48px]',
  }

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98]'

  // Combine all styles
  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }

    // Support Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') {
        e.preventDefault() // Prevent page scroll on Space
      }
      onClick?.(e)
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading</span>
        </span>
      ) : null}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  )
})

Button.displayName = 'Button'

export default Button

