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
      <div className={`flex justify-between items-center mb-2 ${textColor}`}>
        <span className="text-sm font-medium">
          {label} {currentStep} of {totalSteps}
        </span>
        <span className="text-xs">
          {calculatedPercentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className={`w-full h-2 rounded-full overflow-hidden ${progressBarBg}`}
        role="progressbar"
        aria-valuenow={calculatedPercentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${calculatedPercentage}% complete`}
      >
        <div
          className={`h-full transition-all duration-slow ease-out ${progressBarFill}`}
          style={{ 
            width: `${calculatedPercentage}%`,
            transition: 'width 300ms ease-out'
          }}
        />
      </div>
    </div>
  )
}

