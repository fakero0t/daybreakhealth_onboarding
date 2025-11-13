/**
 * TextInput Component
 * 
 * Reusable text input with character limit display and validation
 */

'use client';

import { useState } from 'react';

export default function TextInput({
  label,
  value = '',
  onChange,
  maxLength = 100,
  placeholder = '',
  helpText = '',
  required = false,
  error = '',
  name = '',
  disabled = false
}) {
  const [isFocused, setIsFocused] = useState(false);
  const currentLength = value ? value.length : 0;
  const isNearLimit = currentLength >= maxLength * 0.8;
  const hasError = !!error;

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={`
            w-full px-4 py-2 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            transition-colors duration-200
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
        />
      </div>

      <div className="flex justify-between items-center mt-1">
        <div className="flex-1">
          {hasError && (
            <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {!hasError && helpText && (
            <p id={`${name}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
        </div>
        
        {(isFocused || isNearLimit) && (
          <span 
            className={`text-xs ml-2 ${
              isNearLimit ? 'text-orange-600 font-medium' : 'text-gray-500'
            }`}
            aria-live="polite"
          >
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

