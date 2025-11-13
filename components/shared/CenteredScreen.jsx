/**
 * CenteredScreen Component
 * 
 * A standardized, centered screen component for intro/transition screens.
 * Ensures consistent vertical and horizontal centering across all screens.
 */

'use client'

import Button from '@/components/shared/Button'

export default function CenteredScreen({
  title,
  subtitle,
  button,
  footer,
  loadingSpinner = false,
  className = '',
}) {
  return (
    <main className={`h-screen bg-background-cream flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden ${className}`} role="main">
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center w-full space-y-6 sm:space-y-8">
          {/* Loading Spinner (if provided) */}
          {loadingSpinner && (
            <div className="flex-shrink-0">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          )}

          {/* Title Section */}
          {title && (
            <div className="space-y-4 sm:space-y-5 w-full flex-shrink-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-primary-500 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg lg:text-xl text-text-body max-w-xl mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Button Section */}
          {button && (
            <div className="flex flex-col items-center w-full sm:w-auto flex-shrink-0">
              {typeof button === 'object' && button.text ? (
                <Button
                  onClick={button.onClick}
                  variant={button.variant || 'primary'}
                  size={button.size || 'medium'}
                  ariaLabel={button.ariaLabel}
                  className={button.className}
                >
                  {button.text}
                </Button>
              ) : (
                button
              )}
            </div>
          )}

          {/* Footer Section (e.g., privacy notice) */}
          {footer && (
            <div className="w-full max-w-lg mx-auto px-4 flex-shrink-0">
              {footer}
            </div>
          )}
          </div>
        </div>
      </div>
    </main>
  )
}

