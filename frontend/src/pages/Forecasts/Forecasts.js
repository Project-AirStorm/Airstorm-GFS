// Forecasts.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import './Forecasts.css';

/**
 * Forecasts page component that displays weather forecasts and predictions
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Forecasts component
 */
const Forecasts = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');

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

        <div className="forecasts-body">
          <div className="forecasts-content">
            <h2 className="content-title">Weather Forecasts</h2>
            <p className="content-description">
              Comprehensive weather forecasts and predictions for monitored locations.
            </p>
            <GraphCastForecast />
          </div>
        </div>
      </div>
    </div>
  );
};

// Forecasts.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Forecasts;