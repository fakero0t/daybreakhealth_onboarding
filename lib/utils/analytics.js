/**
 * Analytics Utility
 * 
 * Provides utility functions for analytics logging (console only).
 * All logs include timestamp and NO PHI (Protected Health Information).
 */

/**
 * Log analytics event
 * @param {string} event - Event name
 * @param {Object} data - Event data (NO PHI)
 */
function logAnalytics(event, data = {}) {
  console.log('Analytics:', {
    event,
    data,
    timestamp: new Date().toISOString()
  })
}

/**
 * Log time spent on question
 * @param {string} questionId - Question ID (e.g., 'q1', 'q2')
 * @param {number} timeSpent - Time spent in milliseconds
 */
export function logQuestionTime(questionId, timeSpent) {
  logAnalytics('question_time', {
    questionId,
    timeSpentMs: timeSpent,
    timeSpentSeconds: Math.round(timeSpent / 1000)
  })
}

/**
 * Log API retry
 */
export function logRetry() {
  logAnalytics('api_retry', {})
}

/**
 * Log symptom edit
 * @param {string} symptomKey - Symptom key (kebab-case)
 */
export function logSymptomEdit(symptomKey) {
  logAnalytics('symptom_edit', {
    symptomKey
  })
}

/**
 * Log form completion
 */
export function logFormCompletion() {
  logAnalytics('form_completion', {})
}

