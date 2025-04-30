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
  };   */

  return (
    <div className="team-section">
      <div className="settings-form">
        <div className="placeholder-content">
          <h3 className="section-title">Coming Soon</h3>
          <p className="section-description">
            Email notification features are not available yet. Coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;