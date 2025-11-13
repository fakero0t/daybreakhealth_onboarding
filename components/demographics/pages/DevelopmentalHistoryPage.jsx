/**
 * Developmental History Page
 * 
 * Collects: Complications Prior to Birth, Complications at Birth, Developmental Milestones
 */

'use client';

import RadioGroup from '../RadioGroup';

export default function DevelopmentalHistoryPage({ data, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Developmental History
        </h2>
        <p className="text-gray-600">
          Tell us about early development. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <RadioGroup
          label="Complications prior to birth?"
          name="complications_prior_birth"
          value={data.complications_prior_birth || ''}
          onChange={(value) => handleFieldChange('complications_prior_birth', value)}
          options={yesNoOptions}
          helpText="Were there any complications during pregnancy?"
          showFollowUp={true}
          followUpValue={data.complications_prior_details || ''}
          onFollowUpChange={(value) => handleFieldChange('complications_prior_details', value)}
          followUpLabel="Please describe the complications"
        />

        <RadioGroup
          label="Complications at birth?"
          name="complications_at_birth"
          value={data.complications_at_birth || ''}
          onChange={(value) => handleFieldChange('complications_at_birth', value)}
          options={yesNoOptions}
          helpText="Were there any complications during delivery or at birth?"
          showFollowUp={true}
          followUpValue={data.complications_birth_details || ''}
          onFollowUpChange={(value) => handleFieldChange('complications_birth_details', value)}
          followUpLabel="Please describe the complications"
        />

        <RadioGroup
          label="All developmental milestones met?"
          name="milestones_met"
          value={data.milestones_met || ''}
          onChange={(value) => handleFieldChange('milestones_met', value)}
          options={yesNoOptions}
          helpText="Were developmental milestones (sitting, walking, talking, etc.) met on time?"
          showFollowUp={true}
          followUpValue={data.milestones_details || ''}
          onFollowUpChange={(value) => handleFieldChange('milestones_details', value)}
          followUpLabel="Please describe any delayed milestones"
        />
      </div>
    </div>
  );
}

