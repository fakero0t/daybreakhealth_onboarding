/**
 * Input Sanitization Utilities
 * 
 * Functions to sanitize user input and prevent XSS and injection attacks.
 * All user-provided text should be sanitized before storage.
 */

/**
 * Sanitize a text input by removing potentially dangerous characters
 * and enforcing length limits
 * @param {string} input - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input, maxLength = 255) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize a text area input (allows newlines)
 * @param {string} input - Raw input string
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeTextArea(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines, carriage returns, and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize line endings to \n
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize HTML by escaping special characters
 * Use this when displaying user input in HTML context
 * @param {string} input - Raw input string
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char]);
}

/**
 * Validate that a string contains only alphanumeric characters and common punctuation
 * @param {string} input - Input string to validate
 * @returns {boolean} True if valid
 */
export function isValidTextInput(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Allow letters, numbers, spaces, and common punctuation
  // This is a permissive check - adjust based on your needs
  const validPattern = /^[a-zA-Z0-9\s\-',.!?()&]+$/;
  return validPattern.test(input);
}

/**
 * Sanitize a UUID string
 * @param {string} uuid - UUID string
 * @returns {string|null} Valid UUID or null
 */
export function sanitizeUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return null;
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidPattern.test(uuid.trim())) {
    return uuid.trim().toLowerCase();
  }

  return null;
}

/**
 * Sanitize an email address
 * @param {string} email - Email address
 * @returns {string|null} Valid email or null
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  
  // Basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailPattern.test(trimmed) && trimmed.length <= 255) {
    return trimmed;
  }

  return null;
}

