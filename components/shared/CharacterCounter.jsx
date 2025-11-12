'use client'

/**
 * CharacterCounter Component
 * 
 * Displays character count with formatting and color coding based on thresholds.
 * Formats numbers with commas (e.g., "4,234 / 5,000 characters").
 */
export default function CharacterCounter({ currentCount, maxCount = 5000 }) {
  // Format numbers with commas
  const formattedCurrent = currentCount.toLocaleString()
  const formattedMax = maxCount.toLocaleString()

  // Determine color based on thresholds
  let textColor = '' // Default: inherit from parent
  if (currentCount >= 4900) {
    // 98% of limit - red warning
    textColor = 'text-red-600'
  } else if (currentCount >= 4500) {
    // 90% of limit - yellow warning
    textColor = 'text-yellow-600'
  }

  return (
    <div
      className={`text-sm ${textColor}`}
      aria-label={`Character count: ${formattedCurrent} of ${formattedMax} characters`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {formattedCurrent} / {formattedMax} characters
    </div>
  )
}

