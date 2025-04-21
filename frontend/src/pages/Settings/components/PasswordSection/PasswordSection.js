import React from 'react';
import { Lock } from 'lucide-react';
import ActionButton from '../common/ActionButton/ActionButton';
import './PasswordSection.css';

/**
 * Password section component for password reset functionality
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} PasswordSection component
 */
const PasswordSection = ({ user, showFeedback }) => {
  /**
   * Handle password reset request
   */
  const handlePasswordReset = async () => {
    try {
      if (user) {
        await user.createPasswordReset({
          strategy: 'email_code',
        });
        
        showFeedback('success', 'Password reset email sent. Please check your inbox.');
      }
    } catch (error) {
      showFeedback('error', error.message || 'Failed to request password reset. Please try again.');
    }
  };

  return (
    <div className="password-section">
      <div className="settings-form">
        <h3 className="password-section-title">Change Password</h3>
        <p className="password-section-description">
          Click the button below to receive an email with instructions to reset your password.
        </p>
        <ActionButton 
          type="primary"
          onClick={handlePasswordReset}
          icon={<Lock size={16} />}
          className="reset-password-button"
        >
          Reset Password
        </ActionButton>
      </div>
    </div>
  );
};

export default PasswordSection;