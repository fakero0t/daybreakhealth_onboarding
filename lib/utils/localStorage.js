/**
 * LocalStorage Utility Functions
 * 
 * Provides utility functions for saving and loading data from localStorage
 * with error handling for when localStorage is disabled or unavailable.
 */

const STORAGE_PREFIX = 'daybreak_onboarding_'

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
export function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key (will be prefixed)
 * @param {*} value - Value to save (will be JSON stringified)
 * @returns {boolean} True if save was successful
 */
export function saveToLocalStorage(key, value) {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available')
    return false
  }

  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`
    const serializedValue = JSON.stringify(value)
    
    // Check if localStorage is full (QuotaExceededError)
    localStorage.setItem(prefixedKey, serializedValue)
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('localStorage is full. Attempting to clear old data...')
      // Try to clear old onboarding data and retry once
      try {
        clearOnboardingState()
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
        return true
      } catch (retryError) {
        console.error('Error saving to localStorage (quota exceeded):', retryError)
        return false
      }
    }
    console.error('Error saving to localStorage:', error)
    return false
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key (will be prefixed)
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed value or defaultValue
 */
export function loadFromLocalStorage(key, defaultValue = null) {
  if (!isLocalStorageAvailable()) {
    return defaultValue
  }

  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`
    const item = localStorage.getItem(prefixedKey)
    
    if (item === null) {
      return defaultValue
    }

    const parsed = JSON.parse(item)
    
    // Validate parsed data is not corrupted (basic check)
    if (parsed === null || (typeof parsed === 'object' && Object.keys(parsed).length === 0 && parsed.constructor === Object && defaultValue !== null && typeof defaultValue === 'object')) {
      // If we got an empty object but expected something else, return default
      return defaultValue
    }
    
    return parsed
  } catch (error) {
    // Corrupted data - remove it and return default
    console.warn('Error loading from localStorage (data may be corrupted):', error)
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`
      localStorage.removeItem(prefixedKey)
    } catch (removeError) {
      // Ignore removal errors
    }
    return defaultValue
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key (will be prefixed)
 * @returns {boolean} True if removal was successful
 */
export function removeFromLocalStorage(key) {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`
    localStorage.removeItem(prefixedKey)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

/**
 * Clear all onboarding-related data from localStorage
 * @returns {boolean} True if clear was successful
 */
export function clearOnboardingState() {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Error clearing onboarding state:', error)
    return false
  }
}

