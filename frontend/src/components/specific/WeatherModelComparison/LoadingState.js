// src/components/specific/WeatherModelComparison/LoadingState.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Loading state component with animated spinner
 */
const LoadingState = ({ location }) => (
  <div className="dashboard-container">
    <div className="main-content">
      <div className="analysis-body">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading weather data for {location}...</p>
        </div>
      </div>
    </div>
  </div>
);

LoadingState.propTypes = {
  location: PropTypes.string.isRequired
};

export default LoadingState;

