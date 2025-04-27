import React, { useState } from 'react';
import './NotificationsSection.css';

/**
 * NotificationsSection component for notification preferences
 * @param {Object} props - Component props
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} NotificationsSection component
 */
const NotificationsSection = ({ showFeedback }) => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  
  /**
   * Toggle notification setting
   * @param {string} type - Notification type
   * @param {boolean} value - New value
   */
  const toggleNotification = (type, value) => {
    switch (type) {
      case 'email':
        setEmailNotifications(value);
        showFeedback('success', `Email notifications ${value ? 'enabled' : 'disabled'}`);
        break;
      case 'weather':
        setWeatherAlerts(value);
        showFeedback('success', `Weather alerts ${value ? 'enabled' : 'disabled'}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="notifications-section">
      <div className="settings-form">
        <h3 className="section-title">Notification Preferences</h3>
        
        <div className="notification-option">
          <div className="notification-option-info">
            <h4 className="notification-option-title">Email Notifications</h4>
            <p className="notification-option-description">
              Receive notifications about account activity and updates via email.
            </p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={emailNotifications}
              onChange={(e) => toggleNotification('email', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        <div className="notification-option">
          <div className="notification-option-info">
            <h4 className="notification-option-title">Weather Alerts</h4>
            <p className="notification-option-description">
              Receive notifications about severe weather conditions in your saved locations.
            </p>
          </div>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={weatherAlerts}
              onChange={(e) => toggleNotification('weather', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;