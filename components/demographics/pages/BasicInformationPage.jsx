/**
 * Basic Information Page
 * 
 * Collects: Legal Name, Preferred Name, Gender Assigned at Birth, Pronouns
 */

'use client';

import TextInput from '../TextInput';
import Dropdown from '../Dropdown';
import RadioGroup from '../RadioGroup';

export default function BasicInformationPage({ data, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'intersex', label: 'Intersex' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' },
    { value: 'other', label: 'Other' }
  ];

  const pronounOptions = [
    { value: 'she/hers', label: 'She/Hers' },
    { value: 'he/his', label: 'He/His' },
    { value: 'they/them', label: 'They/Them' },
    { value: 'ze/zer', label: 'Ze/Zer' },
    { value: 'ask me', label: 'Ask me' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">
          Tell us about yourself. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <TextInput
          label="Legal Name"
          name="legal_name"
          value={data.legal_name || ''}
          onChange={(value) => handleFieldChange('legal_name', value)}
          maxLength={100}
          placeholder="Enter your legal name"
          helpText="Your full legal name as it appears on official documents"
        />

        <TextInput
          label="Preferred Name"
          name="preferred_name"
          value={data.preferred_name || ''}
          onChange={(value) => handleFieldChange('preferred_name', value)}
          maxLength={100}
          placeholder="Enter your preferred name"
          helpText="The name you'd like us to call you"
        />

        <TextInput
          label="Email"
          name="email"
          type="email"
          value={data.email || ''}
          onChange={(value) => handleFieldChange('email', value)}
          maxLength={255}
          placeholder="Enter your email address"
          helpText="We'll use this to contact you about your appointment"
        />

        <Dropdown
          label="Gender Assigned at Birth"
          name="gender_assigned_at_birth"
          value={data.gender_assigned_at_birth || ''}
          onChange={(value) => handleFieldChange('gender_assigned_at_birth', value)}
          options={genderOptions}
          placeholder="Select gender assigned at birth"
          hasOtherOption={true}
          otherValue={data.gender_other_text || ''}
          onOtherChange={(value) => handleFieldChange('gender_other_text', value)}
        />

        <RadioGroup
          label="Pronouns"
          name="pronouns"
          value={data.pronouns || ''}
          onChange={(value) => handleFieldChange('pronouns', value)}
          options={pronounOptions}
          helpText="Select the pronouns you'd like us to use"
        />
      </div>
    </div>
  );
}

