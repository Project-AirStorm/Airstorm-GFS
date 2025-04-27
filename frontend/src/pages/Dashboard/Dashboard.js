// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js

import React, { useState, useEffect } from 'react';
// import { UserSession } from '../../utils/UserSession'; // Using UserContext now
import { useUserProfile } from '../../contexts/UserContext'; // <-- Import UserContext hook
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
  // Use UserContext for shared state and actions
  const {
    userProfile,
    savedLocations: contextSavedLocations, // Rename to avoid conflict if needed
    refreshAlerts, // Use context refresh function
    isLoading: contextLoading,
    isLocationLoading
  } = useUserProfile();

  const [activeView, setActiveView] = useState('overview');
  // Remove local state for locations, use context state directly
  // const [locations, setLocations] = useState([]);
  // Use context loading states instead of local loading
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Keep local error state for dashboard-specific errors
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Define the handlers for buttons passed to ActionButtons
  const handleTimeframeChange = () => {
    console.log('Timeframe changed');
    // Add actual logic if needed
  };

  const handleAddBase = () => {
    console.log('Add base clicked');
     // Add actual logic if needed, e.g., show a modal
  };

  // Called by ActionButtons after AddLocationPopup closes successfully
  const handleLocationAdded = () => {
    // No need to fetch locally, just refresh the context
    console.log("Dashboard: Location added, refreshing context.");
    refreshAlerts();
  };

  // REMOVE local fetchLocations - Context handles this
  /*
  const fetchLocations = useCallback(async () => { ... }, [userProfile?.userId]);
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);
  */

  const handleDeleteLocation = async (latitude, longitude) => {
    // Ensure userProfile and userId are available
    if (!userProfile?.userId) {
        console.error("Cannot delete: User ID not available.");
        setError('User session not found. Cannot delete location.');
        return;
    }
    try {
      console.log(`Dashboard: Deleting location ${latitude}, ${longitude} for user ${userProfile.userId}`);
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
        data: {
          userId: userProfile.userId,
          latitude,
          longitude,
        },
      });

      // If the deleted location was selected, reset the detailed forecast view
      if (selectedLocation &&
          selectedLocation.latitude === latitude &&
          selectedLocation.longitude === longitude) {
        console.log("Dashboard: Resetting selected location after deletion.");
        setSelectedLocation(null);
      }

      // Refresh context state after deletion
      console.log("Dashboard: Location deleted, refreshing context.");
      refreshAlerts();
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(`Failed to delete location: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleToggleFavorite = async (latitude, longitude) => {
    // Ensure userProfile and userId are available
    if (!userProfile?.userId) {
        console.error("Cannot toggle favorite: User ID not available.");
        setError('User session not found. Cannot toggle favorite.');
        return;
    }
    try {
      console.log(`Dashboard: Toggling favorite for ${latitude}, ${longitude} for user ${userProfile.userId}`);
      await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, {
        userId: userProfile.userId,
        latitude,
        longitude,
      });
      // Refresh context state after toggling favorite
      console.log("Dashboard: Favorite toggled, refreshing context.");
      refreshAlerts();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handler for selecting a WeatherCard to show detailed forecast
  const handleWeatherCardClick = (location) => {
    console.log(`Dashboard: WeatherCard clicked - ${location.name}`);
    // Store basic info needed for GraphCastForecast props
    setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name // Ensure name is available
    });
  };

  // Use derived state from context for monitored locations
  // Ensure contextSavedLocations is an array before filtering
  const monitoredLocations = Array.isArray(contextSavedLocations)
     ? contextSavedLocations.filter((loc) => loc.isFavorite)
     : [];


  // Use context loading states for the main loader
  if (contextLoading || isLocationLoading) {
    return <Loader size="medium" message={contextLoading ? "Loading user data..." : "Loading locations..."} />;
  }

  // Apply background colors locally for display if needed
  const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
  const locationsToDisplay = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
        ...loc,
        // Ensure lat/lon are numbers if WeatherCard expects them
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
        backgroundColor: backgroundColors[index % 3],
  }));


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
            timeframe="Week" // Or manage timeframe state if needed
            onLocationAdded={handleLocationAdded} // Hooked up to refresh context
          />
        </div>

        {/* Display local error message if any action failed */}
        {error && <div className="dashboard-error-message" role="alert">{error}</div>}

        <div className="weather-grid">
          {/* Use derived locationsToDisplay from context */}
          {locationsToDisplay.length > 0 ? locationsToDisplay.map((location) => (
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
                state="" // You might want to add state to your location data if available
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
             // Pass lat/lon explicitly or let the component handle local detection if null
             customLatitude={selectedLocation?.latitude}
             customLongitude={selectedLocation?.longitude}
           />
         </div>

        {/* Bottom Grid */}
         <div className="bottom-grid">
           <div className="bottom-card">
             <h3 className="card-title">Weather Alerts</h3>
             <div className="stats-text">
               {monitoredLocations.length > 0
                 ? `Monitoring alerts for ${monitoredLocations.length} favorite location(s).`
                 : 'No favorite locations currently being monitored for alerts.'}
             </div>
             {/* Consider adding a link to the Alerts page */}
           </div>
           <div className="bottom-card">
             <h3 className="card-title">Quick Stats</h3>
             <div className="stats-list">
               <div className="stats-text">
                 Total Locations: {locationsToDisplay.length} {/* Use derived list length */}
               </div>
               <div className="stats-text">
                 Favorite Locations: {monitoredLocations.length}
               </div>
               {/* Last Updated might be less relevant now, consider removing or using context load time */}
               {/* <div className="stats-text">
                 Last Updated: {new Date().toLocaleTimeString()}
               </div> */}
             </div>
           </div>
         </div>

      </div>
    </div>
  );
};

export default Dashboard;