import React, { useState } from 'react';
import { Lock, Save, X} from 'lucide-react';
import ActionButton from '../common/ActionButton/ActionButton';
import FormField from '../common/FormField/FormField';
import './PasswordSection.css';
import Google from '../../../../assets/google-icon.png';

/**
 * Password section component for password reset functionality
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} PasswordSection component
 */
const PasswordSection = ({ user, showFeedback }) => {
  // States for password management
  const [resetStep, setResetStep] = useState('initial'); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Check if user has password authentication enabled
  const hasPasswordAuth = user?.password_enabled === true;
  
  // Check if user is connected via Google
  const hasGoogleAuth = user?.external_accounts?.some(account => 
    account.provider === 'oauth_google' || account.provider === 'google'
  );
  
  /**
   * Handles direct password change using Clerk's client SDK
   */
  const handleChangePassword = async () => {
    setError('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Use Clerk's updatePassword method
      await user.updatePassword({
        currentPassword,
        newPassword
      });
      
      // Show success message
      showFeedback('success', 'Password updated successfully');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetStep('initial');
      
    } catch (err) {
      console.error('Password update error:', err);
      const errorMessage = err.errors?.[0]?.longMessage || 
                          err.errors?.[0]?.message || 
                          'Failed to update password. Please check your current password and try again.';
      setError(errorMessage);
      showFeedback('error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Initiates the password reset flow
   */
  const handleInitiateReset = () => {
    setResetStep('update');
    setError('');
  };
  
  /**
   * Cancels the password update process
   */
  const handleCancel = () => {
    setResetStep('initial');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  // If user has Google auth but no password, show informational message
  if (hasGoogleAuth && !hasPasswordAuth) {
    return (
      <div className="password-section">
        <div className="settings-form">
          <h3 className="password-section-title">Password Management</h3>
          
          <div className="oauth-account-message">
            <div className="oauth-icon-container">
              <Google size={24} />
            </div>
            <p className="oauth-message">
              Your account is connected through Google authentication. 
              Your password is managed by your Google account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal password change flow for users with password authentication
  return (
    <div className="password-section">
      <div className="settings-form">
        <h3 className="password-section-title">Change Password</h3>
        
        {resetStep === 'initial' && (
          <>
            <p className="password-section-description">
              Update your password to keep your account secure.
            </p>
            <ActionButton 
              type="primary"
              onClick={handleInitiateReset}
              icon={<Lock size={16} />}
              className="reset-password-button"
            >
              Change Password
            </ActionButton>
          </>
        )}
        
        {resetStep === 'update' && (
          <div className="password-reset-form">
            <p className="password-section-description">
              Enter your current password and a new password below.
            </p>
            
            <FormField
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="full-width"
            />
            
            <FormField
              id="newPassword"
              name="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="full-width"
            />
            
            <FormField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="full-width"
            />
            
            {error && <div className="password-error">{error}</div>}
            
            <div className="form-actions">
              <ActionButton
                type="secondary"
                onClick={handleCancel}
                disabled={isProcessing}
                icon={<X size={16} />}
              >
                Cancel
              </ActionButton>
              
              <ActionButton
                type="primary"
                onClick={handleChangePassword}
                disabled={isProcessing || !currentPassword || !newPassword || !confirmPassword}
                icon={<Save size={16} />}
              >
                {isProcessing ? 'Updating...' : 'Update Password'}
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordSection;