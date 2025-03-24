// src/pages/Analysis/Analysis.js
import React from 'react';
import WeatherModelComparison from '../../components/specific/WeatherModelComparison/WeatherModelComparison';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Analysis.css';

/**
 * Analysis page component for weather model comparison
 * This is the main container component that renders the WeatherModelComparison component
 */
const Analysis = () => {
  const [activeView, setActiveView] = React.useState('overview');

  return (
    <div className="dashboard-container">
        {/* Weather Model Comparison Component */}
        <WeatherModelComparison activeView={activeView} />
      </div>
  );
};

export default Analysis;