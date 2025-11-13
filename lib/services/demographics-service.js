/**
 * Demographics Service
 * 
 * Business logic for managing patient demographics data.
 * Handles CRUD operations, validation, and audit logging.
 */

import { db } from '../db/client';
import { sanitizeInput, sanitizeTextArea } from '../utils/sanitization';
import { validateDemographics } from '../utils/demographics-validation';

/**
 * Create a new demographics record for a patient
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Demographics data (partial or complete)
 * @param {string} userId - UUID of user creating the record
 * @returns {Promise<object>} Created demographics record
 */
export async function createDemographics(patientId, data, userId) {
  // Validate input
  const validationErrors = validateDemographics(data);
  if (validationErrors.length > 0) {
    throw new ValidationError('Invalid demographics data', validationErrors);
  }

  // Sanitize all text inputs
  const sanitizedData = sanitizeDemographicsData(data);

  // Check if demographics already exists for this patient
  const existing = await getDemographics(patientId);
  if (existing) {
    throw new Error('Demographics record already exists for this patient. Use update instead.');
  }

  const query = `
    INSERT INTO demographics (
      patient_id,
      legal_name,
      preferred_name,
      gender_assigned_at_birth,
      gender_other_text,
      pronouns,
      guardian_name,
      shared_parenting_agreement,
      shared_parenting_details,
      custody_concerns,
      custody_concerns_details,
      school_name,
      current_grade,
      has_iep_504,
      iep_504_details,
      behavioral_academic_concerns,
      behavioral_academic_details,
      complications_prior_birth,
      complications_prior_details,
      complications_at_birth,
      complications_birth_details,
      milestones_met,
      milestones_details,
      life_changes,
      life_changes_other_text,
      has_part_time_job,
      has_extracurriculars,
      extracurriculars_details,
      fun_activities,
      spirituality,
      completed,
      sections_completed,
      created_by,
      updated_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34
    )
    RETURNING *
  `;

  const values = [
    patientId,
    sanitizedData.legal_name || null,
    sanitizedData.preferred_name || null,
    sanitizedData.gender_assigned_at_birth || null,
    sanitizedData.gender_other_text || null,
    sanitizedData.pronouns || null,
    sanitizedData.guardian_name || null,
    sanitizedData.shared_parenting_agreement || null,
    sanitizedData.shared_parenting_details || null,
    sanitizedData.custody_concerns || null,
    sanitizedData.custody_concerns_details || null,
    sanitizedData.school_name || null,
    sanitizedData.current_grade || null,
    sanitizedData.has_iep_504 || null,
    sanitizedData.iep_504_details || null,
    sanitizedData.behavioral_academic_concerns || null,
    sanitizedData.behavioral_academic_details || null,
    sanitizedData.complications_prior_birth || null,
    sanitizedData.complications_prior_details || null,
    sanitizedData.complications_at_birth || null,
    sanitizedData.complications_birth_details || null,
    sanitizedData.milestones_met || null,
    sanitizedData.milestones_details || null,
    JSON.stringify(sanitizedData.life_changes || []),
    sanitizedData.life_changes_other_text || null,
    sanitizedData.has_part_time_job || null,
    sanitizedData.has_extracurriculars || null,
    sanitizedData.extracurriculars_details || null,
    sanitizedData.fun_activities || null,
    sanitizedData.spirituality || null,
    sanitizedData.completed || false,
    JSON.stringify(sanitizedData.sections_completed || []),
    userId,
    userId
  ];

  try {
    const result = await db.query(query, values);
    await logAuditEvent('demographics_created', patientId, userId, result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating demographics:', error);
    throw new DatabaseError('Failed to create demographics record');
  }
}

/**
 * Get demographics record for a patient
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<object|null>} Demographics record or null if not found
 */
export async function getDemographics(patientId) {
  const query = `
    SELECT * FROM demographics
    WHERE patient_id = $1
  `;

  try {
    const result = await db.query(query, [patientId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching demographics:', error);
    throw new DatabaseError('Failed to fetch demographics record');
  }
}

/**
 * Update demographics record (full or partial)
 * @param {string} patientId - UUID of the patient
 * @param {object} data - Demographics data to update
 * @param {boolean} isPartial - Whether this is a partial update (for auto-save)
 * @param {string} userId - UUID of user updating the record
 * @returns {Promise<object>} Updated demographics record
 */
export async function updateDemographics(patientId, data, isPartial, userId) {
  // Validate input
  const validationErrors = validateDemographics(data, isPartial);
  if (validationErrors.length > 0) {
    throw new ValidationError('Invalid demographics data', validationErrors);
  }

  // Check if record exists
  const existing = await getDemographics(patientId);
  if (!existing) {
    throw new NotFoundError('Demographics record not found for this patient');
  }

  // Sanitize all text inputs
  const sanitizedData = sanitizeDemographicsData(data);

  // Build dynamic UPDATE query based on provided fields
  const updates = [];
  const values = [];
  let paramCount = 1;

  const fieldMapping = {
    legal_name: 'legal_name',
    preferred_name: 'preferred_name',
    gender_assigned_at_birth: 'gender_assigned_at_birth',
    gender_other_text: 'gender_other_text',
    pronouns: 'pronouns',
    guardian_name: 'guardian_name',
    shared_parenting_agreement: 'shared_parenting_agreement',
    shared_parenting_details: 'shared_parenting_details',
    custody_concerns: 'custody_concerns',
    custody_concerns_details: 'custody_concerns_details',
    school_name: 'school_name',
    current_grade: 'current_grade',
    has_iep_504: 'has_iep_504',
    iep_504_details: 'iep_504_details',
    behavioral_academic_concerns: 'behavioral_academic_concerns',
    behavioral_academic_details: 'behavioral_academic_details',
    complications_prior_birth: 'complications_prior_birth',
    complications_prior_details: 'complications_prior_details',
    complications_at_birth: 'complications_at_birth',
    complications_birth_details: 'complications_birth_details',
    milestones_met: 'milestones_met',
    milestones_details: 'milestones_details',
    life_changes: 'life_changes',
    life_changes_other_text: 'life_changes_other_text',
    has_part_time_job: 'has_part_time_job',
    has_extracurriculars: 'has_extracurriculars',
    extracurriculars_details: 'extracurriculars_details',
    fun_activities: 'fun_activities',
    spirituality: 'spirituality',
    completed: 'completed',
    sections_completed: 'sections_completed'
  };

  for (const [key, dbColumn] of Object.entries(fieldMapping)) {
    if (key in sanitizedData) {
      let value = sanitizedData[key];
      
      // Handle JSON fields
      if (key === 'life_changes' || key === 'sections_completed') {
        value = JSON.stringify(value || []);
      }
      
      updates.push(`${dbColumn} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }

  // Always update updated_by
  updates.push(`updated_by = $${paramCount}`);
  values.push(userId);
  paramCount++;

  // Add patient_id for WHERE clause
  values.push(patientId);

  const query = `
    UPDATE demographics
    SET ${updates.join(', ')}
    WHERE patient_id = $${paramCount}
    RETURNING *
  `;

  try {
    const result = await db.query(query, values);
    await logAuditEvent(
      isPartial ? 'demographics_auto_saved' : 'demographics_updated',
      patientId,
      userId,
      result.rows[0].id,
      { updated_fields: Object.keys(sanitizedData) }
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating demographics:', error);
    throw new DatabaseError('Failed to update demographics record');
  }
}

/**
 * Get completion state for a patient's demographics
 * @param {string} patientId - UUID of the patient
 * @returns {Promise<object>} Completion state information
 */
export async function getCompletionState(patientId) {
  const demographics = await getDemographics(patientId);
  
  if (!demographics) {
    return {
      exists: false,
      completed: false,
      sections_completed: [],
      completion_percentage: 0,
      last_updated: null
    };
  }

  const sectionsCompleted = demographics.sections_completed || [];
  const totalSections = 6; // Basic Info, Guardian, Education, Developmental, Life Changes, Activities
  const completionPercentage = Math.round((sectionsCompleted.length / totalSections) * 100);

  return {
    exists: true,
    completed: demographics.completed,
    sections_completed: sectionsCompleted,
    completion_percentage: completionPercentage,
    last_updated: demographics.updated_at
  };
}

/**
 * Calculate which sections have been completed
 * @param {object} demographics - Demographics data
 * @returns {array} Array of completed section names
 */
export function calculateSectionsCompleted(demographics) {
  const sections = [];

  // Basic Information
  if (demographics.legal_name || demographics.preferred_name || 
      demographics.gender_assigned_at_birth || demographics.pronouns) {
    sections.push('basic_information');
  }

  // Guardian Information
  if (demographics.guardian_name || demographics.shared_parenting_agreement || 
      demographics.custody_concerns) {
    sections.push('guardian_information');
  }

  // Education
  if (demographics.school_name || demographics.current_grade || 
      demographics.has_iep_504 || demographics.behavioral_academic_concerns) {
    sections.push('education');
  }

  // Developmental History
  if (demographics.complications_prior_birth || demographics.complications_at_birth || 
      demographics.milestones_met) {
    sections.push('developmental_history');
  }

  // Life Changes
  if (demographics.life_changes && demographics.life_changes.length > 0) {
    sections.push('life_changes');
  }

  // Activities
  if (demographics.has_part_time_job !== null || demographics.has_extracurriculars !== null || 
      demographics.fun_activities || demographics.spirituality) {
    sections.push('activities');
  }

  return sections;
}

/**
 * Sanitize demographics data to prevent XSS and injection attacks
 * @param {object} data - Raw demographics data
 * @returns {object} Sanitized demographics data
 */
function sanitizeDemographicsData(data) {
  const sanitized = {};

  // String fields (100 char limit)
  const stringFields100 = ['legal_name', 'preferred_name', 'gender_other_text', 
                           'guardian_name', 'pronouns'];
  for (const field of stringFields100) {
    if (data[field]) {
      sanitized[field] = sanitizeInput(data[field], 100);
    }
  }

  // String fields (200 char limit)
  if (data.school_name) {
    sanitized.school_name = sanitizeInput(data.school_name, 200);
  }

  // String fields (50 char limit for dropdowns/enums)
  const stringFields50 = ['gender_assigned_at_birth', 'current_grade', 
                          'shared_parenting_agreement', 'custody_concerns',
                          'has_iep_504', 'behavioral_academic_concerns',
                          'complications_prior_birth', 'complications_at_birth',
                          'milestones_met', 'spirituality'];
  for (const field of stringFields50) {
    if (data[field]) {
      sanitized[field] = sanitizeInput(data[field], 50);
    }
  }

  // Text area fields (500 char limit)
  const textAreaFields = ['shared_parenting_details', 'custody_concerns_details',
                          'iep_504_details', 'behavioral_academic_details',
                          'complications_prior_details', 'complications_birth_details',
                          'milestones_details', 'life_changes_other_text',
                          'extracurriculars_details', 'fun_activities'];
  for (const field of textAreaFields) {
    if (data[field]) {
      sanitized[field] = sanitizeTextArea(data[field], 500);
    }
  }

  // Boolean fields
  if (typeof data.has_part_time_job === 'boolean') {
    sanitized.has_part_time_job = data.has_part_time_job;
  }
  if (typeof data.has_extracurriculars === 'boolean') {
    sanitized.has_extracurriculars = data.has_extracurriculars;
  }
  if (typeof data.completed === 'boolean') {
    sanitized.completed = data.completed;
  }

  // Array fields
  if (Array.isArray(data.life_changes)) {
    sanitized.life_changes = data.life_changes.map(item => sanitizeInput(item, 100));
  }
  if (Array.isArray(data.sections_completed)) {
    sanitized.sections_completed = data.sections_completed.map(item => sanitizeInput(item, 100));
  }

  return sanitized;
}

/**
 * Log audit event for demographics changes
 * @param {string} action - Action performed
 * @param {string} patientId - UUID of patient
 * @param {string} userId - UUID of user
 * @param {string} demographicsId - UUID of demographics record
 * @param {object} metadata - Additional metadata
 */
async function logAuditEvent(action, patientId, userId, demographicsId, metadata = {}) {
  try {
    // This would integrate with your audit logging system
    // For now, just console log for HIPAA compliance
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      action,
      patient_id: patientId,
      user_id: userId,
      demographics_id: demographicsId,
      metadata
    });
    
    // TODO: Insert into audit_log table when implemented
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging failures shouldn't break the main operation
  }
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

