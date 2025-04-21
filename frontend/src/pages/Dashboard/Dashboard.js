import React, { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../../utils/UserSession';
import axios from 'axios';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import Loader from '../../components/common/loader';
import './Dashboard.css';

// Declare URL for Flask API
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Dashboard = ({ setCurrentPage }) => {
  const { user } = UserSession(); // User session

  const [activeView, setActiveView] = useState('overview');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Define the handlers
  const handleTimeframeChange = () => {
    console.log('Timeframe changed');
  };

  const handleAddBase = () => {
    console.log('Add base clicked');
  };

  const handleLocationAdded = () => {
    fetchLocations();
  };

  const fetchLocations = useCallback(async () => {
    try {
      const response = await axios.get(`${REACT_APP_API_URL}/api/locations`, {
        params: { userId: user.id },
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
  }, [user.id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDeleteLocation = async (latitude, longitude) => {
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: {
          userId: user.id,
          latitude,
          longitude,
        },
      });
      
      // If the deleted location was selected, reset to local forecast
      if (selectedLocation && 
          selectedLocation.latitude === latitude && 
          selectedLocation.longitude === longitude) {
        setSelectedLocation(null);
      }
      
      // Refresh locations after deletion
      fetchLocations();
    } catch (err) {
      console.error('Error deleting location:', err);
    }
  };

  const handleToggleFavorite = async (latitude, longitude) => {
    try {
      await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, {
        userId: user.id,
        latitude,
        longitude,
      });
      // Refresh locations after toggling favorite
      fetchLocations();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };
  
  const handleWeatherCardClick = (location) => {
    setSelectedLocation(location);
  };

  // Calculate monitored locations (favorites)
  const monitoredLocations = locations.filter((loc) => loc.isFavorite);

  // Early return with just the loader while loading
  if (loading) {
    return <Loader size="medium" />;
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
            onTimeframeChange={handleTimeframeChange}
            onAddBase={handleAddBase}
            timeframe="Week"
            onLocationAdded={handleLocationAdded}
          />
        </div>

        <div className="weather-grid">
          {locations.map((location) => (
            <div 
              className={`weather-card-wrapper ${
                selectedLocation?.latitude === location.latitude && 
                selectedLocation?.longitude === location.longitude ? 'selected' : ''
              }`}
              key={`${location.name}-${location.latitude}-${location.longitude}`}
              onClick={() => handleWeatherCardClick(location)}
              style={{ cursor: 'pointer' }}
              title="Click to view detailed forecast"
            >
              <WeatherCard
                city={location.name}
                state="" // You might want to add state to your location data
                latitude={location.latitude}
                longitude={location.longitude}
                backgroundColor={location.backgroundColor}
                onDelete={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  handleDeleteLocation(location.latitude, location.longitude);
                }}
                onToggleFavorite={(e) => {
                  e.stopPropagation(); // Prevent triggering the card click
                  handleToggleFavorite(location.latitude, location.longitude);
                }}
                isFavorite={location.isFavorite}
              />
            </div>
          ))}
        </div>

        <div className="chart-section">
          <h3 className="chart-title">
            {selectedLocation 
              ? `${selectedLocation.name} Weather Forecast (16 Days)` 
              : 'Local Weather Forecast (16 Days)'}
          </h3>
          <GraphCastForecast 
            customLatitude={selectedLocation?.latitude}
            customLongitude={selectedLocation?.longitude}
          />
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

export default Dashboard;