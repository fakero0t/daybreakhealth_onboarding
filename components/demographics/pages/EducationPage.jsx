/**
 * Education Page
 * 
 * Collects: School Name, Current Grade, IEP/504 Plan, Behavioral/Academic Concerns
 */

'use client';

import TextInput from '../TextInput';
import Dropdown from '../Dropdown';
import RadioGroup from '../RadioGroup';

export default function EducationPage({ data, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const gradeOptions = [
    { value: 'pre-k', label: 'Pre-K' },
    { value: 'kindergarten', label: 'Kindergarten' },
    { value: '1st', label: '1st Grade' },
    { value: '2nd', label: '2nd Grade' },
    { value: '3rd', label: '3rd Grade' },
    { value: '4th', label: '4th Grade' },
    { value: '5th', label: '5th Grade' },
    { value: '6th', label: '6th Grade' },
    { value: '7th', label: '7th Grade' },
    { value: '8th', label: '8th Grade' },
    { value: '9th', label: '9th Grade' },
    { value: '10th', label: '10th Grade' },
    { value: '11th', label: '11th Grade' },
    { value: '12th', label: '12th Grade' },
    { value: 'college', label: 'College' },
    { value: 'not in school', label: 'Not in school' },
    { value: 'other', label: 'Other' }
  ];

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Education
        </h2>
        <p className="text-gray-600">
          Tell us about your education. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label="School/Day Care Name"
          name="school_name"
          value={data.school_name || ''}
          onChange={(value) => handleFieldChange('school_name', value)}
          maxLength={200}
          placeholder="Enter school or daycare name"
        />

        <Dropdown
          label="Current Grade"
          name="current_grade"
          value={data.current_grade || ''}
          onChange={(value) => handleFieldChange('current_grade', value)}
          options={gradeOptions}
          placeholder="Select current grade"
        />

        <RadioGroup
          label="Have an IEP or 504 Plan?"
          name="has_iep_504"
          value={data.has_iep_504 || ''}
          onChange={(value) => handleFieldChange('has_iep_504', value)}
          options={yesNoOptions}
          helpText="Do you have an Individualized Education Program (IEP) or 504 Plan?"
          showFollowUp={true}
          followUpValue={data.iep_504_details || ''}
          onFollowUpChange={(value) => handleFieldChange('iep_504_details', value)}
          followUpLabel="Please provide details about your IEP or 504 Plan"
        />

        <RadioGroup
          label="Any behavioral or academic concerns?"
          name="behavioral_academic_concerns"
          value={data.behavioral_academic_concerns || ''}
          onChange={(value) => handleFieldChange('behavioral_academic_concerns', value)}
          options={yesNoOptions}
          helpText="Are there any behavioral or academic concerns at school?"
          showFollowUp={true}
          followUpValue={data.behavioral_academic_details || ''}
          onFollowUpChange={(value) => handleFieldChange('behavioral_academic_details', value)}
          followUpLabel="Please describe the concerns"
        />
      </div>
    </div>
  );
}

