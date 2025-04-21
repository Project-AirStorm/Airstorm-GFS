// AccountSection.js
import React, { useState, useEffect } from 'react';
import { ExternalLink, Save, X, Mail } from 'lucide-react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useUserProfile } from '../../../../contexts/UserContext';
import './AccountSection.css';
import ActionButton from '../common/ActionButton/ActionButton';
import FormField from '../common/FormField/FormField';
import { useValidation } from '../hooks/useValidation';
import EmailVerificationPopup from './EmailVerificationPopup';
import GoogleIcon from '../../../../assets/google-icon.png';

/**
 * Account settings section component
 * Handles connected accounts and user email management
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Object} props.userProfile - User profile from context
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} AccountSection component
 */
const AccountSection = ({ user, userProfile, showFeedback }) => {
  const { openUserProfile } = useClerk();
  const { updateUserProfile } = useUserProfile();
  const { isLoaded } = useUser();
  
  // State for email form
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Email verification state
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  // State to track Google connection status
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  
  // Validation setup for email
  const { validateField, errors, resetErrors } = useValidation({
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Please enter a valid email address'
    }
  });
  
  // Initialize email and check Google connection status when user data is available
  useEffect(() => {
    if (user) {
      // Set email from user data
      if (user.primaryEmailAddress) {
        setEmail(user.primaryEmailAddress.emailAddress);
      }
      
      // Check if Google account is connected
      const hasGoogleAccount = user.externalAccounts?.some(
        account => account.provider === 'oauth_google' || account.provider === 'google'
      );
      setIsGoogleConnected(hasGoogleAccount);
    }
  }, [user]);
  
  /**
   * Handle email input change
   * @param {Object} e - Event object
   */
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateField('email', e.target.value);
  };
  
  /**
   * Initiate email verification process using Clerk
   */
  const initiateEmailVerification = async () => {
    try {
      setIsSaving(true);
      
      if (user && isLoaded) {
        // Don't proceed if email is invalid
        if (errors.email) {
          showFeedback('error', 'Please enter a valid email address.');
          setIsSaving(false);
          return;
        }
        
        // Don't proceed if email hasn't changed
        if (email === user.primaryEmailAddress?.emailAddress) {
          showFeedback('info', 'Email address has not changed.');
          setIsSaving(false);
          return;
        }
        
        // Use Clerk's createEmailAddress method to create and send verification email
        const emailAddress = await user.createEmailAddress({
          email: email,
        });
        
        // Store the email for verification
        setPendingEmail(email);
        
        // Show the verification popup
        setShowEmailVerification(true);
        
        showFeedback('success', 'Verification code sent to your email address. Please check your inbox.', 10000);
      }
    } catch (error) {
      showFeedback('error', error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Verify email code and complete email change
   * @param {string} code - 6-digit verification code
   */
  const verifyEmailCode = async (code) => {
    try {
      if (user && isLoaded) {
        // Get the pending email verification
        const pendingVerification = user.emailAddresses.find(
          email => email.emailAddress === pendingEmail && !email.verification.status
        );
        
        if (!pendingVerification) {
          throw new Error('No pending email verification found');
        }
        
        // Attempt to verify the email
        await user.verifyEmailAddress({
          code,
          strategy: pendingVerification.verification.strategy
        });
        
        // Make the email primary after verification
        await user.setPrimaryEmailAddress({ id: pendingVerification.id });
        
        // Close the verification popup
        setShowEmailVerification(false);
        
        // Update the user profile in context
        await updateUserProfile({
          email: pendingEmail
        });
        
        showFeedback('success', 'Email verified and updated successfully.');
        
        // Update local state
        setEmail(pendingEmail);
      }
    } catch (error) {
      throw new Error(error.message || 'Email verification failed. Please try again.');
    }
  };
  
  /**
   * Handle Google account connection via Clerk UI
   * Uses a clear redirect to the dashboard after completion to avoid errors
   */
  const handleGoogleConnection = () => {
    // Get the dashboard URL to redirect to after completion
    const dashboardUrl = '/dashboard';
    
    // Configure appearance settings for the Clerk UI
    const appearance = {
      elements: {
        navbar: { display: 'none' },
        footer: { display: 'none' },
        rootBox: { maxWidth: '100%' }
      }
    };
    
    try {
      // Open user profile with redirect to dashboard
      openUserProfile({
        appearance: appearance,
        initialTab: 'security',
        // This bypasses the error by not trying to handle the OAuth callback in Clerk UI
        // Instead, we redirect directly to the dashboard
        afterSignOutUrl: dashboardUrl,
        // Don't use redirectOptions as an object - this triggers the error
        unsafeMetadata: {
          // Set a flag to help detect completion
          fromOAuthConnection: true
        }
      });
    } catch (error) {
      console.error('Error opening user profile:', error);
      showFeedback('error', 'There was an error opening the account settings. Please try again.');
    }
  };
  
  // Reset email to original value
  const handleCancel = () => {
    if (user && user.primaryEmailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
    resetErrors();
  };

  return (
    <div className="account-section">
      <div className="settings-form">    
        {/* Connected Accounts Section */}
        <div className="connected-accounts-section">
          <h3 className="google-section-title">Connected Accounts</h3>
          <p className="google-section-description">
            Accounts you have connected to your profile.
          </p>
          
          <div className="connected-account">
            <div className="account-icon">
                <img src={GoogleIcon} alt="Google Icon" width="24" height="24" />
            </div>
            <div className="account-details">
              <div className="account-name">Google</div>
              <div className="account-status">
                {isGoogleConnected ? 'Connected' : 'Not connected'}
              </div>
            </div>
            <ActionButton 
              type="secondary"
              onClick={handleGoogleConnection}
              className="manage-account-button"
            >
              {isGoogleConnected ? 'Manage' : 'Connect'}
              <ExternalLink size={14} className="external-icon" />
            </ActionButton>
          </div>
        </div>

        {/* Email Section */}
        <div>
          <h3 className="email-section-title">Email Address</h3>
          <p className="email-section-description">
            Your primary email address for account notifications and communications
          </p>
          
          <div className="email-form">
            <FormField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              icon={<Mail size={16} />}
              className="full-width"
              helper={email !== user?.primaryEmailAddress?.emailAddress ? 
                "A verification code will be sent to this address" : ""}
            />
            
            <div className="form-actions">
              <ActionButton
                type="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                icon={<X size={16} />}
              >
                Cancel
              </ActionButton>
              
              <ActionButton
                type="primary"
                onClick={initiateEmailVerification}
                disabled={isSaving || !email || email === user?.primaryEmailAddress?.emailAddress}
                icon={<Save size={16} />}
              >
                {isSaving ? "Saving..." : "Update Email"}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Verification Popup */}
      <EmailVerificationPopup
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        onVerify={verifyEmailCode}
        email={pendingEmail}
      />
    </div>
  );
};

export default AccountSection;