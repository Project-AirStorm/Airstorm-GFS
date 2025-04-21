import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import './AccountSection.css';
import ActionButton from '../common/ActionButton/ActionButton';
import GoogleIcon from '../../../../assets/google-icon.png';

/**
 * Account settings section component
 * Handles connected accounts and external identity providers
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Object} props.userProfile - User profile from context
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} AccountSection component
 */
const AccountSection = ({ user, userProfile, showFeedback }) => {
  const { openUserProfile } = useClerk();
  
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
            <div className="connected-accounts-section">
                <h3 className="section-title">Connected Accounts</h3>
                
                <div className="connected-account">
                    <div className="account-icon">
                        <img src={GoogleIcon} alt="Google Icon" width="24" height="24" />
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
                        onClick={() => openUserProfile({
                            appearance: {
                                elements: {
                                    navbar: { display: 'none' },
                                    footer: { display: 'none' },
                                    rootBox: { maxWidth: '100%' }
                                }
                            },
                            initialTab: 'security',
                            options: { provider: 'google' } // Direct to Google connection page
                        })}
                        className="manage-account-button"
                    >
                        {user?.externalAccounts?.some(acc => acc.provider === 'google')
                            ? 'Manage'
                            : 'Connect'}
                        <ExternalLink size={14} className="external-icon" />
                    </ActionButton>
                </div>
            
            </div>
        </div>
    </div>
);
};

export default AccountSection;