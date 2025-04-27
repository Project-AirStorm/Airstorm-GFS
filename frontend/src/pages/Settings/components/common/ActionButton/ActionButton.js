import React from 'react';
import './ActionButton.css';

/**
 * Reusable button component for actions
 * @param {Object} props - Component props
 * @param {string} props.type - Button type: 'primary', 'secondary', or 'danger' (default: 'primary')
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {string} props.className - Additional CSS class
 * @param {React.ReactNode} props.children - Button content
 * @returns {JSX.Element} ActionButton component
 */
const ActionButton = ({
  type = 'primary',
  onClick,
  disabled = false,
  icon,
  className = '',
  children
}) => {
  const getButtonClass = () => {
    switch (type) {
      case 'primary':
        return 'save-button';
      case 'secondary':
        return 'cancel-button';
      case 'danger':
        return 'danger-button';
      default:
        return 'save-button';
    }
  };

  return (
    <button
      className={`${getButtonClass()} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default ActionButton;