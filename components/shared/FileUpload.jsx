'use client'

import { useState, useRef, useCallback } from 'react'
import { XMarkIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

/**
 * FileUpload Component
 * 
 * A reusable file upload component with drag-and-drop, preview, and validation.
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the file input
 * @param {string} props.accept - Accepted file types (e.g., "image/*,application/pdf")
 * @param {number} props.maxSize - Maximum file size in bytes (default: 10MB)
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {Function} props.onFileRemove - Callback when file is removed
 * @param {File|null} props.preview - File object for preview
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional CSS classes
 */
export default function FileUpload({
  label,
  accept = 'image/jpeg,image/jpg,image/png,application/pdf',
  maxSize = MAX_FILE_SIZE,
  onFileSelect,
  onFileRemove,
  preview = null,
  error = null,
  required = false,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [internalError, setInternalError] = useState(null)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  // Validate file
  const validateFile = useCallback((file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "This file type is not supported. Please upload a JPEG, PNG, or PDF file.",
      }
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "This file is too large. Please upload a file that is 10MB or smaller.",
      }
    }

    return { valid: true, error: null }
  }, [maxSize])

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    setInternalError(null)
    
    // Handle null/undefined file
    if (!file) {
      setInternalError('No file selected. Please try again.')
      onFileSelect?.(null)
      return
    }

    // Validate file
    const validation = validateFile(file)

    if (!validation.valid) {
      setInternalError(validation.error)
      onFileSelect?.(null)
      return
    }

    // Additional safety check - ensure file object is valid
    if (!(file instanceof File)) {
      setInternalError('Invalid file. Please try selecting a different file.')
      onFileSelect?.(null)
      return
    }

    onFileSelect?.(file)
  }, [validateFile, onFileSelect])

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    try {
      const files = Array.from(e.dataTransfer.files || [])
      if (files.length > 0) {
        handleFileSelect(files[0])
      } else {
        setInternalError('No file was dropped. Please try again.')
      }
    } catch (error) {
      console.error('Error handling file drop:', error)
      setInternalError('An error occurred while processing the file. Please try again.')
    }
  }, [handleFileSelect])

  // Handle file input change
  const handleInputChange = useCallback((e) => {
    try {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        handleFileSelect(files[0])
      } else {
        // User cancelled file selection or no file
        onFileSelect?.(null)
      }
    } catch (error) {
      console.error('Error handling file input change:', error)
      setInternalError('An error occurred while selecting the file. Please try again.')
      onFileSelect?.(null)
    }
  }, [handleFileSelect, onFileSelect])

  // Handle click to browse
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle remove
  const handleRemove = useCallback((e) => {
    e.stopPropagation()
    setInternalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onFileRemove?.()
  }, [onFileRemove])

  // Check if file is image
  const isImage = preview && preview.type?.startsWith('image/')
  const isPDF = preview && preview.type === 'application/pdf'

  // Display error (prop error takes precedence)
  const displayError = error || internalError

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={fileInputRef.current?.id || `file-upload-${label}`}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label}
          {required && <span className="text-warning-500 ml-1" aria-label="required">*</span>}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id={fileInputRef.current?.id || `file-upload-${label}`}
        aria-describedby={displayError ? `error-${label}` : undefined}
      />

      {/* Drop zone or preview */}
      {preview ? (
        <div className="relative">
          {/* Preview */}
          <div className="border-2 border-neutral-300 rounded-lg p-4 bg-neutral-50">
            {isImage ? (
              <div className="flex items-center gap-4">
                <img
                  src={URL.createObjectURL(preview)}
                  alt={`Preview of ${preview.name}`}
                  className="w-[150px] h-[100px] object-cover rounded border border-neutral-200"
                  onError={(e) => {
                    console.error('Error loading image preview')
                    e.target.style.display = 'none'
                    setInternalError('Unable to display image preview. The file may be corrupted.')
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">{preview.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {(preview.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label="Remove file"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : isPDF ? (
              <div className="flex items-center gap-4">
                <DocumentIcon className="w-12 h-12 text-neutral-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">{preview.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {(preview.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label="Remove file"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          ref={dropZoneRef}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-normal
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 scale-[1.02] shadow-md' 
              : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
            }
            ${displayError ? 'border-warning-500' : ''}
            focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2
          `}
          role="button"
          tabIndex={0}
          aria-label={`${label || 'File upload'} - Drag and drop or click to browse`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick()
            }
          }}
        >
          <PhotoIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-sm font-medium text-neutral-700 mb-1">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-neutral-500">
            JPEG, PNG, or PDF (max 10MB)
          </p>
          {!preview && (
            <p className="text-xs text-neutral-400 mt-2">
              Please submit your insurance card to continue
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {displayError && (
        <p
          id={`error-${label}`}
          className="mt-2 text-sm text-warning-600 error-message-enter"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </p>
      )}
    </div>
  )
}

