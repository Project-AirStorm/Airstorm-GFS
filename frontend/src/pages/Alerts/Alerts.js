import React from 'react';
import AlertsComponent from './AlertsComponent';
import './Alerts.css';

const Alerts = ({ setCurrentPage }) => {
  return (
    <div className="dashboard-container">
      <div className="main-content">
        <AlertsComponent />
      </div>
    </div>
  );
};

export default Alerts;
