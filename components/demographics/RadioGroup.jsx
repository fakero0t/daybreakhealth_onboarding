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
        <legend className="block text-sm font-medium text-text-body mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </legend>

        {helpText && (
          <p className="text-sm text-text-secondary mb-3">{helpText}</p>
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
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                    : 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50'
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
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
                  aria-invalid={hasError}
                />
                <span className="ml-3 text-sm font-medium text-text-body">
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
        <div className="mt-4 pl-4 border-l-2 border-primary-300">
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

