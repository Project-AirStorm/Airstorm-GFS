// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js
// MODIFIED: Extracted alert styles to Dashboard.css, using CSS classes now.

import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserContext'; // Original
import axios from 'axios'; // Original
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard'; // Original
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast'; // Original
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons'; // Original
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch'; // Original
import Loader from '../../components/common/loader'; // Original
import MiniMap from '../../components/specific/MiniMap/MiniMap'; // Original
import '../../components/specific/MiniMap/MiniMap.css'; // Original

// --- ADDED Imports ---
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'; // Keep Chevrons
// --- END ADDED Imports ---

import './Dashboard.css'; // Original import - CSS FILE WILL BE MODIFIED BELOW

// --- Helper Functions ---
// Simple date/time formatter
function formatDateTime(dateString) {
   if (!dateString) return 'N/A';
   try {
     return new Date(dateString.replace('Z', '+00:00')).toLocaleString(undefined, {
         month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
     });
   } catch (e) { return 'Invalid Date'; }
}

// Helper to format text with paragraphs using CSS classes
const formatTextWithParagraphs = (text) => {
    if (!text) return null;
    return text.split(/\n+/).map((paragraph, index) => (
      <p key={index} className="dashboard-alert-paragraph"> {/* Added class */}
        {paragraph.trim()}
      </p>
    ));
};

// Helper to attempt extracting state from location name
const extractStateName = (locationName) => {
    // ... (same as before)
    if (!locationName || typeof locationName !== 'string') return null;
    const parts = locationName.split(',');
    if (parts.length > 1) {
        const statePart = parts[parts.length - 1].trim();
        if (statePart.length >= 2) return statePart;
    }
    return locationName;
};
// --- END Helper Functions ---

// REMOVED severityStyles constant, will use CSS classes

const REACT_APP_API_URL = process.env.REACT_APP_API_URL; // Original

const Dashboard = ({ setCurrentPage }) => { // Original
  const {
    userProfile, // Original
    savedLocations: contextSavedLocations, // Original
    refreshAlerts, // Original
    isLoading: contextLoading, // Original
    isLocationLoading, // Original
  } = useUserProfile();

  // --- States ---
  const [displayLocations, setDisplayLocations] = useState([]); // Original
  const [activeView, setActiveView] = useState('overview'); // Original
  const [error, setError] = useState(null); // Original
  const [selectedLocation, setSelectedLocation] = useState(null); // Original
  const [allAlerts, setAllAlerts] = useState([]); // Original Added State
  const [alertsLoading, setAlertsLoading] = useState(false); // Original Added State
  const [alertError, setAlertError] = useState(null); // Original Added State
  const [expandedDashboardAlerts, setExpandedDashboardAlerts] = useState({}); // Original Added State
  // --- END States ---


  // --- Fetch Alerts Effect ---
  useEffect(() => {
    // ... (fetch logic identical) ...
    if (!userProfile?.userId) return;
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      setAlertError(null);
      try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/external/alerts?userId=${userProfile.userId}`);
        setAllAlerts(response.data?.alerts || []);
      } catch (err) {
        console.error('Error fetching alerts for dashboard:', err);
        setAlertError('Failed to load alerts: ' + (err.response?.data?.error || err.message));
        setAllAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };
    fetchAlerts();
  }, [userProfile?.userId]);
  // --- END Effect ---


  // --- Original Location Display and Selection Effect ---
  useEffect(() => {
    // ... (location display logic identical) ...
     const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
     let locationsToDisplay = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
       ...loc, latitude: Number(loc.latitude), longitude: Number(loc.longitude), backgroundColor: backgroundColors[index % 3],
     }));
     locationsToDisplay.sort((a, b) => {
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       return 0;
     });
     setDisplayLocations(locationsToDisplay);
     if (selectedLocation && !locationsToDisplay.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) {
         setSelectedLocation(null);
     }
     if ((!selectedLocation || !locationsToDisplay.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) && locationsToDisplay.length > 0) {
          setSelectedLocation(locationsToDisplay[0]);
     } else if (locationsToDisplay.length === 0) {
         setSelectedLocation(null);
     }
  }, [contextSavedLocations]); // Original Dependencies


  // --- Original Handlers ---
  // ... (handleTimeframeChange, handleAddBase, handleLocationAdded, handleDeleteLocation, handleToggleFavorite handlers identical) ...
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
      const locationIndex = displayLocations.findIndex(loc => loc.latitude === latitude && loc.longitude === longitude);
      if (locationIndex === -1) { setError("Location not found."); return; }
      let optimisticLocations = displayLocations.map((loc, index) => index === locationIndex ? { ...loc, isFavorite: !loc.isFavorite } : loc);
      optimisticLocations.sort((a, b) => { if (a.isFavorite && !b.isFavorite) return -1; if (!a.isFavorite && b.isFavorite) return 1; return 0; });
      setDisplayLocations(optimisticLocations);
      setError(null);
      try {
        await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, { userId: userProfile.userId, latitude, longitude });
        refreshAlerts();
      } catch (err) {
        console.error('Error toggling favorite:', err);
        setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
        setDisplayLocations(originalLocations);
      }
    };

  // --- MODIFIED Handler: Select location AND close open alerts ---
  const handleWeatherCardClick = (location) => { // Original
     console.log(`Dashboard: WeatherCard clicked - ${location.name}`); // Original
     setSelectedLocation({ latitude: location.latitude, longitude: location.longitude, name: location.name }); // Original
     setExpandedDashboardAlerts({}); // Collapse alerts
   }; // Original

   // --- ADDED Handler: Toggle alert expansion ---
   const toggleAlertExpansion = (alertId) => {
       setExpandedDashboardAlerts(prev => ({ ...prev, [alertId]: !prev[alertId] }));
   };
   // --- END ADDED Handler ---

  // --- Filter Alerts based on Selected Location ---
  const filteredAlerts = selectedLocation
    ? allAlerts.filter(alert => alert.latitude === selectedLocation.latitude && alert.longitude === selectedLocation.longitude)
    : [];
  // --- END Filter ---

  // --- Original map center and zoom ---
  // ... (initialMapCenter, initialMapZoom logic identical) ...
   const initialMapCenter = selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : displayLocations.length > 0 ? [displayLocations[0].latitude, displayLocations[0].longitude] : [32.5252, -93.7502];
   const initialMapZoom = selectedLocation ? 8 : displayLocations.length > 0 ? 6 : 4;

  // --- Original Loading State ---
  if (contextLoading || (isLocationLoading && displayLocations.length === 0)) { // Original
    return <Loader size="medium" message={contextLoading ? "Loading user data..." : "Loading locations..."} />; // Original
  } // Original

  // --- Determine State Name for Title ---
  const locationStateName = selectedLocation ? extractStateName(selectedLocation.name) : null;
  const alertsTitle = selectedLocation ? `Weather Alerts for ${locationStateName || selectedLocation.name}` : 'Weather Alerts';
  // --- END Title Logic ---

  // --- Render ---
  return (
    <div className="dashboard-container"> {/* Original */}
      <div className="main-content"> {/* Original */}
        {/* Original Controls Container */}
        {/* ... (identical controls structure) ... */}
        <div className="controls-container">
            <OverviewSwitch activeView={activeView} onViewChange={setActiveView} />
            <ActionButtons onTimeframeChange={handleTimeframeChange} onAddBase={handleAddBase} timeframe="Week" onLocationAdded={handleLocationAdded} />
        </div>

        {error && <div className="dashboard-error-message" role="alert">{error}</div>} {/* Original General Error Display */}

        {/* Original Weather Grid */}
        {/* ... (identical weather grid structure and logic) ... */}
        <div className="weather-grid">
            {displayLocations.length > 0 ? displayLocations.map((location) => (
                <div
                className={`weather-card-wrapper ${selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude ? 'selected' : ''}`}
                key={`${location.name}-${location.latitude}-${location.longitude}`} onClick={() => handleWeatherCardClick(location)} style={{ cursor: 'pointer' }} title={`Click to view ${location.name} detailed forecast`} >
                <WeatherCard city={location.name || 'Unnamed Location'} state="" latitude={location.latitude} longitude={location.longitude} backgroundColor={location.backgroundColor} onDelete={(e) => { e.stopPropagation(); handleDeleteLocation(location.latitude, location.longitude); }} onToggleFavorite={(e) => { e.stopPropagation(); handleToggleFavorite(location.latitude, location.longitude); }} isFavorite={location.isFavorite} />
                </div>
            )) : ( <div className="no-locations-message"><p>No locations saved yet. Add a location using the button above.</p></div> )}
        </div>

        {/* Original Chart Section */}
        {/* ... (identical chart section structure and logic) ... */}
        {selectedLocation && ( <div className="chart-section"><h3 className="chart-title">{`${selectedLocation.name} Weather Forecast (16 Days)`}</h3><GraphCastForecast customLatitude={selectedLocation.latitude} customLongitude={selectedLocation.longitude}/></div> )}
        {!selectedLocation && displayLocations.length > 0 && ( <div className="chart-section no-selection-message"><p>Select a location card above to view its detailed forecast.</p></div> )}

        {/* Original Bottom Grid */}
        <div className="bottom-grid"> {/* Original */}

          {/* Weather Alerts Card - Using CSS classes now */}
          <div className="bottom-card"> {/* Original Card Structure */}
            <h3 className="card-title"> {alertsTitle} </h3> {/* Updated Title */}

            {/* --- Container for scrollable alerts - uses CSS class --- */}
            <div className="dashboard-alerts-container">
              {alertsLoading ? (
                 <div className="dashboard-alerts-placeholder">Loading alerts...</div>
              ) : alertError ? (
                 <div className="dashboard-alerts-placeholder error">{alertError}</div>
              ) : !selectedLocation ? (
                <div className="dashboard-alerts-placeholder">Select a location card to view its alerts.</div>
              ) : filteredAlerts.length > 0 ? (
                 // Map over filtered alerts
                filteredAlerts.map((alert, index) => {
                  const alertId = `${alert.event}-${alert.onset}-${index}`; // Unique ID for state
                  const isExpanded = !!expandedDashboardAlerts[alertId];
                  // Generate dynamic class names for severity
                  const severityClass = `alert-${(alert.severity || 'unknown').toLowerCase()}`; // e.g., alert-severe
                  return (
                    // Wrapper uses severity class for border
                    <div key={alertId} className={`dashboard-alert-item ${severityClass}`}>
                        {/* Alert Item Header (clickable) */}
                        <div className="dashboard-alert-header" onClick={() => toggleAlertExpansion(alertId)}>
                           {/* Icon also uses severity class */}
                           <AlertTriangle className={`dashboard-alert-icon ${severityClass}`} />
                           <div className="dashboard-alert-header-text">
                               <span className="dashboard-alert-event">{alert.event}</span>
                               <span className="dashboard-alert-time">Starts: {formatDateTime(alert.onset)}</span>
                           </div>
                           {/* Badge uses severity class */}
                           <span className={`dashboard-severity-badge ${severityClass}`}>
                               {alert.severity}
                           </span>
                           {/* Chevron Icon */}
                           {isExpanded ? <ChevronUp className="dashboard-alert-chevron" /> : <ChevronDown className="dashboard-alert-chevron" />}
                        </div>

                         {/* Expanded Details Section */}
                         {isExpanded && (
                             <div className="dashboard-alert-details">
                                 {alert.headline && (
                                     <p className="dashboard-alert-headline">{alert.headline}</p>
                                 )}
                                 {alert.description && (
                                     <div className="dashboard-alert-description">
                                         {formatTextWithParagraphs(alert.description)}
                                     </div>
                                 )}
                                 {alert.instruction && (
                                     <div className="dashboard-alert-instruction">
                                         <p className="dashboard-alert-instruction-title">Instructions:</p>
                                         {formatTextWithParagraphs(alert.instruction)}
                                     </div>
                                 )}
                                 {!alert.headline && !alert.description && !alert.instruction && (
                                     <p className="dashboard-alert-no-details">No additional details available.</p>
                                 )}
                             </div>
                         )}
                    </div> // End wrapper div
                  );
                }) // End map
              ) : ( // Else for filteredAlerts.length > 0
                 <div className="dashboard-alerts-placeholder">No active alerts for {selectedLocation.name}.</div>
              )}
            </div> {/* End dashboard-alerts-container */}
          </div> {/* End Original Weather Alerts Card Structure */}

          {/* Original MiniMap Card */}
          {/* ... (identical minimap structure) ... */}
           <div className="bottom-card bottom-card--map">
                <MiniMap centerLat={initialMapCenter[0]} centerLon={initialMapCenter[1]} zoomLevel={initialMapZoom} locations={displayLocations} selectedLocation={selectedLocation} />
            </div>

        </div> {/* Original */}
      </div> {/* Original */}
    </div> // Original
  ); // Original
}; // Original

export default Dashboard; // Original