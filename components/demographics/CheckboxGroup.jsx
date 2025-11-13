/**
 * CheckboxGroup Component
 * 
 * Reusable checkbox group for multiple selection with optional "Other" field
 */

'use client';

import TextArea from './TextArea';

export default function CheckboxGroup({
  label,
  value = [],
  onChange,
  options = [],
  required = false,
  error = '',
  name = '',
  disabled = false,
  helpText = '',
  hasOtherOption = false,
  otherValue = '',
  onOtherChange = null
}) {
  const hasError = !!error;
  const showOtherField = hasOtherOption && value.includes('other');

  const handleCheckboxChange = (optionValue, checked) => {
    let newValue;
    if (checked) {
      newValue = [...value, optionValue];
    } else {
      newValue = value.filter(v => v !== optionValue);
      // Clear other field if unchecking "other"
      if (optionValue === 'other' && onOtherChange) {
        onOtherChange('');
      }
    }
    onChange(newValue);
  };

  const isChecked = (optionValue) => {
    return value.includes(optionValue);
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

        <div className="space-y-2" role="group" aria-labelledby={`${name}-label`}>
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            const checked = isChecked(optionValue);

            return (
              <label
                key={optionValue}
                className={`
                  flex items-center p-3 border rounded-lg cursor-pointer
                  transition-all duration-200
                  ${checked 
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                    : 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${hasError ? 'border-red-500' : ''}
                `}
              >
                <input
                  type="checkbox"
                  name={`${name}[]`}
                  value={optionValue}
                  checked={checked}
                  onChange={(e) => handleCheckboxChange(optionValue, e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
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

      {showOtherField && onOtherChange && (
        <div className="mt-4 pl-4 border-l-2 border-primary-300">
          <TextArea
            label="Please specify other life changes"
            value={otherValue}
            onChange={onOtherChange}
            maxLength={500}
            name={`${name}-other-text`}
            placeholder="Please describe..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

