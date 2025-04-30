// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js
// MODIFIED: Replaced Quick Stats card content with MiniMap

import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserContext';
import axios from 'axios';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import Loader from '../../components/common/loader';

// *** IMPORT the new MiniMap component and its CSS ***
import MiniMap from '../../components/specific/MiniMap/MiniMap';
import '../../components/specific/MiniMap/MiniMap.css'; // Import MiniMap CSS

import './Dashboard.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Dashboard = ({ setCurrentPage }) => {
  const {
    userProfile,
    savedLocations: contextSavedLocations, // Get locations from context
    refreshAlerts,
    isLoading: contextLoading,
    isLocationLoading,
  } = useUserProfile();

  // --- Optimistic UI State ---
  const [displayLocations, setDisplayLocations] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- Optimistic UI Effect ---
  useEffect(() => {
    const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
    const locationsToDisplay = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
      ...loc,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      backgroundColor: backgroundColors[index % 3],
    }));
    setDisplayLocations(locationsToDisplay);

    // Update selectedLocation logic (as before)
    if (selectedLocation && !locationsToDisplay.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) {
        setSelectedLocation(null);
    }
    if (!selectedLocation && locationsToDisplay.length > 0) {
         setSelectedLocation(locationsToDisplay[0]);
    } else if (locationsToDisplay.length === 0) {
        setSelectedLocation(null);
    }
  }, [contextSavedLocations, selectedLocation]); // Added selectedLocation dependency based on logic inside

  // --- Keep existing handlers ---
  const handleTimeframeChange = () => { console.log('Timeframe changed'); };
  const handleAddBase = () => { console.log('Add base clicked'); };
  const handleLocationAdded = () => { console.log("Dashboard: Location added, refreshing context."); refreshAlerts(); };
  const handleDeleteLocation = async (latitude, longitude) => {
    if (!userProfile?.userId) { setError('User session not found.'); return; }
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, { data: { userId: userProfile.userId, latitude, longitude } });
      if (selectedLocation?.latitude === latitude && selectedLocation?.longitude === longitude) { setSelectedLocation(null); }
      refreshAlerts();
    } catch (err) { console.error('Error deleting location:', err); setError(`Failed to delete: ${err.response?.data?.error || err.message}`); }
  };
  const handleToggleFavorite = async (latitude, longitude) => {
     if (!userProfile?.userId) { setError('User session not found.'); return; }
     const originalLocations = [...displayLocations];
     const locationIndex = originalLocations.findIndex(loc => loc.latitude === latitude && loc.longitude === longitude);
     if (locationIndex === -1) { setError("Location not found."); return; }
     const optimisticLocations = originalLocations.map((loc, index) => index === locationIndex ? { ...loc, isFavorite: !loc.isFavorite } : loc);
     setDisplayLocations(optimisticLocations);
     setError(null);
     try {
       await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, { userId: userProfile.userId, latitude, longitude });
       refreshAlerts();
     } catch (err) { console.error('Error toggling favorite:', err); setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`); setDisplayLocations(originalLocations); }
   };
  const handleWeatherCardClick = (location) => { console.log(`Dashboard: WeatherCard clicked - ${location.name}`); setSelectedLocation({ latitude: location.latitude, longitude: location.longitude, name: location.name }); };

  // Derive monitoredLocations from context
  const monitoredLocations = Array.isArray(contextSavedLocations) ? contextSavedLocations.filter((loc) => loc.isFavorite) : [];

  // --- Determine map center and zoom ---
  const initialMapCenter = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : displayLocations.length > 0
      ? [displayLocations[0].latitude, displayLocations[0].longitude]
      : [32.5252, -93.7502]; // Default fallback

  const initialMapZoom = selectedLocation ? 8 : 4; // Zoom closer if selected


  // --- Loading State ---
  if (contextLoading || (isLocationLoading && displayLocations.length === 0)) {
    return <Loader size="medium" message={contextLoading ? "Loading user data..." : "Loading locations..."} />;
  }

  // --- Render ---
  return (
    <div className="dashboard-container">
      <div className="main-content">
        {/* Controls Container */}
        <div className="controls-container">
          <OverviewSwitch activeView={activeView} onViewChange={setActiveView} />
          <ActionButtons onTimeframeChange={handleTimeframeChange} onAddBase={handleAddBase} timeframe="Week" onLocationAdded={handleLocationAdded} />
        </div>

        {error && <div className="dashboard-error-message" role="alert">{error}</div>}

        {/* Original Weather Grid (Weather Cards) */}
        <div className="weather-grid">
          {displayLocations.length > 0 ? displayLocations.map((location) => (
            <div
              className={`weather-card-wrapper ${selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude ? 'selected' : ''}`}
              key={`${location.name}-${location.latitude}-${location.longitude}`}
              onClick={() => handleWeatherCardClick(location)}
              style={{ cursor: 'pointer' }}
              title={`Click to view ${location.name} detailed forecast`}
            >
              <WeatherCard
                city={location.name}
                state=""
                latitude={location.latitude}
                longitude={location.longitude}
                backgroundColor={location.backgroundColor}
                onDelete={(e) => { e.stopPropagation(); handleDeleteLocation(location.latitude, location.longitude); }}
                onToggleFavorite={(e) => { e.stopPropagation(); handleToggleFavorite(location.latitude, location.longitude); }}
                isFavorite={location.isFavorite}
              />
            </div>
          )) : (
            <div className="no-locations-message">
              <p>No locations saved yet. Add a location using the button above.</p>
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="chart-section">
          <h3 className="chart-title">
            {selectedLocation ? `${selectedLocation.name} Weather Forecast (16 Days)` : 'Local Weather Forecast (16 Days)'}
          </h3>
          <GraphCastForecast
            customLatitude={selectedLocation?.latitude}
            customLongitude={selectedLocation?.longitude}
          />
        </div>

        {/* Bottom Grid - MODIFIED */}
        <div className="bottom-grid">
          {/* Weather Alerts Card (Unchanged) */}
          <div className="bottom-card">
            <h3 className="card-title">Weather Alerts</h3>
            <div className="stats-text">
              {monitoredLocations.length > 0 ? `Monitoring alerts for ${monitoredLocations.length} favorite location(s).` : 'No favorite locations currently being monitored for alerts.'}
            </div>
          </div>

          {/* Quick Stats Card - REPLACED with MiniMap */}
          {/* Add a specific class 'bottom-card--map' for styling */}
          <div className="bottom-card bottom-card--map">
            {/* Removed H3 and stats-list */}
            <MiniMap
                 centerLat={initialMapCenter[0]}
                 centerLon={initialMapCenter[1]}
                 zoomLevel={initialMapZoom}
                 locations={displayLocations} // Pass locations for markers
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;