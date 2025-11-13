/**
 * Guardian Information Page
 * 
 * Collects: Guardian Name, Shared Parenting Agreement, Custody Concerns
 */

'use client';

import TextInput from '../TextInput';
import RadioGroup from '../RadioGroup';

export default function GuardianInformationPage({ data, onChange }) {
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
          Guardian Information
        </h2>
        <p className="text-gray-600">
          Tell us about your parent or legal guardian. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label="Parent/Legal Guardian Name"
          name="guardian_name"
          value={data.guardian_name || ''}
          onChange={(value) => handleFieldChange('guardian_name', value)}
          maxLength={100}
          placeholder="Enter guardian's name"
        />

        <RadioGroup
          label="Legal shared parenting agreement?"
          name="shared_parenting_agreement"
          value={data.shared_parenting_agreement || ''}
          onChange={(value) => handleFieldChange('shared_parenting_agreement', value)}
          options={yesNoOptions}
          helpText="Do you have a legal shared parenting agreement in place?"
          showFollowUp={true}
          followUpValue={data.shared_parenting_details || ''}
          onFollowUpChange={(value) => handleFieldChange('shared_parenting_details', value)}
          followUpLabel="Please provide details about the shared parenting agreement"
        />

        <RadioGroup
          label="Custody concerns?"
          name="custody_concerns"
          value={data.custody_concerns || ''}
          onChange={(value) => handleFieldChange('custody_concerns', value)}
          options={yesNoOptions}
          helpText="Are there any custody concerns we should be aware of?"
          showFollowUp={true}
          followUpValue={data.custody_concerns_details || ''}
          onFollowUpChange={(value) => handleFieldChange('custody_concerns_details', value)}
          followUpLabel="Please describe the custody concerns"
        />
      </div>
    </div>
  );
}

