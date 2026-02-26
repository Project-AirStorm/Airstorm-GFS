// ---------------------------------------------------
// src/components/specific/WeatherModelComparison/LocationDetection.js
import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, AlertCircle } from 'lucide-react';

/**
 * Location detection component for showing loading or error states
 */
const LocationDetection = ({ type, error, location, onRetry }) => {
  if (type === 'loading') {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="analysis-body">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Detecting your location...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="analysis-body">
            <div className="error-message-container">
              <h2 className="error-title">Location Error</h2>
              <div className="error-icon">
                <AlertCircle size={48} />
              </div>
              <p className="error-message">{error}</p>
              <p>Using default location: {location}</p>
              
              <button
                onClick={onRetry}
                className="retry-button"
              >
                <MapPin className="icon-left" size={16} />
                Retry Location Detection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

LocationDetection.propTypes = {
  type: PropTypes.oneOf(['loading', 'error']).isRequired,
  error: PropTypes.string,
  location: PropTypes.string,
  onRetry: PropTypes.func
};

export default LocationDetection;