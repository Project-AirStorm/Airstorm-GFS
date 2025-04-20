import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import ActionButton from '../common/ActionButton/ActionButton';
import './LoginSecuritySection.css';

/**
 * LoginSecuritySection component for security settings
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} LoginSecuritySection component
 */
const LoginSecuritySection = ({ user, showFeedback }) => {
  const { signOut, openUserProfile } = useClerk();
  
  /**
   * Open Clerk's user profile for security settings
   */
  const openSecuritySettings = () => {
    openUserProfile({
      appearance: {
        elements: {
          navbar: { display: 'none' },
          footer: { display: 'none' },
          rootBox: { maxWidth: '100%' }
        }
      },
      initialTab: 'security'
    });
  };
  
  /**
   * Handle account deletion
   */
  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        if (user) {
          await user.delete();
          signOut({ redirectUrl: '/login' });
        }
      } catch (error) {
        showFeedback('error', error.message || 'Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <div className="login-security-section">
      <div className="settings-form">
        <div className="security-section">
          <h3 className="section-title">Account Security</h3>
          
          <div className="security-option">
            <div className="security-option-info">
              <h4 className="security-option-title">Two-Factor Authentication</h4>
              <p className="security-option-description">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
            </div>
            <ActionButton 
              type="secondary"
              onClick={openSecuritySettings}
              icon={<Shield size={16} />}
              className="security-action-button"
            >
              Manage 2FA
            </ActionButton>
          </div>
          
          <div className="danger-zone">
            <h4 className="danger-zone-title">Danger Zone</h4>
            <div className="danger-option">
              <div className="danger-option-info">
                <h4 className="danger-option-title">Delete Account</h4>
                <p className="danger-option-description">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <ActionButton 
                type="danger"
                onClick={handleAccountDeletion}
                icon={<AlertTriangle size={16} />}
              >
                Delete Account
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSecuritySection;