// Dashboard.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import Sidebar from '../../components/common/sidebar/Sidebar';
import Header from '../../components/common/header/Header';  // Add this import
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import './Dashboard.css';

const Dashboard = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [locations] = useState([
    {
      city: "Bossier City",
      state: "LA",
      latitude: 32.5162,
      longitude: -93.7321,
      backgroundColor: "#A1A7FF"
    },
    {
      city: "Shreveport",
      state: "LA",
      latitude: 32.5251,
      longitude: -93.7502,
      backgroundColor: "#C4D0BA"
    },
    {
      city: "Ruston",
      state: "LA",
      latitude: 32.5232,
      longitude: -92.6379,
      backgroundColor: "#A1A7FF"
    }
  ]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar setCurrentPage={setCurrentPage} />

      {/* Header - Replace the old header markup with the Header component */}
      <Header title="Dashboard" />

      {/* Main Content */}
      <div className="main-content">
        {/* View Toggle */}
        <div className="toggle-section">
          <div className="toggle-buttons">
            <button 
              className={`toggle-button ${activeView === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button 
              className={`toggle-button ${activeView === 'detailed' ? 'active' : ''}`}
              onClick={() => setActiveView('detailed')}
            >
              Detailed
            </button>
          </div>
          
          <ActionButtons 
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>

        {/* Weather Cards Grid */}
        <div className="weather-grid">
          {locations.map((location) => (
            <WeatherCard
              key={`${location.city}-${location.state}`}
              city={location.city}
              state={location.state}
              latitude={location.latitude}
              longitude={location.longitude}
              backgroundColor={location.backgroundColor}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="chart-section">
          <h3 className="text-lg font-semibold mb-2">Local Weather Conditions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Customize the chart to compare weather condition trends.
          </p>
          <GraphCastForecast />
        </div>

        {/* Bottom Grid */}
        <div className="bottom-grid">
          <div className="bottom-card">
            <h3 className="text-lg font-semibold mb-4">Weather Alerts</h3>
            <p className="text-sm text-gray-600">
              No active weather alerts for your monitored locations.
            </p>
          </div>
          <div className="bottom-card">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Monitored Locations: {locations.length}
              </p>
              <p className="text-sm text-gray-600">
                Active Alerts: 0
              </p>
              <p className="text-sm text-gray-600">
                Last Updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  setCurrentPage: PropTypes.func.isRequired
};

export default Dashboard;