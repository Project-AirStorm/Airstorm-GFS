// Analysis.js
import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Analysis.css';

/**
 * Analysis page component for weather data analysis and insights
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Analysis component
 */
const Analysis = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('temperature');

  const metrics = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'precipitation', label: 'Precipitation' },
    { id: 'wind', label: 'Wind Speed' },
    { id: 'humidity', label: 'Humidity' },
  ];

  return (
    <div className="dashboard-container">
      <div className="main-content">
        {/* View Toggle and Action Buttons */}
        <div className="controls-container">
          <OverviewSwitch
            activeView={activeView}
            onViewChange={setActiveView}
          />

          <ActionButtons
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>

        <div className="analysis-body">
          <div className="analysis-header">
            <h2 className="content-title">Weather Analysis</h2>
            <p className="content-description">
              In-depth analysis and insights from weather data.
            </p>
          </div>

          <div className="metrics-selector">
            {metrics.map((metric) => (
              <button
                key={metric.id}
                className={`metric-button ${
                  selectedMetric === metric.id ? 'active' : ''
                }`}
                onClick={() => setSelectedMetric(metric.id)}
              >
                {metric.label}
              </button>
            ))}
          </div>

          <div className="analysis-content">
            <div className="analysis-chart">
              {/* Placeholder for charts */}
              <div className="chart-placeholder">
                Analysis chart for {selectedMetric} will be displayed here
              </div>
            </div>

            <div className="analysis-details">
              <h3 className="details-title">Analysis Details</h3>
              <div className="details-content">
                <p>
                  Detailed analysis information will be displayed here based on
                  the selected metric.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Analysis.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Analysis;
