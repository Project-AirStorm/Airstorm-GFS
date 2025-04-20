import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import './AccountSection.css';
import { useValidation } from '../hooks/useValidation';
import FormField from '../common/FormField/FormField';
import ActionButton from '../common/ActionButton/ActionButton';

/**
 * Account settings section component
 * Handles username and connected accounts
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Object} props.userProfile - User profile from context
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} AccountSection component
 */
const AccountSection = ({ user, userProfile, showFeedback }) => {
  const { openUserProfile } = useClerk();
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation setup for username
  const { validateField, errors } = useValidation({
    username: {
      pattern: /^[A-Za-z0-9_-]{3,30}$/,
      message: 'Username must be 3-30 characters using only letters, numbers, underscores, or hyphens'
    }
  });
  
  /**
   * Handle username input change
   * @param {Object} e - Event object
   */
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    validateField('username', e.target.value);
  };
  
  /**
   * Update username with Clerk
   */
  const handleUsernameUpdate = async () => {
    if (!username || username === user?.username || errors.username) {
      return;
    }

    try {
      setIsSaving(true);
      
      if (user) {
        await user.update({
          username: username
        });
        
        showFeedback('success', 'Username updated successfully.');
      }
    } catch (error) {
      showFeedback('error', error.message || 'Failed to update username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Open Clerk's user profile management
   * @param {string} tab - Tab to open
   */
  const openClerkUserProfile = (tab = 'account') => {
    openUserProfile({
      appearance: {
        elements: {
          navbar: { display: 'none' },
          footer: { display: 'none' },
          rootBox: { maxWidth: '100%' }
        }
      },
      initialTab: tab
    });
  };

  return (
    <div className="account-section">
      <div className="settings-form">
        <div className="username-container">
          <FormField
            id="username"
            name="username"
            label="Username"
            value={username}
            onChange={handleUsernameChange}
            error={errors.username}
            icon="@"
            className="username-field"
          />
          <ActionButton 
            type="primary"
            onClick={handleUsernameUpdate}
            disabled={isSaving || !username || username === user?.username || errors.username}
            className="username-update-button"
          >
            Update
          </ActionButton>
        </div>
        
        <div className="connected-accounts-section">
          <h3 className="section-title">Connected Accounts</h3>
          
          <div className="connected-account">
            <div className="account-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#DB4437"/>
              </svg>
            </div>
            <div className="account-details">
              <div className="account-name">Google</div>
              <div className="account-status">
                {user?.externalAccounts?.some(acc => acc.provider === 'google')
                  ? 'Connected'
                  : 'Not connected'}
              </div>
            </div>
            <ActionButton 
              type="secondary"
              onClick={() => openClerkUserProfile('security')}
              className="manage-account-button"
            >
              {user?.externalAccounts?.some(acc => acc.provider === 'google')
                ? 'Manage'
                : 'Connect'}
              <ExternalLink size={14} className="external-icon" />
            </ActionButton>
          </div>
          
          <ActionButton 
            type="primary"
            onClick={() => openClerkUserProfile('account')}
            className="manage-accounts-button"
          >
            Manage Account Settings
            <ExternalLink size={14} className="external-icon" />
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default AccountSection;