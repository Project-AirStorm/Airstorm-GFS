import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import './Dashboard.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const REACT_APP_USER_ID = process.env.REACT_APP_USER_ID || 'JoshuaFrancis';
const API_BASE_URL = `${REACT_APP_API_URL}/api`;

const Dashboard = ({ setCurrentPage }) => {
  const [activeView, setActiveView] = useState('overview');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations`, {
        params: { userId: REACT_APP_USER_ID },
      });

      // Add background colors to locations
      const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
      const locationsWithStyles = response.data.map((loc, index) => ({
        ...loc,
        backgroundColor: backgroundColors[index % 3],
      }));

      setLocations(locationsWithStyles);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to fetch locations');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDeleteLocation = async (latitude, longitude) => {
    try {
      await axios.delete(`${API_BASE_URL}/locations`, {
        data: {
          userId: REACT_APP_USER_ID,
          latitude,
          longitude,
        },
      });
      // Refresh locations after deletion
      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
    }
  };

  const handleToggleFavorite = async (latitude, longitude) => {
    try {
      await axios.post(`${API_BASE_URL}/locations/favorite`, {
        userId: REACT_APP_USER_ID,
        latitude,
        longitude,
      });
      // Refresh locations after toggling favorite
      fetchLocations();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Calculate monitored locations (favorites)
  const monitoredLocations = locations.filter((loc) => loc.isFavorite);

  if (loading) {
    return <div className="loading-state">Loading locations...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
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

        <div className="weather-grid">
          {locations.map((location) => (
            <WeatherCard
              key={`${location.name}-${location.latitude}-${location.longitude}`}
              city={location.name}
              state="" // You might want to add state to your location data
              latitude={location.latitude}
              longitude={location.longitude}
              backgroundColor={location.backgroundColor}
              onDelete={() =>
                handleDeleteLocation(location.latitude, location.longitude)
              }
              onToggleFavorite={() =>
                handleToggleFavorite(location.latitude, location.longitude)
              }
              isFavorite={location.isFavorite}
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
              {monitoredLocations.length > 0
                ? `Monitoring alerts for ${monitoredLocations.length} locations`
                : 'No locations currently being monitored for alerts.'}
            </div>
          </div>

          <div className="bottom-card">
            <h3 className="card-title">Quick Stats</h3>
            <div className="stats-list">
              <div className="stats-text">
                Total Locations: {locations.length}
              </div>
              <div className="stats-text">
                Monitored Locations: {monitoredLocations.length}
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
  setCurrentPage: PropTypes.func.isRequired,
};

export default Dashboard;
