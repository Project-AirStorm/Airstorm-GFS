// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js
// MODIFIED: Replaced Quick Stats card content with MiniMap
// MODIFIED: Added sorting for favorite locations

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
    let locationsToDisplay = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
      ...loc,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      backgroundColor: backgroundColors[index % 3],
    }));

    // *** ADDED SORTING LOGIC ***
    locationsToDisplay.sort((a, b) => {
      // Sort favorites to the top (true comes before false)
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Optional: Add secondary sort criteria if needed, e.g., by name
      // if (a.name && b.name && a.name < b.name) return -1;
      // if (a.name && b.name && a.name > b.name) return 1;
      return 0; // Keep original order if favorite status is the same
    });
    // *** END OF ADDED SORTING LOGIC ***

    setDisplayLocations(locationsToDisplay); // Set the sorted locations

    // Update selectedLocation logic (as before)
    // Consider if you want to automatically select the first item (which might now be a favorite)
    if (selectedLocation && !locationsToDisplay.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) {
        setSelectedLocation(null); // Deselect if the currently selected one is removed
    }
    // If nothing is selected OR the selected item is no longer in the list, select the first one (if any)
    if ((!selectedLocation || !locationsToDisplay.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) && locationsToDisplay.length > 0) {
         setSelectedLocation(locationsToDisplay[0]);
    } else if (locationsToDisplay.length === 0) {
        setSelectedLocation(null); // Deselect if there are no locations
    }
  }, [contextSavedLocations]); // Removed selectedLocation dependency here as selection logic is handled inside


  // --- Keep existing handlers ---
  const handleTimeframeChange = () => { console.log('Timeframe changed'); };
  const handleAddBase = () => { console.log('Add base clicked'); };
  const handleLocationAdded = () => { console.log("Dashboard: Location added, refreshing context."); refreshAlerts(); };
  const handleDeleteLocation = async (latitude, longitude) => {
    if (!userProfile?.userId) { setError('User session not found.'); return; }
    try {
      await axios.delete(`${REACT_APP_API_URL}/api/locations`, { data: { userId: userProfile.userId, latitude, longitude } });
      // No need to optimistically remove here, refreshAlerts will trigger useEffect
      // But ensure selected location is cleared if it's the one being deleted
      if (selectedLocation?.latitude === latitude && selectedLocation?.longitude === longitude) {
           setSelectedLocation(null);
      }
      refreshAlerts();
    } catch (err) { console.error('Error deleting location:', err); setError(`Failed to delete: ${err.response?.data?.error || err.message}`); }
  };

  const handleToggleFavorite = async (latitude, longitude) => {
     if (!userProfile?.userId) { setError('User session not found.'); return; }
     const originalLocations = [...displayLocations]; // Keep original for rollback
     const locationIndex = displayLocations.findIndex(loc => loc.latitude === latitude && loc.longitude === longitude);
     if (locationIndex === -1) { setError("Location not found."); return; }

     // Create the optimistically updated list
     let optimisticLocations = displayLocations.map((loc, index) =>
       index === locationIndex ? { ...loc, isFavorite: !loc.isFavorite } : loc
     );

     // *** ADDED SORTING LOGIC ***
     optimisticLocations.sort((a, b) => {
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       return 0;
     });
     // *** END OF ADDED SORTING LOGIC ***

     setDisplayLocations(optimisticLocations); // Set the sorted optimistic state
     setError(null);

     try {
       await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, { userId: userProfile.userId, latitude, longitude });
       // refreshAlerts() triggers useEffect, which re-fetches and re-sorts based on the updated context data.
       refreshAlerts();
     } catch (err) {
       console.error('Error toggling favorite:', err);
       setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
       // Rollback using the original *unsorted* list if the API call fails
       setDisplayLocations(originalLocations);
     }
   };

  const handleWeatherCardClick = (location) => {
     console.log(`Dashboard: WeatherCard clicked - ${location.name}`);
     setSelectedLocation({ latitude: location.latitude, longitude: location.longitude, name: location.name });
   };

  // Derive monitoredLocations from the already sorted displayLocations for consistency
  const monitoredLocations = displayLocations.filter((loc) => loc.isFavorite);

  // --- Determine map center and zoom ---
  // Center on selected location if available, otherwise the first location (which is now likely a favorite if any exist), or fallback
  const initialMapCenter = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : displayLocations.length > 0
      ? [displayLocations[0].latitude, displayLocations[0].longitude]
      : [32.5252, -93.7502]; // Default fallback (Shreveport)

  const initialMapZoom = selectedLocation ? 8 : displayLocations.length > 0 ? 6 : 4; // Zoom slightly more if a location exists


  // --- Loading State ---
  // Show loader if context is loading OR if locations are loading AND we don't have any yet
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

        {/* Weather Grid (Sorted Weather Cards) */}
        <div className="weather-grid">
          {displayLocations.length > 0 ? displayLocations.map((location) => (
            <div
              className={`weather-card-wrapper ${selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude ? 'selected' : ''}`}
              key={`${location.name}-${location.latitude}-${location.longitude}`} // Ensure unique key
              onClick={() => handleWeatherCardClick(location)}
              style={{ cursor: 'pointer' }}
              title={`Click to view ${location.name} detailed forecast`}
            >
              <WeatherCard
                city={location.name || 'Unnamed Location'} // Add fallback for name
                state="" // State seems unused, maybe remove later?
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
        {selectedLocation && ( // Only show chart if a location is selected
          <div className="chart-section">
            <h3 className="chart-title">
              {`${selectedLocation.name} Weather Forecast (16 Days)`}
            </h3>
            <GraphCastForecast
              customLatitude={selectedLocation.latitude}
              customLongitude={selectedLocation.longitude}
            />
          </div>
        )}
         {!selectedLocation && displayLocations.length > 0 && ( // Show placeholder if locations exist but none selected
            <div className="chart-section no-selection-message">
                <p>Select a location card above to view its detailed forecast.</p>
            </div>
         )}


        {/* Bottom Grid - MODIFIED */}
        <div className="bottom-grid">
          {/* Weather Alerts Card (Unchanged) */}
          <div className="bottom-card">
            <h3 className="card-title">Weather Alerts</h3>
            <div className="stats-text">
              {monitoredLocations.length > 0 ? `Monitoring alerts for ${monitoredLocations.length} favorite location(s).` : 'No favorite locations currently being monitored for alerts.'}
              {/* Consider adding a link or info on how to set alerts */}
            </div>
          </div>

          {/* Quick Stats Card - REPLACED with MiniMap */}
          <div className="bottom-card bottom-card--map">
            {/* MiniMap now correctly centers based on selection/first item */}
            <MiniMap
                 centerLat={initialMapCenter[0]}
                 centerLon={initialMapCenter[1]}
                 zoomLevel={initialMapZoom}
                 locations={displayLocations} // Pass sorted locations for markers
                 selectedLocation={selectedLocation} // Pass selected location to potentially highlight it
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;