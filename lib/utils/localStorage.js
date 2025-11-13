/**
 * SessionStorage Utility Functions
 * 
 * Provides utility functions for saving and loading data from sessionStorage
 * with error handling for when sessionStorage is disabled or unavailable.
 * Uses sessionStorage instead of localStorage to ensure onboarding state
 * clears between browser sessions but persists during page refreshes.
 */

const STORAGE_PREFIX = 'daybreak_onboarding_'

/**
 * Check if sessionStorage is available
 * @returns {boolean} True if sessionStorage is available
 */
export function isLocalStorageAvailable() {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const test = '__sessionStorage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Save data to sessionStorage
 * @param {string} key - Storage key (will be prefixed)
 * @param {*} value - Value to save (will be JSON stringified)
 * @returns {boolean} True if save was successful
 */
export function saveToLocalStorage(key, value) {
  if (!isLocalStorageAvailable()) {
    console.warn('sessionStorage is not available')
    return false
  }

  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`
    const serializedValue = JSON.stringify(value)
    
    // Check if sessionStorage is full (QuotaExceededError)
    sessionStorage.setItem(prefixedKey, serializedValue)
    return true
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('sessionStorage is full. Attempting to clear old data...')
      // Try to clear old onboarding data and retry once
      try {
        clearOnboardingState()
        sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
        return true
      } catch (retryError) {
        console.error('Error saving to sessionStorage (quota exceeded):', retryError)
        return false
      }
    }
    console.error('Error saving to sessionStorage:', error)
    return false
  }
}

/**
 * Load data from sessionStorage
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
    const item = sessionStorage.getItem(prefixedKey)
    
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
    console.warn('Error loading from sessionStorage (data may be corrupted):', error)
    try {
      const prefixedKey = `${STORAGE_PREFIX}${key}`
      sessionStorage.removeItem(prefixedKey)
    } catch (removeError) {
      // Ignore removal errors
    }
    return defaultValue
  }
}

/**
 * Remove data from sessionStorage
 * @param {string} key - Storage key (will be prefixed)
 * @returns {boolean} True if removal was successful
 */
export function removeFromLocalStorage(key) {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    const prefixedKey = `${STORAGE_PREFIX}${key}`
    sessionStorage.removeItem(prefixedKey)
    return true
  } catch (error) {
    console.error('Error removing from sessionStorage:', error)
    return false
  }
}

/**
 * Clear all onboarding-related data from sessionStorage
 * @returns {boolean} True if clear was successful
 */
export function clearOnboardingState() {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Error clearing onboarding state:', error)
    return false
  }
}

/**
 * Save scheduling state to sessionStorage
 * @param {Object} state - Scheduling state object
 * @returns {boolean} True if save was successful
 */
export function saveSchedulingState(state) {
  return saveToLocalStorage('scheduling_state', state)
}

/**
 * Get scheduling state from sessionStorage
 * @returns {Object|null} Scheduling state or null if not found
 */
export function getSchedulingState() {
  return loadFromLocalStorage('scheduling_state', null)
}

/**
 * Clear scheduling state from sessionStorage
 * Note: This clears all scheduling data except selectedSlot (which is kept for display)
 * @returns {boolean} True if clear was successful
 */
export function clearSchedulingState() {
  const currentState = getSchedulingState()
  
  // Keep only selectedSlot for display purposes
  if (currentState && currentState.selectedSlot) {
    return saveSchedulingState({
      schedulingInput: '',
      interpretedPreferences: null,
      matchedSlots: [],
      selectedSlot: currentState.selectedSlot, // Keep for display only
    })
  }
  
  // If no selectedSlot, remove entirely
  return removeFromLocalStorage('scheduling_state')
}

