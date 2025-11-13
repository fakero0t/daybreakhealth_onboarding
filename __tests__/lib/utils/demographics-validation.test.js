/**
 * Tests for demographics validation
 */

import { validateDemographics, isComplete } from '../../../lib/utils/demographics-validation';

describe('validateDemographics', () => {
  test('accepts empty object', () => {
    const errors = validateDemographics({});
    expect(errors).toHaveLength(0);
  });

  test('accepts valid data', () => {
    const data = {
      legal_name: 'John Doe',
      preferred_name: 'Johnny',
      gender_assigned_at_birth: 'male',
      pronouns: 'he/his',
      guardian_name: 'Jane Doe',
      school_name: 'Lincoln Elementary',
      current_grade: '3rd',
      has_part_time_job: false,
      has_extracurriculars: true,
      completed: false,
      sections_completed: ['basic_information', 'education']
    };
    const errors = validateDemographics(data);
    expect(errors).toHaveLength(0);
  });

  test('rejects names exceeding 100 characters', () => {
    const data = {
      legal_name: 'a'.repeat(150)
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('legal_name');
    expect(errors[0].message).toContain('100 characters');
  });

  test('rejects school name exceeding 200 characters', () => {
    const data = {
      school_name: 'a'.repeat(250)
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('school_name');
    expect(errors[0].message).toContain('200 characters');
  });

  test('rejects text areas exceeding 500 characters', () => {
    const data = {
      fun_activities: 'a'.repeat(600)
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('fun_activities');
    expect(errors[0].message).toContain('500 characters');
  });

  test('rejects invalid gender values', () => {
    const data = {
      gender_assigned_at_birth: 'invalid'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('gender_assigned_at_birth');
  });

  test('accepts valid gender values', () => {
    const validValues = ['male', 'female', 'intersex', 'prefer_not_to_answer', 'other'];
    for (const value of validValues) {
      const errors = validateDemographics({ gender_assigned_at_birth: value });
      expect(errors).toHaveLength(0);
    }
  });

  test('rejects invalid pronouns', () => {
    const data = {
      pronouns: 'invalid'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('pronouns');
  });

  test('accepts valid pronouns', () => {
    const validValues = ['she/hers', 'he/his', 'they/them', 'ze/zer', 'ask me', 'prefer_not_to_answer'];
    for (const value of validValues) {
      const errors = validateDemographics({ pronouns: value });
      expect(errors).toHaveLength(0);
    }
  });

  test('rejects invalid grade values', () => {
    const data = {
      current_grade: 'invalid grade'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('current_grade');
  });

  test('accepts valid grade values', () => {
    const validValues = ['pre-k', 'kindergarten', '1st', '5th', '12th', 'college', 'not in school'];
    for (const value of validValues) {
      const errors = validateDemographics({ current_grade: value });
      expect(errors).toHaveLength(0);
    }
  });

  test('rejects invalid yes/no values', () => {
    const data = {
      has_iep_504: 'maybe'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('has_iep_504');
  });

  test('accepts valid yes/no values', () => {
    const validValues = ['yes', 'no', 'prefer_not_to_answer'];
    for (const value of validValues) {
      const errors = validateDemographics({ has_iep_504: value });
      expect(errors).toHaveLength(0);
    }
  });

  test('rejects invalid spirituality values', () => {
    const data = {
      spirituality: 'invalid'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('spirituality');
  });

  test('accepts valid spirituality values', () => {
    const validValues = ['yes', 'no', 'complicated', 'prefer_not_to_answer'];
    for (const value of validValues) {
      const errors = validateDemographics({ spirituality: value });
      expect(errors).toHaveLength(0);
    }
  });

  test('rejects non-boolean for boolean fields', () => {
    const data = {
      has_part_time_job: 'yes',
      has_extracurriculars: 'no'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('accepts boolean values for boolean fields', () => {
    const data = {
      has_part_time_job: true,
      has_extracurriculars: false,
      completed: true
    };
    const errors = validateDemographics(data);
    expect(errors).toHaveLength(0);
  });

  test('rejects non-array for life_changes', () => {
    const data = {
      life_changes: 'not an array'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('life_changes');
  });

  test('accepts valid life_changes array', () => {
    const data = {
      life_changes: ['frequent_moves', 'death_of_friend_relative']
    };
    const errors = validateDemographics(data);
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid life_changes values', () => {
    const data = {
      life_changes: ['frequent_moves', 'invalid_value']
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('rejects non-array for sections_completed', () => {
    const data = {
      sections_completed: 'not an array'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('sections_completed');
  });

  test('accepts valid sections_completed array', () => {
    const data = {
      sections_completed: ['basic_information', 'education', 'activities']
    };
    const errors = validateDemographics(data);
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid section names', () => {
    const data = {
      sections_completed: ['basic_information', 'invalid_section']
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('handles null and undefined values', () => {
    const data = {
      legal_name: null,
      preferred_name: undefined,
      gender_assigned_at_birth: 'male'
    };
    const errors = validateDemographics(data);
    expect(errors).toHaveLength(0);
  });

  test('rejects invalid data type', () => {
    const errors = validateDemographics(null);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].field).toBe('data');
  });

  test('validates multiple errors', () => {
    const data = {
      legal_name: 'a'.repeat(150),
      school_name: 'b'.repeat(250),
      gender_assigned_at_birth: 'invalid'
    };
    const errors = validateDemographics(data);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('isComplete', () => {
  test('returns false for null data', () => {
    expect(isComplete(null)).toBe(false);
  });

  test('returns false for data without sections_completed', () => {
    expect(isComplete({})).toBe(false);
  });

  test('returns false for empty sections_completed', () => {
    expect(isComplete({ sections_completed: [] })).toBe(false);
  });

  test('returns false for incomplete sections', () => {
    const data = {
      sections_completed: ['basic_information', 'education']
    };
    expect(isComplete(data)).toBe(false);
  });

  test('returns true for all sections completed', () => {
    const data = {
      sections_completed: [
        'basic_information',
        'guardian_information',
        'education',
        'developmental_history',
        'life_changes',
        'activities'
      ]
    };
    expect(isComplete(data)).toBe(true);
  });

  test('returns true even if sections are in different order', () => {
    const data = {
      sections_completed: [
        'activities',
        'education',
        'basic_information',
        'life_changes',
        'developmental_history',
        'guardian_information'
      ]
    };
    expect(isComplete(data)).toBe(true);
  });

  test('returns false if missing one section', () => {
    const data = {
      sections_completed: [
        'basic_information',
        'guardian_information',
        'education',
        'developmental_history',
        'life_changes'
        // missing 'activities'
      ]
    };
    expect(isComplete(data)).toBe(false);
  });
});

