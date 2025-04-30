import React, { useState } from 'react';
import './PreferencesSection.css';

/**
 * PreferencesSection component for application preferences
 * @param {Object} props - Component props
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} PreferencesSection component
 */
const PreferencesSection = ({ showFeedback }) => {
  const [temperatureUnit, setTemperatureUnit] = useState('fahrenheit');
  const [windSpeedUnit, setWindSpeedUnit] = useState('mph');
  
  /**
   * Handle preference change and show feedback
   * @param {string} preference - Preference type
   * @param {string} value - New value
   */
  const handlePreferenceChange = (preference, value) => {
    switch (preference) {
      case 'temperature':
        setTemperatureUnit(value);
        showFeedback('success', `Temperature unit updated to ${value === 'fahrenheit' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}`);
        break;
      case 'windSpeed':
        setWindSpeedUnit(value);
        showFeedback('success', `Wind speed unit updated to ${getWindSpeedUnitLabel(value)}`);
        break;
      default:
        break;
    }
  };
  
  /**
   * Get readable label for wind speed unit
   * @param {string} unit - Wind speed unit code
   * @returns {string} Human-readable label
   */
  const getWindSpeedUnitLabel = (unit) => {
    switch (unit) {
      case 'mph':
        return 'Miles per hour (mph)';
      case 'kmh':
        return 'Kilometers per hour (km/h)';
      case 'knots':
        return 'Knots (kn)';
      default:
        return unit;
    }
  };

  return (
    <div className="preferences-section">
      <div className="settings-form">
        <h3 className="section-title">Application Preferences</h3>
        
        <div className="preference-option">
          <div className="preference-option-info">
            <h4 className="preference-option-title">Temperature Unit</h4>
            <p className="preference-option-description">
              Choose your preferred temperature unit for weather displays.
            </p>
          </div>
          <div className="preference-controls">
            <select 
              className="preference-select"
              value={temperatureUnit}
              onChange={(e) => handlePreferenceChange('temperature', e.target.value)}
            >
              <option value="fahrenheit">Fahrenheit (°F)</option>
              <option value="celsius">Celsius (°C)</option>
            </select>
          </div>
        </div>
        
        <div className="preference-option">
          <div className="preference-option-info">
            <h4 className="preference-option-title">Wind Speed Unit</h4>
            <p className="preference-option-description">
              Choose your preferred unit for wind speed measurements.
            </p>
          </div>
          <div className="preference-controls">
            <select 
              className="preference-select"
              value={windSpeedUnit}
              onChange={(e) => handlePreferenceChange('windSpeed', e.target.value)}
            >
              <option value="mph">Miles per hour (mph)</option>
              <option value="kmh">Kilometers per hour (km/h)</option>
              <option value="knots">Knots (kn)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;