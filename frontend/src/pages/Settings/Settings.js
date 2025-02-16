// Settings.js
import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import './Settings.css';

/**
 * Settings page component for application configuration
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Settings component
 */
const Settings = ({ setCurrentPage }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    darkMode: false,
    temperatureUnit: 'fahrenheit',
    refreshInterval: '30',
  });

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="settings-body">
          <div className="settings-header">
            <h2 className="content-title">Settings</h2>
            <p className="content-description">
              Configure your application preferences and notifications.
            </p>
          </div>

          <div className="settings-sections">
            {/* Notifications Section */}
            <section className="settings-section">
              <h3 className="section-title">Notifications</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <label className="setting-label">
                    <span>Enable Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) =>
                        handleSettingChange('notifications', e.target.checked)
                      }
                      className="setting-checkbox"
                    />
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <span>Email Alerts</span>
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) =>
                        handleSettingChange('emailAlerts', e.target.checked)
                      }
                      className="setting-checkbox"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Display Settings */}
            <section className="settings-section">
              <h3 className="section-title">Display</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <label className="setting-label">
                    <span>Dark Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) =>
                        handleSettingChange('darkMode', e.target.checked)
                      }
                      className="setting-checkbox"
                    />
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <span>Temperature Unit</span>
                    <select
                      value={settings.temperatureUnit}
                      onChange={(e) =>
                        handleSettingChange('temperatureUnit', e.target.value)
                      }
                      className="setting-select"
                    >
                      <option value="fahrenheit">Fahrenheit</option>
                      <option value="celsius">Celsius</option>
                    </select>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <span>Refresh Interval (seconds)</span>
                    <select
                      value={settings.refreshInterval}
                      onChange={(e) =>
                        handleSettingChange('refreshInterval', e.target.value)
                      }
                      className="setting-select"
                    >
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="600">10 minutes</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="settings-actions">
              <button className="save-button">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Settings;
