import React, { useState, useEffect } from 'react';
import { AlertTriangle, Monitor, Smartphone, Laptop, ExternalLink } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import ActionButton from '../common/ActionButton/ActionButton';
import './LoginSecuritySection.css';

/**
 * LoginSecuritySection component for security settings
 * Shows active devices and manages account deletion
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} LoginSecuritySection component
 */
const LoginSecuritySection = ({ user, showFeedback }) => {
  const { signOut, openUserProfile } = useClerk();
  const [activeDevices, setActiveDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
   * Fetch active devices from user object when available
   */
  useEffect(() => {
    const fetchActiveDevices = async () => {
      try {
        setIsLoading(true);
        
        if (user) {
          // In a real implementation, you would use Clerk's API to get active sessions
          // Since Clerk doesn't directly expose active devices in the client SDK, 
          // this is a placeholder/mock implementation
          
          // Note: The proper way would be to have a backend endpoint that uses
          // Clerk's Admin SDK to fetch this information
          
          // For now, let's create mock data based on available user information
          const mockDevices = [
            {
              id: '1',
              name: 'Current Browser',
              type: 'browser',
              browser: 'Chrome',
              os: 'Windows',
              ipAddress: '192.168.1.xxx',
              lastActive: new Date().toISOString(),
              isCurrent: true
            }
          ];
          
          // Add a second mock device if user has multiple sign-ins
          if (user.lastSignInAt) {
            mockDevices.push({
              id: '2',
              name: 'Mobile Device',
              type: 'mobile',
              browser: 'Safari',
              os: 'iOS',
              ipAddress: '10.0.0.xxx',
              lastActive: user.lastSignInAt,
              isCurrent: false
            });
          }
          
          setActiveDevices(mockDevices);
        }
      } catch (error) {
        console.error('Error fetching active devices:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActiveDevices();
  }, [user]);
  
  /**
   * Get device icon based on device type
   * @param {string} type - Device type
   * @returns {JSX.Element} Icon component
   */
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={20} />;
      case 'tablet':
        return <Monitor size={20} />;
      case 'browser':
      default:
        return <Laptop size={20} />;
    }
  };
  
  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          {/* Active Devices Section */}
          <div className="active-devices-section">
            <h3 className="section-title">Active Devices</h3>
            <p className="section-description">
              These are the devices that are currently signed in to your account
            </p>
            
            {isLoading ? (
              <div className="devices-loading">Loading active devices...</div>
            ) : activeDevices.length === 0 ? (
              <div className="no-devices">No active devices found</div>
            ) : (
              <div className="devices-list">
                {activeDevices.map(device => (
                  <div key={device.id} className={`device-item ${device.isCurrent ? 'current-device' : ''}`}>
                    <div className="device-icon">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="device-info">
                      <div className="device-name">
                        {device.name}
                        {device.isCurrent && <span className="current-tag">Current</span>}
                      </div>
                      <div className="device-details">
                        <span className="device-browser">{device.browser}</span>
                        <span className="device-os">{device.os}</span>
                        <span className="device-ip">IP: {device.ipAddress}</span>
                      </div>
                      <div className="device-last-active">
                        Last active: {formatDate(device.lastActive)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Danger Zone */}
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