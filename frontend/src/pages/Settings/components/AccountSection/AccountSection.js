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
 * AccountSection component handles connected accounts and adding additional emails
 */
const AccountSection = ({ user, userProfile, showFeedback }) => {
  const { openUserProfile } = useClerk();
  const { isLoaded } = useUser();

  // New email input state
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Verification state
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingEmailId, setPendingEmailId] = useState('');

  // Google connection state
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Validation setup
  const { validateField, errors, resetErrors } = useValidation({
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,  
      message: 'Please enter a valid email address'
    }
  });

  useEffect(() => {
    if (user) {
      // Google connected?
      const hasGoogle = user.externalAccounts?.some(
        acc => acc.provider === 'oauth_google' || acc.provider === 'google'
      );
      setIsGoogleConnected(hasGoogle);
    }
  }, [user]);

  const handleEmailChange = e => {
    setEmail(e.target.value);
    validateField('email', e.target.value);
  };

  const initiateEmailVerification = async () => {
    try {
      setIsSaving(true);
      if (errors.email) {
        showFeedback('error', 'Please enter a valid email address.');
        return;
      }
      // Prevent duplicates
      const exists = user.emailAddresses?.some(a => a.emailAddress === email);
      if (exists) {
        showFeedback('info', 'This email is already added to your account.');
        return;
      }
      // Create and prepare verification for additional email
      const emailAddress = await user.createEmailAddress({ email });
      await emailAddress.prepareVerification({ strategy: 'email_code' });
      setPendingEmail(emailAddress.emailAddress);
      setPendingEmailId(emailAddress.id);
      setShowEmailVerification(true);
      showFeedback('success', 'Verification code sent—check your inbox.', 10000);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to send verification email.');
    } finally {
      setIsSaving(false);
    }
  };

  const verifyEmailCode = async code => {
    try {
      // Locate the pending email address resource
      const emailObj = user.emailAddresses.find(a => a.id === pendingEmailId);
      if (!emailObj) throw new Error('Pending email not found');
      // Attempt verification
      await emailObj.attemptVerification({ code });
      setShowEmailVerification(false);
      showFeedback('success', 'Additional email verified and added!');
      setEmail('');
      resetErrors();
    } catch (err) {
      throw new Error(err.message || 'Email verification failed.');
    }
  };

  const handleGoogleConnection = () => {
    const dashboardUrl = '/dashboard';
    const appearance = { elements: { navbar: { display: 'none' }, footer: { display: 'none' }, rootBox: { maxWidth: '100%' } } };
    try {
      openUserProfile({ appearance, initialTab: 'security', afterSignOutUrl: dashboardUrl, unsafeMetadata: { fromOAuthConnection: true } });
    } catch {
      showFeedback('error', 'Error opening security settings.');
    }
  };

  const handleCancel = () => {
    setEmail('');
    resetErrors();
  };

  return (
    <div className="account-section">
      <div className="settings-form">
        {/* Connected Accounts */}
        <div className="connected-accounts-section">
          <h3 className="google-section-title">Connected Accounts</h3>
          <p className="google-section-description">Accounts you’ve linked</p>
          <div className="connected-account">
            <div className="account-icon"><img src={GoogleIcon} alt="Google" width={24} height={24} /></div>
            <div className="account-details">
              <div className="account-name">Google</div>
              <div className="account-status">{isGoogleConnected ? 'Connected' : 'Not connected'}</div>
            </div>
            <ActionButton type="secondary" onClick={handleGoogleConnection} className="manage-account-button">
              {isGoogleConnected ? 'Manage' : 'Connect'} <ExternalLink size={14} className="external-icon" />
            </ActionButton>
          </div>
        </div>

        {/* Additional Email */}
        <div className="email-section">
          <h3 className="email-section-title">Additional Email</h3>
          <p className="email-section-description">Add an extra address for notifications</p>
          <div className="email-form">
            <FormField
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="johndoe@gmail.com"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              icon={<Mail size={16} />}
              className="full-width"
              helper="A code will be sent to verify this address"
            />
            <div className="form-actions">
              <ActionButton type="secondary" onClick={handleCancel} disabled={isSaving} icon={<X size={16} />}>Cancel</ActionButton>
              <ActionButton type="primary" onClick={initiateEmailVerification} disabled={isSaving || !email} icon={<Save size={16} />}>
                {isSaving ? 'Sending…' : 'Send Code'}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

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
