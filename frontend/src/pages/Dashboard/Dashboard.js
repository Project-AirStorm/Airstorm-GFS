// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js
// Relevant sections modified for Optimistic UI

import React, { useState, useEffect } from 'react'; // Added useEffect
import { useUserProfile } from '../../contexts/UserContext';
import axios from 'axios';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import Loader from '../../components/common/loader';

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
  // Local state to hold the locations we actually render.
  // Initialized from context, updated optimistically, and synced back on context changes.
  const [displayLocations, setDisplayLocations] = useState([]);

  const [activeView, setActiveView] = useState('overview');
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // --- Optimistic UI Effect ---
  // Effect to synchronize local displayLocations with contextSavedLocations
  useEffect(() => {
    // Apply background colors locally for display if needed
    const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
    const locationsToDisplay = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
      ...loc,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      backgroundColor: backgroundColors[index % 3],
    }));
    setDisplayLocations(locationsToDisplay);
  }, [contextSavedLocations]); // Re-run whenever context locations change
  // --- End Optimistic UI Effect ---


  const handleTimeframeChange = () => {
    console.log('Timeframe changed');
  };

  const handleAddBase = () => {
    console.log('Add base clicked');
  };

  const handleLocationAdded = () => {
    console.log("Dashboard: Location added, refreshing context.");
    refreshAlerts(); // Context refresh is still correct here
  };


  const handleDeleteLocation = async (latitude, longitude) => {
    if (!userProfile?.userId) {
        console.error("Cannot delete: User ID not available.");
        setError('User session not found. Cannot delete location.');
        return;
    }
    // OPTIMISTIC DELETE (Optional but similar pattern):
    // 1. Store the original list: const originalLocations = [...displayLocations];
    // 2. Update displayLocations immediately:
    //    setDisplayLocations(originalLocations.filter(loc => !(loc.latitude === latitude && loc.longitude === longitude)));
    // 3. Make API call...
    // 4. On success: call refreshAlerts();
    // 5. On failure: setDisplayLocations(originalLocations); setError(...);

    // Current non-optimistic delete:
    try {
      console.log(`Dashboard: Deleting location ${latitude}, ${longitude} for user ${userProfile.userId}`);
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: {
          userId: userProfile.userId,
          latitude,
          longitude,
        },
      });

      if (selectedLocation &&
          selectedLocation.latitude === latitude &&
          selectedLocation.longitude === longitude) {
        console.log("Dashboard: Resetting selected location after deletion.");
        setSelectedLocation(null);
      }

      console.log("Dashboard: Location deleted, refreshing context.");
      refreshAlerts(); // Let context handle the refresh
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(`Failed to delete location: ${err.response?.data?.error || err.message}`);
      // If optimistic delete was implemented, revert here: setDisplayLocations(originalLocations);
    }
  };

  // --- MODIFIED handleToggleFavorite with Optimistic UI ---
  const handleToggleFavorite = async (latitude, longitude) => {
    if (!userProfile?.userId) {
      console.error("Cannot toggle favorite: User ID not available.");
      setError('User session not found. Cannot toggle favorite.');
      return;
    }

    // 1. Store the original list and find the original status
    const originalLocations = [...displayLocations]; // Important: create a copy
    let originalIsFavorite = false;
    const locationIndex = originalLocations.findIndex(
        loc => loc.latitude === latitude && loc.longitude === longitude
    );
    if (locationIndex === -1) {
        console.error("Cannot toggle favorite: Location not found in display list.");
        setError("An error occurred. Location not found.");
        return;
    }
    originalIsFavorite = originalLocations[locationIndex].isFavorite;

    // 2. Optimistically update the UI immediately
    const optimisticLocations = originalLocations.map((loc, index) => {
      if (index === locationIndex) {
        return { ...loc, isFavorite: !loc.isFavorite }; // Flip the favorite status
      }
      return loc;
    });
    setDisplayLocations(optimisticLocations); // Update local state to re-render
    setError(null); // Clear previous errors

    // 3. Make the API call
    try {
      console.log(`Dashboard: Toggling favorite for ${latitude}, ${longitude} for user ${userProfile.userId}`);
      await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, {
        userId: userProfile.userId,
        latitude,
        longitude,
      });

      // 4. On Success: Refresh context data in the background.
      // The useEffect hook watching contextSavedLocations will eventually sync our
      // displayLocations if needed, but the UI change was already instant.
      console.log("Dashboard: Favorite toggled (API success), refreshing context in background.");
      refreshAlerts();

    } catch (err) {
      // 5. On Failure: Revert the UI change and show error
      console.error('Error toggling favorite:', err);
      setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
      // Revert back to the original state
      setDisplayLocations(originalLocations);
    }
  };

  const handleWeatherCardClick = (location) => {
    console.log(`Dashboard: WeatherCard clicked - ${location.name}`);
    setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name
    });
  };

  // Use derived state from CONTEXT for monitored count (quick stats)
  const monitoredLocations = Array.isArray(contextSavedLocations)
     ? contextSavedLocations.filter((loc) => loc.isFavorite)
     : [];

  if (contextLoading || (isLocationLoading && displayLocations.length === 0)) { // Only show main loader if displayLocations isn't populated yet during location load
    return <Loader size="medium" message={contextLoading ? "Loading user data..." : "Loading locations..."} />;
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

        {error && <div className="dashboard-error-message" role="alert">{error}</div>}

        <div className="weather-grid">
          {/* Use the local displayLocations state for rendering */}
          {displayLocations.length > 0 ? displayLocations.map((location) => (
            <div
              className={`weather-card-wrapper ${
                selectedLocation?.latitude === location.latitude &&
                selectedLocation?.longitude === location.longitude ? 'selected' : ''
              }`}
              key={`${location.name}-${location.latitude}-${location.longitude}`}
              onClick={() => handleWeatherCardClick(location)}
              style={{ cursor: 'pointer' }}
              title={`Click to view ${location.name} detailed forecast`}
            >
              <WeatherCard
                city={location.name}
                state=""
                latitude={location.latitude} // Already numbers from useEffect
                longitude={location.longitude} // Already numbers from useEffect
                backgroundColor={location.backgroundColor}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteLocation(location.latitude, location.longitude);
                }}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  // Call the *modified* handler
                  handleToggleFavorite(location.latitude, location.longitude);
                }}
                isFavorite={location.isFavorite} // Use the value from displayLocations
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
             {selectedLocation
               ? `${selectedLocation.name} Weather Forecast (16 Days)`
               : 'Local Weather Forecast (16 Days)'}
           </h3>
           <GraphCastForecast
             customLatitude={selectedLocation?.latitude}
             customLongitude={selectedLocation?.longitude}
           />
         </div>

        {/* Bottom Grid */}
         <div className="bottom-grid">
           <div className="bottom-card">
             <h3 className="card-title">Weather Alerts</h3>
             <div className="stats-text">
               {/* Use monitoredLocations count from context for accurate stats */}
               {monitoredLocations.length > 0
                 ? `Monitoring alerts for ${monitoredLocations.length} favorite location(s).`
                 : 'No favorite locations currently being monitored for alerts.'}
             </div>
           </div>
           <div className="bottom-card">
             <h3 className="card-title">Quick Stats</h3>
             <div className="stats-list">
               <div className="stats-text">
                 {/* Use displayLocations length for total shown */}
                 Total Locations: {displayLocations.length}
               </div>
               <div className="stats-text">
                 {/* Use monitoredLocations count from context */}
                 Favorite Locations: {monitoredLocations.length}
               </div>
             </div>
           </div>
         </div>

      </div>
    </div>
  );
};

export default Dashboard;