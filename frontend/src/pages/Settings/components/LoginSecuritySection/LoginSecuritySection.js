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
 * @param {Function} props.showFeedback - Function to display feedback messages
 * @returns {JSX.Element} LoginSecuritySection component
 */
const LoginSecuritySection = ({ user, showFeedback }) => {
  // Fix: Properly destructure openUserProfile from useClerk hook
  const { signOut, openUserProfile } = useClerk();
  const [activeDevices, setActiveDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for delete confirmation popup
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
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
          // Use Clerk's session methods to get active sessions
          const sessions = await user.getSessions();
          
          // Transform sessions into our device format with corrected property paths
          const devices = sessions.map(session => {
            // Get the activity data
            const activity = session.latestActivity || {};
            
            // Determine device type and friendly name
            let deviceType = 'browser';
            let deviceName = 'Desktop Device';
            
            if (activity.deviceType) {
              // Set device type based on latestActivity.deviceType and isMobile flag
              if (activity.isMobile === true) {
                deviceType = 'mobile';
                deviceName = 'Mobile Device';
              } else if (activity.deviceType.toLowerCase().includes('macintosh')) {
                deviceType = 'desktop';
                deviceName = 'Mac Device';
              } else if (activity.deviceType.toLowerCase().includes('windows')) {
                deviceType = 'desktop';
                deviceName = 'Windows Device';
              } else {
                deviceName = activity.deviceType;
              }
            }
            
            // Create a more descriptive device name
            deviceName = `${deviceName} - ${activity.browserName || 'Unknown Browser'}`;
            
            // Check if this is the current session
            const isCurrent = session.id === user.lastActiveSessionId;
            
            // Include location data
            const location = {
              city: activity.city || 'Unknown',
              country: activity.country || 'Unknown'
            };
            
            return {
              id: session.id,
              name: deviceName,
              type: deviceType,
              browser: activity.browserName || 'Unknown',
              browserVersion: activity.browserVersion || 'Unknown',
              os: activity.deviceType || 'Unknown',
              ipAddress: activity.ipAddress || 'Unknown',
              lastActive: session.lastActiveAt,
              isCurrent: isCurrent,
              location: location
            };
          });
          
          // Sort devices to show current device first
          devices.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0));
          
          setActiveDevices(devices);
        }
      } catch (error) {
        console.error('Error fetching active devices:', error);
        setActiveDevices([]);
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
   * Show account deletion confirmation popup
   */
  const initiateAccountDeletion = () => {
    setShowDeleteConfirmation(true);
    setDeleteConfirmText('');
  };
  
  /**
   * Handle account deletion process
   */
  const handleAccountDeletion = async () => {
    // Check if confirmation text matches "delete"
    if (deleteConfirmText.toLowerCase() !== 'delete account') {
      showFeedback('error', 'Please type "delete account" to confirm account deletion.');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      if (user) {
        // Use Clerk's delete method to completely remove the user account
        await user.delete();
        
        // Sign out and redirect to login
        signOut({ redirectUrl: '/login' });
      }
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      showFeedback('error', error.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="login-security-section">
      <div className="settings-form">
        <div className="security-section">
          {/* Current Device Section */}
          {activeDevices.filter(device => device.isCurrent).length > 0 && (
            <div className="current-device-section">
              <h3 className="section-title">Current Device</h3>
              {activeDevices.filter(device => device.isCurrent).map(device => (
                <div key={device.id} className="current-device-card">
                  <div className="device-icon">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div className="device-info">
                    <div className="device-name">
                      {device.name}
                      <span className="current-tag">Current</span>
                    </div>
                    <div className="device-details">
                      <span className="device-browser">{device.browser} {device.browserVersion}</span>
                      <span className="device-os">{device.os}</span>
                      <span className="device-ip">IP: {device.ipAddress}</span>
                    </div>
                    <div className="device-location">
                      <span className="location-icon">📍</span> {device.location.city}, {device.location.country}
                    </div>
                    <div className="device-last-active">
                      Last active: {formatDate(device.lastActive)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
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
                      <div className="device-location">
                        <span className="location-icon">📍</span> {device.location.city}, {device.location.country}
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
                onClick={initiateAccountDeletion}
                icon={<AlertTriangle size={16} />}
              >
                Delete Account
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Popup */}
      {showDeleteConfirmation && (
        <div className="delete-account-overlay">
          <div className="delete-account-popup">
            <h2 className="delete-popup-title">Delete Account</h2>
            <div className="delete-popup-content">
              <div className="delete-warning-icon">
                <AlertTriangle size={48} />
              </div>
              <p className="delete-popup-message">
                Are you certain you want to delete your account? This action cannot be undone.
                All data will be permanently erased and unrecoverable.
              </p>
              <p className="delete-popup-instruction">
                To confirm deletion, type <strong>delete account</strong> in the field below:
              </p>
              <input
                type="text"
                className="delete-confirm-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete account' to confirm"
                autoFocus
              />
              <div className="delete-popup-actions">
                <button 
                  className="delete-cancel-button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-button"
                  onClick={handleAccountDeletion}
                  disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete account'}
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSecuritySection;