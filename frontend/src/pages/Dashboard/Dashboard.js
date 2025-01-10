import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
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

        <div className="chart-section">
          <h3 className="chart-title">Local Weather Conditions</h3>
          <p className="chart-description">
            Customize the chart to compare weather condition trends.
          </p>
          <GraphCastForecast />
        </div>

        <div className="bottom-grid">
          <div className="bottom-card">
            <h3 className="card-title">Weather Alerts</h3>
            <div className="stats-text">
              No active weather alerts for your monitored locations.
            </div>
          </div>
          
          <div className="bottom-card">
            <h3 className="card-title">Quick Stats</h3>
            <div className="stats-list">
              <div className="stats-text">
                Monitored Locations: {locations.length}
              </div>
              <div className="stats-text">
                Active Alerts: 0
              </div>
              <div className="stats-text">
                Last Updated: {new Date().toLocaleTimeString()}
              </div>
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