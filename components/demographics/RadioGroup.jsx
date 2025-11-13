/**
 * RadioGroup Component
 * 
 * Reusable radio button group with conditional follow-up field
 */

'use client';

import TextArea from './TextArea';

export default function RadioGroup({
  label,
  value = '',
  onChange,
  options = [],
  required = false,
  error = '',
  name = '',
  disabled = false,
  helpText = '',
  showFollowUp = false,
  followUpValue = '',
  onFollowUpChange = null,
  followUpLabel = 'Please provide details',
  followUpMaxLength = 500
}) {
  const hasError = !!error;

  const handleRadioChange = (optionValue) => {
    onChange(optionValue);
    // Clear follow-up if switching away from the option that triggers it
    if (onFollowUpChange && !shouldShowFollowUp(optionValue)) {
      onFollowUpChange('');
    }
  };

  const shouldShowFollowUp = (currentValue) => {
    return showFollowUp && currentValue === 'yes';
  };

  return (
    <div className="w-full">
      <fieldset>
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>

        {helpText && (
          <p className="text-sm text-gray-500 mb-3">{helpText}</p>
        )}

        <div className="space-y-2" role="radiogroup" aria-labelledby={`${name}-label`}>
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            const isChecked = value === optionValue;

            return (
              <label
                key={optionValue}
                className={`
                  flex items-center p-3 border rounded-lg cursor-pointer
                  transition-all duration-200
                  ${isChecked 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${hasError ? 'border-red-500' : ''}
                `}
              >
                <input
                  type="radio"
                  name={name}
                  value={optionValue}
                  checked={isChecked}
                  onChange={() => handleRadioChange(optionValue)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  aria-invalid={hasError}
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {optionLabel}
                </span>
              </label>
            );
          })}
        </div>

        {hasError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </fieldset>

      {shouldShowFollowUp(value) && onFollowUpChange && (
        <div className="mt-4 pl-4 border-l-2 border-blue-300">
          <TextArea
            label={followUpLabel}
            value={followUpValue}
            onChange={onFollowUpChange}
            maxLength={followUpMaxLength}
            name={`${name}-details`}
            placeholder="Please provide additional details..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

