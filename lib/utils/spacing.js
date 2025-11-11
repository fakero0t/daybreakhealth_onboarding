/**
 * Spacing Utility Functions
 * 
 * Provides utility functions for consistent spacing throughout the application.
 */

// Use require for CommonJS module
const { spacing } = require('../constants/design-system')

/**
 * Get spacing value by key
 * @param {string|number} key - Spacing key (e.g., '4', 4, 'base')
 * @returns {string} Spacing value (e.g., '1rem')
 */
export function getSpacing(key) {
  return spacing[key] || spacing[4] // Default to 1rem if key not found
}

/**
 * Get padding utility class name
 * @param {string|number} value - Spacing value
 * @returns {string} Tailwind padding class
 */
export function getPadding(value) {
  return `p-${value}`
}

/**
 * Get margin utility class name
 * @param {string|number} value - Spacing value
 * @returns {string} Tailwind margin class
 */
export function getMargin(value) {
  return `m-${value}`
}

/**
 * Get responsive spacing classes
 * @param {Object} values - Object with mobile, tablet, desktop spacing
 * @returns {string} Combined Tailwind classes
 */
export function getResponsiveSpacing(values) {
  const { mobile, tablet, desktop } = values
  const classes = []
  
  if (mobile) classes.push(`p-${mobile}`)
  if (tablet) classes.push(`md:p-${tablet}`)
  if (desktop) classes.push(`lg:p-${desktop}`)
  
  return classes.join(' ')
}

