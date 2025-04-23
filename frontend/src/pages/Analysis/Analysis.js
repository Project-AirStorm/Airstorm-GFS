import React, { useState, useEffect } from 'react';
import WeatherModelComparison from '../../components/specific/WeatherModelComparison/WeatherModelComparison';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import Loader from '../../components/common/loader';
import './Analysis.css';

/**
 * Analysis page component for weather model comparison
 * This is the main container component that renders the WeatherModelComparison component
 * with a loading state for better user experience
 */
const Analysis = () => {
  const [activeView, setActiveView] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    // Simulate data loading with a timeout
    // In a real implementation, this would be replaced with actual data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Clean up timer on component unmount
    return () => clearTimeout(timer);
  }, []);

  // Show loader while loading
  if (loading) {
    return <Loader size="medium" />;
  }

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

        {/* Weather Model Comparison Component */}
        <WeatherModelComparison activeView={activeView} />
      </div>
    </div>
  );
};

export default Analysis;