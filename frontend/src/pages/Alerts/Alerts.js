// Alerts.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Alerts.css';

/**
 * Alerts page component that displays weather alerts and warnings
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Alerts component
 */
const Alerts = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [alerts] = useState([
    {
      id: 1,
      type: 'Severe Weather',
      location: 'Barksdale AFB',
      timestamp: new Date().toLocaleString(),
      severity: 'high',
      message: 'Severe thunderstorm warning in effect'
    }
  ]);

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

        <div className="alerts-body">
          <div className="alerts-header">
            <h2 className="content-title">Weather Alerts</h2>
            <p className="content-description">
              Active weather alerts and warnings for monitored locations.
            </p>
          </div>

          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-item alert-${alert.severity}`}>
                <div className="alert-header">
                  <h3 className="alert-type">{alert.type}</h3>
                  <span className="alert-timestamp">{alert.timestamp}</span>
                </div>
                <div className="alert-location">{alert.location}</div>
                <p className="alert-message">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Alerts.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Alerts;