'use client'

/**
 * ProgressIndicator Component
 * 
 * Displays progress through the onboarding flow with step numbers and a progress bar.
 * Not clickable - purely informational.
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Current step number
 * @param {number} props.totalSteps - Total number of steps
 * @param {number} props.percentage - Percentage completion (0-100)
 * @param {string} props.label - Optional custom label (e.g., "Question" instead of "Step")
 * @param {boolean} props.subtle - If true, makes the indicator more subtle (for landing page)
 * @param {string} props.className - Additional CSS classes
 */
export default function ProgressIndicator({
  currentStep,
  totalSteps,
  percentage,
  label = 'Step',
  subtle = false,
  className = '',
  skipSteps = [], // Array of step numbers to skip in the visual display
}) {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage || 0, 0), 100)

  // Calculate percentage from currentStep/totalSteps if not provided
  const calculatedPercentage = percentage !== undefined 
    ? clampedPercentage 
    : Math.round((currentStep / totalSteps) * 100)

  const textColor = subtle 
    ? 'text-text-secondary' 
    : 'text-text-body'

  const progressBarBg = subtle
    ? 'bg-neutral-200'
    : 'bg-neutral-200'

  const progressBarFill = subtle
    ? 'bg-primary-300'
    : 'bg-primary-500'

  return (
    <div 
      className={`w-full ${className}`}
      role="region"
      aria-label={`${label} ${currentStep} of ${totalSteps}`}
    >
      {/* Step text */}
      <div className={`flex justify-between items-center mb-3 ${textColor}`}>
        <span className="text-sm font-medium">
          {label} {currentStep} of {totalSteps}
        </span>
        <span className="text-xs">
          {calculatedPercentage}%
        </span>
      </div>

      {/* Step Pills */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          
          // Skip steps that shouldn't be shown
          if (skipSteps.includes(stepNumber)) {
            return null;
          }
          
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          // Check if this is the last visible step
          const visibleSteps = Array.from({ length: totalSteps }, (_, i) => i + 1)
            .filter(step => !skipSteps.includes(step));
          const isLastVisibleStep = stepNumber === visibleSteps[visibleSteps.length - 1];
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-medium transition-colors duration-200
                  ${isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              {!isLastVisibleStep && (
                <div 
                  className={`w-4 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}

