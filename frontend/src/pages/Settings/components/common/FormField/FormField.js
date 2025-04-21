import React from 'react';
import './FormField.css';

/**
 * Reusable form field component with validation
 * @param {Object} props - Component props
 * @param {string} props.id - Field ID
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (default: 'text')
 * @param {string} props.placeholder - Placeholder text for input
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {React.ReactNode} props.icon - Optional icon element (left side)
 * @param {React.ReactNode} props.rightIcon - Optional icon element (right side)
 * @param {string} props.helper - Helper text
 * @param {string} props.className - Additional CSS class
 * @returns {JSX.Element} FormField component
 */
const FormField = ({
  id,
  name,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  icon,
  rightIcon,
  helper,
  className = ''
}) => {
  return (
    <div className={`form-group ${className}`}>  
      {label && <label htmlFor={id}>{label}</label>}
      
      <div className={`input-wrapper ${icon ? 'with-left-icon' : ''} ${rightIcon ? 'with-right-icon' : ''}`}>  
        {icon && <span className="input-left-icon">{icon}</span>}
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`form-control ${icon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''} ${error ? 'error' : ''}`}
        />
        {rightIcon && <span className="input-right-icon">{rightIcon}</span>}
      </div>
      
      {error && <div className="validation-error">{error}</div>}
      {helper && <div className="field-helper">{helper}</div>}
    </div>
  );
};

export default FormField;
