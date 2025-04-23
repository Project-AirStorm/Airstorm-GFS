import { useState } from 'react';

/**
 * Custom hook for form validation
 * @param {Object} validationRules - Field validation rules
 * @returns {Object} Validation methods and state
 */
export const useValidation = (validationRules = {}) => {
  const [errors, setErrors] = useState({});
  
  /**
   * Validate a single field
   * @param {string} name - Field name
   * @param {string} value - Field value
   * @returns {boolean} True if valid
   */
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return true;
    
    // Skip validation for empty optional fields
    if (value === '' && !rule.required) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
      return true;
    }
    
    let isValid = true;
    let errorMessage = '';
    
    // Check if required
    if (rule.required && !value) {
      isValid = false;
      errorMessage = rule.requiredMessage || 'This field is required';
    }
    // Check pattern
    else if (rule.pattern && !rule.pattern.test(value)) {
      isValid = false;
      errorMessage = rule.message || 'Invalid input';
    }
    // Check minimum length
    else if (rule.minLength && value.length < rule.minLength) {
      isValid = false;
      errorMessage = rule.minLengthMessage || `Must be at least ${rule.minLength} characters`;
    }
    // Check maximum length
    else if (rule.maxLength && value.length > rule.maxLength) {
      isValid = false;
      errorMessage = rule.maxLengthMessage || `Must be at most ${rule.maxLength} characters`;
    }
    // Custom validation function
    else if (rule.validate && typeof rule.validate === 'function') {
      const customValidation = rule.validate(value);
      if (customValidation !== true) {
        isValid = false;
        errorMessage = customValidation;
      }
    }
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
    
    return isValid;
  };
  
  /**
   * Validate all form fields
   * @param {Object} data - Form data object
   * @returns {boolean} True if all fields are valid
   */
  const validateForm = (data) => {
    let isValid = true;
    const newErrors = {};
    
    // Validate each field with validation rules
    Object.keys(validationRules).forEach(fieldName => {
      if (data && fieldName in data) {
        const fieldIsValid = validateField(fieldName, data[fieldName]);
        if (!fieldIsValid) {
          isValid = false;
          // Get the current error message for this field
          newErrors[fieldName] = errors[fieldName] || '';
        }
      }
    });
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
    
    return isValid;
  };
  
  /**
   * Reset all validation errors
   */
  const resetErrors = () => {
    setErrors({});
  };
  
  return {
    errors,
    setErrors,
    validateField,
    validateForm,
    resetErrors
  };
};