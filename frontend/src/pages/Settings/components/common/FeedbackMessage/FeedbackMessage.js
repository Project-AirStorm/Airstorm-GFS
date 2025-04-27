import React from 'react';
import './FeedbackMessage.css';

/**
 * Displays feedback messages (success/error) with auto-dismiss
 * @param {Object} props - Component props
 * @param {string} props.type - Message type ('success' or 'error')
 * @param {string} props.message - Message content
 * @returns {JSX.Element} FeedbackMessage component
 */
const FeedbackMessage = ({ type, message }) => {
  if (!message) return null;
  
  return (
    <div className={`feedback-message ${type}`}>
      {message}
    </div>
  );
};

export default FeedbackMessage;