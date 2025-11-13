/**
 * WizardNavigation Component
 * 
 * Navigation buttons for the demographics wizard (Continue, Back, Skip)
 */

'use client';

export default function WizardNavigation({
  onContinue,
  onBack,
  onSkip,
  showBack = true,
  showSkip = true,
  continueLabel = 'Continue',
  continueDisabled = false,
  isLoading = false,
  isLastStep = false
}) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
      <div>
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="
              px-6 py-2 text-sm font-medium text-gray-700 
              bg-white border border-gray-300 rounded-lg
              hover:bg-gray-50 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            ← Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && !isLastStep && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="
              px-6 py-2 text-sm font-medium text-gray-600
              hover:text-gray-900 focus:outline-none focus:ring-2
              focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            Skip this section
          </button>
        )}

        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || isLoading}
          className="
            px-8 py-2 text-sm font-medium text-white
            bg-blue-600 border border-transparent rounded-lg
            hover:bg-blue-700 focus:outline-none focus:ring-2
            focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            flex items-center gap-2
          "
        >
          {isLoading && (
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
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
          )}
          {isLastStep ? 'Complete' : continueLabel}
          {!isLastStep && ' →'}
        </button>
      </div>
    </div>
  );
}

