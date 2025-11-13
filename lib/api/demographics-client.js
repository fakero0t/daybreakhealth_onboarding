/**
 * Demographics API Client
 * 
 * Client-side functions for interacting with demographics API endpoints
 */

const API_BASE = '/api/demographics';

/**
 * Create a new demographics record
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Demographics data
 * @returns {Promise<object>} Created demographics record
 */
export async function createDemographics(patientId, data) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ patientId, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create demographics');
  }

  return response.json();
}

/**
 * Get demographics record for a patient
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<object|null>} Demographics record or null
 */
export async function getDemographics(patientId) {
  const response = await fetch(`${API_BASE}?patientId=${patientId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get demographics');
  }

  return response.json();
}

/**
 * Update demographics record (full update)
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Demographics data
 * @returns {Promise<object>} Updated demographics record
 */
export async function updateDemographics(patientId, data) {
  const response = await fetch(`${API_BASE}?patientId=${patientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update demographics');
  }

  return response.json();
}

/**
 * Partial update of demographics record (for auto-save)
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Partial demographics data
 * @returns {Promise<object>} Updated demographics record
 */
export async function autoSaveDemographics(patientId, data) {
  const response = await fetch(`${API_BASE}?patientId=${patientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to auto-save demographics');
  }

  return response.json();
}

/**
 * Get completion state for a patient's demographics
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<object>} Completion state
 */
export async function getCompletionState(patientId) {
  const response = await fetch(`${API_BASE}/completion?patientId=${patientId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get completion state');
  }

  return response.json();
}

/**
 * Create or update demographics (checks if exists first)
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Demographics data
 * @param {boolean} isPartial - Whether this is a partial update
 * @returns {Promise<object>} Demographics record
 */
export async function saveDemographics(patientId, data, isPartial = false) {
  try {
    const existing = await getDemographics(patientId);
    
    if (existing) {
      // Update existing record
      if (isPartial) {
        return await autoSaveDemographics(patientId, data);
      } else {
        return await updateDemographics(patientId, data);
      }
    } else {
      // Create new record
      return await createDemographics(patientId, data);
    }
  } catch (error) {
    console.error('Error saving demographics:', error);
    throw error;
  }
}

