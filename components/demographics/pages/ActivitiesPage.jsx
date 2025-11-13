/**
 * Activities Page
 * 
 * Collects: Part-time Job, Extracurriculars, Fun Activities, Spirituality
 */

'use client';

import RadioGroup from '../RadioGroup';
import TextArea from '../TextArea';

export default function ActivitiesPage({ data, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const yesNoSimple = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  const spiritualityOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'complicated', label: "It's complicated" },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  // Convert boolean to string for RadioGroup
  const jobValue = data.has_part_time_job === true ? 'yes' : data.has_part_time_job === false ? 'no' : '';
  const extracurricularValue = data.has_extracurriculars === true ? 'yes' : data.has_extracurriculars === false ? 'no' : '';

  const handleJobChange = (value) => {
    handleFieldChange('has_part_time_job', value === 'yes');
  };

  const handleExtracurricularChange = (value) => {
    handleFieldChange('has_extracurriculars', value === 'yes');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Activities and Interests
        </h2>
        <p className="text-gray-600">
          Tell us about your activities and interests. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <RadioGroup
          label="Work a part-time job?"
          name="has_part_time_job"
          value={jobValue}
          onChange={handleJobChange}
          options={yesNoSimple}
        />

        <RadioGroup
          label="Involved in extra-curricular activities (sports, youth groups, or clubs)?"
          name="has_extracurriculars"
          value={extracurricularValue}
          onChange={handleExtracurricularChange}
          options={yesNoSimple}
          showFollowUp={true}
          followUpValue={data.extracurriculars_details || ''}
          onFollowUpChange={(value) => handleFieldChange('extracurriculars_details', value)}
          followUpLabel="Please describe your activities"
        />

        <TextArea
          label="What do you like to do for fun?"
          name="fun_activities"
          value={data.fun_activities || ''}
          onChange={(value) => handleFieldChange('fun_activities', value)}
          maxLength={500}
          placeholder="Tell us about your hobbies, interests, and fun activities..."
          helpText="Share what you enjoy doing in your free time"
          rows={4}
        />

        <RadioGroup
          label="Is spirituality a part of your life?"
          name="spirituality"
          value={data.spirituality || ''}
          onChange={(value) => handleFieldChange('spirituality', value)}
          options={spiritualityOptions}
        />
      </div>
    </div>
  );
}

