import React, { useState } from 'react';
import AlertsComponent from './AlertsComponent';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Alerts.css';

const Alerts = ({ setCurrentPage }) => {
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

        {/* Alerts Component */}
        <AlertsComponent />
      </div>
    </div>
  );
};

export default Alerts;
