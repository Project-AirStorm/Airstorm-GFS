import React, { useState } from 'react';
import { Lock, Save, X, Check, AlertCircle } from 'lucide-react';
import { PiEyeClosed } from "react-icons/pi";
import { PiEyeBold } from "react-icons/pi";
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
  
  // Password visibility toggle states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    checks: {
      length: false,
      number: false,
      special: false,
      uppercase: false,
      lowercase: false
    }
  });
  
  // Check if user has password authentication enabled
  const hasPasswordAuth = user?.passwordEnabled === true;
  
  // Check if user is connected via Google
  const hasGoogleAuth = user?.externalAccounts?.some(account => 
    account.provider === 'oauth_google' || account.provider === 'google'
  );
  
  /**
   * Validates password strength and updates strength state
   * @param {string} password - Password to validate
   * @returns {number} Password strength score (0-4)
   */
  const validatePasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password)
    };
    
    // Calculate score based on passed checks
    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    // Determine message based on score
    let message = '';
    if (passedChecks === 0) message = 'Very weak';
    else if (passedChecks === 1) message = 'Weak';
    else if (passedChecks === 2) message = 'Fair';
    else if (passedChecks === 3) message = 'Good';
    else if (passedChecks === 4) message = 'Strong';
    else if (passedChecks === 5) message = 'Very strong';
    
    setPasswordStrength({
      score: passedChecks,
      message,
      checks
    });
    
    return passedChecks;
  };
  
  /**
   * Handle password input change and validate strength
   * @param {Object} e - Input event
   */
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setNewPassword(newPassword);
    validatePasswordStrength(newPassword);
  };
  
  /**
   * Handles direct password change using Clerk's client SDK
   */
  const handleChangePassword = async () => {
    setError('');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Validate password strength
    const strengthScore = validatePasswordStrength(newPassword);
    if (strengthScore < 3) {
      setError('Password is too weak. Please create a stronger password.');
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
              <img src={Google} alt="Google Icon" width="24" height="24" />
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

  // React components for password visibility toggles
  const currentPasswordToggle = (
    <div onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
      {showCurrentPassword ? <PiEyeBold size={18} /> : <PiEyeClosed size={18} />}
    </div>
  );

  const newPasswordToggle = (
    <div onClick={() => setShowNewPassword(!showNewPassword)}>
      {showNewPassword ? <PiEyeClosed size={18} /> : <PiEyeBold size={18} />}
    </div>
  );

  const confirmPasswordToggle = (
    <div onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
      {showConfirmPassword ? <PiEyeClosed size={18} /> : <PiEyeBold size={18} />}
    </div>
  );

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
            
            {/* Current Password Field with Show/Hide Toggle */}
            <FormField
              id="currentPassword"
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="full-width"
              rightIcon={currentPasswordToggle}
            />
            
            {/* New Password Field with Show/Hide Toggle */}
            <FormField
              id="newPassword"
              name="newPassword"
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={handlePasswordChange}
              className="full-width"
              rightIcon={newPasswordToggle}
            />
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="password-strength-container">
                <div className="password-strength-bar">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`strength-segment ${i < passwordStrength.score ? `strength-level-${passwordStrength.score}` : ''}`}
                    ></div>
                  ))}
                </div>
                <div className="password-strength-text">
                  {passwordStrength.message}
                </div>
                
                {/* Password Requirements */}
                <div className="password-requirements">
                  <div className={`requirement ${passwordStrength.checks.length ? 'passed' : ''}`}>
                    {passwordStrength.checks.length ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.number ? 'passed' : ''}`}>
                    {passwordStrength.checks.number ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>At least one number</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.uppercase ? 'passed' : ''}`}>
                    {passwordStrength.checks.uppercase ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>At least one uppercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.lowercase ? 'passed' : ''}`}>
                    {passwordStrength.checks.lowercase ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>At least one lowercase letter</span>
                  </div>
                  <div className={`requirement ${passwordStrength.checks.special ? 'passed' : ''}`}>
                    {passwordStrength.checks.special ? <Check size={14} /> : <AlertCircle size={14} />}
                    <span>At least one special character</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Confirm Password Field with Show/Hide Toggle */}
            <FormField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="full-width"
              rightIcon={confirmPasswordToggle}
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
                disabled={isProcessing || !currentPassword || !newPassword || !confirmPassword || passwordStrength.score < 3}
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