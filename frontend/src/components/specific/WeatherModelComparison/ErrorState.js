// ---------------------------------------------------
// src/components/specific/WeatherModelComparison/ErrorState.js
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error state component with retry button
 */
const ErrorState = ({ error, rawData }) => (
  <div className="dashboard-container">
    <div className="main-content">
      <div className="analysis-body">
        <div className="error-message-container">
          <h2 className="error-title">Error Loading Data</h2>
          <p className="error-message">{error}</p>
          
          <ul className="error-checklist">
            <li>Check that your API keys are properly configured</li>
            <li>Verify that the backend services are running</li>
            <li>Ensure the date range is valid for the API</li>
          </ul>
          
          {rawData && (
            <div className="error-details">
              <h3>Raw Response:</h3>
              <pre className="error-json">
                {JSON.stringify(rawData, null, 2)}
              </pre>
            </div>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
);

ErrorState.propTypes = {
  error: PropTypes.string.isRequired,
  rawData: PropTypes.object
};

export default ErrorState;

