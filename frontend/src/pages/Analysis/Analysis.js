import React, { useState, useEffect } from 'react';
import WeatherModelComparison from '../../components/specific/WeatherModelComparison/WeatherModelComparison';
import Loader from '../../components/common/loader';
import './Analysis.css';

/**
 * Analysis page component for weather model comparison
 * This is the main container component that renders the WeatherModelComparison component
 * with a loading state for better user experience
 */
const Analysis = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    // Loading timeout
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
      <div>
        {/* Weather Model Comparison Component */}
        <WeatherModelComparison/>
      </div>
    </div>
  );
};

export default Analysis;