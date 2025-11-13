/**
 * Dropdown Component
 * 
 * Reusable dropdown/select with optional "Other" text field
 */

'use client';

import { useState } from 'react';
import TextInput from './TextInput';

export default function Dropdown({
  label,
  value = '',
  onChange,
  options = [],
  required = false,
  error = '',
  name = '',
  disabled = false,
  helpText = '',
  placeholder = 'Select an option',
  hasOtherOption = false,
  otherValue = '',
  onOtherChange = null
}) {
  const hasError = !!error;
  const showOtherField = hasOtherOption && value === 'other';

  const handleSelectChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    // Clear other field if switching away from "other"
    if (onOtherChange && newValue !== 'other') {
      onOtherChange('');
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {helpText && (
        <p className="text-sm text-gray-500 mb-2">{helpText}</p>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={handleSelectChange}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          transition-colors duration-200
          ${!value ? 'text-gray-400' : 'text-gray-900'}
        `}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>

      {hasError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {showOtherField && onOtherChange && (
        <div className="mt-3">
          <TextInput
            label="Please specify"
            value={otherValue}
            onChange={onOtherChange}
            maxLength={100}
            name={`${name}-other`}
            placeholder="Please specify..."
          />
        </div>
      )}
    </div>
  );
}

