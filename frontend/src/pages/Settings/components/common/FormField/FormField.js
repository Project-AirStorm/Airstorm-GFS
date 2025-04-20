import React from 'react';
import './FormField.css';

/**
 * Reusable form field component with validation
 * @param {Object} props - Component props
 * @param {string} props.id - Field ID
 * @param {string} props.name - Field name
 * @param {string} props.label - Field label
 * @param {string} props.type - Input type (default: 'text')
 * @param {string} props.value - Field value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {string} props.helper - Helper text
 * @param {string} props.className - Additional CSS class
 * @returns {JSX.Element} FormField component
 */
const FormField = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  icon,
  helper,
  className = ''
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      
      <div className={icon ? 'input-with-icon' : ''}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`form-control ${icon ? 'with-icon' : ''} ${error ? 'error' : ''}`}
        />
      </div>
      
      {error && <div className="validation-error">{error}</div>}
      {helper && <div className="field-helper">{helper}</div>}
    </div>
  );
};

export default FormField;