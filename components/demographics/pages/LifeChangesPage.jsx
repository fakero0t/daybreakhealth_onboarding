/**
 * Life Changes Page
 * 
 * Collects: Significant life changes (multi-select)
 */

'use client';

import CheckboxGroup from '../CheckboxGroup';

export default function LifeChangesPage({ data, onChange }) {
  const handleFieldChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const lifeChangeOptions = [
    { value: 'frequent_moves', label: 'Frequent moves' },
    { value: 'changes_in_caregivers', label: 'Changes in caregivers' },
    { value: 'death_of_friend_relative', label: 'Death of a friend/relative' },
    { value: 'witness_to_violence', label: 'Witness to violence' },
    { value: 'history_of_abuse_neglect', label: 'History of abuse/neglect' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_answer', label: 'Prefer not to answer' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary-500 mb-2">
          Significant Life Changes
        </h2>
        <p className="text-text-body">
          Have there been any significant changes in life? You can select multiple options. All fields are optional.
        </p>
      </div>

      <div className="space-y-5">
        <CheckboxGroup
          label="Any significant changes in life such as:"
          name="life_changes"
          value={data.life_changes || []}
          onChange={(value) => handleFieldChange('life_changes', value)}
          options={lifeChangeOptions}
          helpText="Select all that apply"
          hasOtherOption={true}
          otherValue={data.life_changes_other_text || ''}
          onOtherChange={(value) => handleFieldChange('life_changes_other_text', value)}
        />
      </div>

      <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <p className="text-sm text-primary-900">
          <strong>Note:</strong> This information helps us provide better care and support. 
          All information is kept confidential and secure.
        </p>
      </div>
    </div>
  );
}

