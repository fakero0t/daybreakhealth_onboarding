/**
 * Demographics Validation
 * 
 * Validation rules for demographics data.
 * All fields are optional, but if provided, must meet constraints.
 */

/**
 * Validate demographics data
 * @param {object} data - Demographics data to validate
 * @param {boolean} isPartial - Whether this is a partial update (more lenient)
 * @returns {array} Array of validation error objects
 */
export function validateDemographics(data, isPartial = false) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Invalid data format' });
    return errors;
  }

  // String fields with 100 char limit
  const stringFields100 = {
    legal_name: 'Legal Name',
    preferred_name: 'Preferred Name',
    gender_other_text: 'Gender Other Text',
    guardian_name: 'Guardian Name',
    pronouns: 'Pronouns'
  };

  for (const [field, label] of Object.entries(stringFields100)) {
    if (data[field] !== undefined && data[field] !== null) {
      const error = validateStringField(data[field], field, label, 100);
      if (error) errors.push(error);
    }
  }

  // School name (200 char limit)
  if (data.school_name !== undefined && data.school_name !== null) {
    const error = validateStringField(data.school_name, 'school_name', 'School Name', 200);
    if (error) errors.push(error);
  }

  // Enum/dropdown fields (50 char limit)
  const stringFields50 = {
    gender_assigned_at_birth: 'Gender Assigned at Birth',
    current_grade: 'Current Grade',
    shared_parenting_agreement: 'Shared Parenting Agreement',
    custody_concerns: 'Custody Concerns',
    has_iep_504: 'IEP/504 Plan',
    behavioral_academic_concerns: 'Behavioral/Academic Concerns',
    complications_prior_birth: 'Complications Prior to Birth',
    complications_at_birth: 'Complications at Birth',
    milestones_met: 'Developmental Milestones',
    spirituality: 'Spirituality'
  };

  for (const [field, label] of Object.entries(stringFields50)) {
    if (data[field] !== undefined && data[field] !== null) {
      const error = validateStringField(data[field], field, label, 50);
      if (error) errors.push(error);
    }
  }

  // Text area fields (500 char limit)
  const textAreaFields = {
    shared_parenting_details: 'Shared Parenting Details',
    custody_concerns_details: 'Custody Concerns Details',
    iep_504_details: 'IEP/504 Plan Details',
    behavioral_academic_details: 'Behavioral/Academic Concerns Details',
    complications_prior_details: 'Complications Prior to Birth Details',
    complications_birth_details: 'Complications at Birth Details',
    milestones_details: 'Developmental Milestones Details',
    life_changes_other_text: 'Life Changes Other Text',
    extracurriculars_details: 'Extracurricular Activities Details',
    fun_activities: 'Fun Activities'
  };

  for (const [field, label] of Object.entries(textAreaFields)) {
    if (data[field] !== undefined && data[field] !== null) {
      const error = validateTextField(data[field], field, label, 500);
      if (error) errors.push(error);
    }
  }

  // Validate specific enum values
  if (data.gender_assigned_at_birth !== undefined && data.gender_assigned_at_birth !== null) {
    const validValues = ['male', 'female', 'intersex', 'prefer_not_to_answer', 'other'];
    if (!validValues.includes(data.gender_assigned_at_birth.toLowerCase())) {
      errors.push({
        field: 'gender_assigned_at_birth',
        message: `Gender Assigned at Birth must be one of: ${validValues.join(', ')}`
      });
    }
  }

  if (data.pronouns !== undefined && data.pronouns !== null) {
    const validValues = ['she/hers', 'he/his', 'they/them', 'ze/zer', 'ask me', 'prefer_not_to_answer'];
    if (!validValues.includes(data.pronouns.toLowerCase())) {
      errors.push({
        field: 'pronouns',
        message: `Pronouns must be one of: ${validValues.join(', ')}`
      });
    }
  }

  // Validate yes/no/prefer_not_to_answer fields
  const yesNoFields = [
    'shared_parenting_agreement',
    'custody_concerns',
    'has_iep_504',
    'behavioral_academic_concerns',
    'complications_prior_birth',
    'complications_at_birth',
    'milestones_met'
  ];

  for (const field of yesNoFields) {
    if (data[field] !== undefined && data[field] !== null) {
      const validValues = ['yes', 'no', 'prefer_not_to_answer'];
      if (!validValues.includes(data[field].toLowerCase())) {
        errors.push({
          field,
          message: `${field} must be one of: ${validValues.join(', ')}`
        });
      }
    }
  }

  if (data.spirituality !== undefined && data.spirituality !== null) {
    const validValues = ['yes', 'no', 'complicated', 'prefer_not_to_answer'];
    if (!validValues.includes(data.spirituality.toLowerCase())) {
      errors.push({
        field: 'spirituality',
        message: `Spirituality must be one of: ${validValues.join(', ')}`
      });
    }
  }

  if (data.current_grade !== undefined && data.current_grade !== null) {
    const validGrades = [
      'pre-k', 'kindergarten', '1st', '2nd', '3rd', '4th', '5th', '6th',
      '7th', '8th', '9th', '10th', '11th', '12th', 'college', 
      'not in school', 'other'
    ];
    if (!validGrades.includes(data.current_grade.toLowerCase())) {
      errors.push({
        field: 'current_grade',
        message: `Current Grade must be one of the valid grade levels`
      });
    }
  }

  // Boolean fields
  const booleanFields = ['has_part_time_job', 'has_extracurriculars', 'completed'];
  for (const field of booleanFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] !== 'boolean') {
        errors.push({
          field,
          message: `${field} must be a boolean value`
        });
      }
    }
  }

  // Array fields
  if (data.life_changes !== undefined && data.life_changes !== null) {
    if (!Array.isArray(data.life_changes)) {
      errors.push({
        field: 'life_changes',
        message: 'Life changes must be an array'
      });
    } else {
      const validLifeChanges = [
        'frequent_moves',
        'changes_in_caregivers',
        'death_of_friend_relative',
        'witness_to_violence',
        'history_of_abuse_neglect',
        'other',
        'prefer_not_to_answer'
      ];
      
      for (const change of data.life_changes) {
        if (typeof change !== 'string') {
          errors.push({
            field: 'life_changes',
            message: 'All life changes must be strings'
          });
          break;
        }
        if (!validLifeChanges.includes(change.toLowerCase())) {
          errors.push({
            field: 'life_changes',
            message: `Invalid life change value: ${change}`
          });
        }
      }
    }
  }

  if (data.sections_completed !== undefined && data.sections_completed !== null) {
    if (!Array.isArray(data.sections_completed)) {
      errors.push({
        field: 'sections_completed',
        message: 'Sections completed must be an array'
      });
    } else {
      const validSections = [
        'basic_information',
        'guardian_information',
        'education',
        'developmental_history',
        'life_changes',
        'activities'
      ];
      
      for (const section of data.sections_completed) {
        if (typeof section !== 'string') {
          errors.push({
            field: 'sections_completed',
            message: 'All section names must be strings'
          });
          break;
        }
        if (!validSections.includes(section.toLowerCase())) {
          errors.push({
            field: 'sections_completed',
            message: `Invalid section name: ${section}`
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a string field
 * @param {string} value - Value to validate
 * @param {string} field - Field name
 * @param {string} label - Field label for error messages
 * @param {number} maxLength - Maximum length
 * @returns {object|null} Error object or null
 */
function validateStringField(value, field, label, maxLength) {
  if (typeof value !== 'string') {
    return {
      field,
      message: `${label} must be a string`
    };
  }

  if (value.length > maxLength) {
    return {
      field,
      message: `${label} must not exceed ${maxLength} characters (current: ${value.length})`
    };
  }

  return null;
}

/**
 * Validate a text area field (allows more characters)
 * @param {string} value - Value to validate
 * @param {string} field - Field name
 * @param {string} label - Field label for error messages
 * @param {number} maxLength - Maximum length
 * @returns {object|null} Error object or null
 */
function validateTextField(value, field, label, maxLength) {
  if (typeof value !== 'string') {
    return {
      field,
      message: `${label} must be a string`
    };
  }

  if (value.length > maxLength) {
    return {
      field,
      message: `${label} must not exceed ${maxLength} characters (current: ${value.length})`
    };
  }

  return null;
}

/**
 * Check if demographics data is complete
 * @param {object} data - Demographics data
 * @returns {boolean} True if complete
 */
export function isComplete(data) {
  // Define minimum required fields for completion
  // Since all fields are optional, we'll consider it "complete" if
  // they've gone through all sections (based on sections_completed)
  
  if (!data || !data.sections_completed || !Array.isArray(data.sections_completed)) {
    return false;
  }

  const requiredSections = [
    'basic_information',
    'guardian_information',
    'education',
    'developmental_history',
    'life_changes',
    'activities'
  ];

  return requiredSections.every(section => 
    data.sections_completed.includes(section)
  );
}

