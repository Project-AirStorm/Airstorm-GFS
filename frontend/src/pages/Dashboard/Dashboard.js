// File: Airstorm-GFS/frontend/src/pages/Dashboard/Dashboard.js
// MODIFIED: Reverted to explicitly passing labels to OverviewSwitch.
// MODIFIED: Labels set to "Favorited" / "Unfavorited".
// Retained: Filtering logic for Favorited/Unfavorited views.

import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserContext';
import axios from 'axios';
import WeatherCard from '../../components/specific/WeatherCard/WeatherCard';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch'; // Import the version that accepts props
import Loader from '../../components/common/loader';
import MiniMap from '../../components/specific/MiniMap/MiniMap';
import '../../components/specific/MiniMap/MiniMap.css';

import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

import './Dashboard.css';

// --- Helper Functions --- (Keep as before)
function formatDateTime(dateString) {
   if (!dateString) return 'N/A';
   try {
     return new Date(dateString.replace('Z', '+00:00')).toLocaleString(undefined, {
         month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
     });
   } catch (e) { return 'Invalid Date'; }
}
const formatTextWithParagraphs = (text) => {
    if (!text) return null;
    return text.split(/\n+/).map((paragraph, index) => (
      <p key={index} className="dashboard-alert-paragraph">
        {paragraph.trim()}
      </p>
    ));
};
const extractStateName = (locationName) => {
    if (!locationName || typeof locationName !== 'string') return null;
    const parts = locationName.split(',');
    if (parts.length > 1) {
        const statePart = parts[parts.length - 1].trim();
        if (statePart.length >= 2) return statePart;
    }
    return locationName;
};
// --- END Helper Functions ---

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Dashboard = ({ setCurrentPage }) => {
  const {
    userProfile,
    savedLocations: contextSavedLocations,
    refreshAlerts,
    isLoading: contextLoading,
    isLocationLoading,
  } = useUserProfile();

  // --- States ---
  const [displayLocations, setDisplayLocations] = useState([]);
  // 'overview' state maps to "Favorited" view (labelOne)
  // 'detailed' state maps to "Unfavorited" view (labelTwo)
  const [activeView, setActiveView] = useState('overview'); // Default to showing 'Favorited'
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [allAlerts, setAllAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertError, setAlertError] = useState(null);
  const [expandedDashboardAlerts, setExpandedDashboardAlerts] = useState({});
  // --- END States ---


  // --- Fetch Alerts Effect --- (Keep as before)
  useEffect(() => {
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


  // --- Location Display and Selection Effect --- (Keep filtering logic)
  useEffect(() => {
     const backgroundColors = ['#A1A7FF', '#C4D0BA', '#94B0DA'];
     let allLocations = (Array.isArray(contextSavedLocations) ? contextSavedLocations : []).map((loc, index) => ({
       ...loc, latitude: Number(loc.latitude), longitude: Number(loc.longitude), backgroundColor: backgroundColors[index % 3],
     }));
     allLocations.sort((a, b) => {
       if (a.isFavorite && !b.isFavorite) return -1;
       if (!a.isFavorite && b.isFavorite) return 1;
       return 0;
     });
     setDisplayLocations(allLocations);

     const currentViewLocations = activeView === 'overview' // 'overview' == "Favorited" view
         ? allLocations.filter(loc => loc.isFavorite)
         : allLocations.filter(loc => !loc.isFavorite); // 'detailed' == "Unfavorited" view

     if (selectedLocation && !currentViewLocations.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) {
         setSelectedLocation(null);
     }

     if ((!selectedLocation || !currentViewLocations.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) && currentViewLocations.length > 0) {
          setSelectedLocation(currentViewLocations[0]);
     } else if (currentViewLocations.length === 0) {
          setSelectedLocation(null);
     }
  }, [contextSavedLocations, activeView]);
  // --- END Effect ---


  // --- Handlers --- (Keep as before)
  const handleTimeframeChange = () => { console.log('Timeframe changed'); };
  const handleAddBase = () => { console.log('Add base clicked'); };
  const handleLocationAdded = () => { console.log("Dashboard: Location added, refreshing context."); refreshAlerts(); };
  const handleDeleteLocation = async (latitude, longitude) => {
     if (!userProfile?.userId) { setError('User session not found.'); return; }
     try {
       await axios.delete(`${REACT_APP_API_URL}/api/locations`, { data: { userId: userProfile.userId, latitude, longitude } });
       refreshAlerts();
     } catch (err) { console.error('Error deleting location:', err); setError(`Failed to delete: ${err.response?.data?.error || err.message}`); }
   };
   const handleToggleFavorite = async (latitude, longitude) => {
      if (!userProfile?.userId) { setError('User session not found.'); return; }
      setError(null);
      try {
        await axios.post(`${REACT_APP_API_URL}/api/locations/favorite`, { userId: userProfile.userId, latitude, longitude });
        refreshAlerts();
      } catch (err) {
        console.error('Error toggling favorite:', err);
        setError(`Failed to toggle favorite: ${err.response?.data?.error || err.message}`);
      }
    };
  const handleWeatherCardClick = (location) => {
     console.log(`Dashboard: WeatherCard clicked - ${location.name}`);
     setSelectedLocation({ latitude: location.latitude, longitude: location.longitude, name: location.name });
     setExpandedDashboardAlerts({});
   };
   const toggleAlertExpansion = (alertId) => {
       setExpandedDashboardAlerts(prev => ({ ...prev, [alertId]: !prev[alertId] }));
   };
   // --- END Handlers ---

  // --- Filter Alerts based on Selected Location --- (Keep as before)
  const filteredAlerts = selectedLocation
    ? allAlerts.filter(alert => alert.latitude === selectedLocation.latitude && alert.longitude === selectedLocation.longitude)
    : [];
  // --- END Filter ---

  // --- Determine locations to render based on the active view --- (Keep filtering logic)
  const locationsToRender = activeView === 'overview' // 'overview' == "Favorited"
      ? displayLocations.filter(location => location.isFavorite)
      : displayLocations.filter(location => !location.isFavorite); // 'detailed' == "Unfavorited"
  // --- END Filter Logic ---


  // --- Map center and zoom (based on visible locations) --- (Keep as before)
   const initialMapCenter = selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : locationsToRender.length > 0 ? [locationsToRender[0].latitude, locationsToRender[0].longitude] : [32.5252, -93.7502];
   const initialMapZoom = selectedLocation ? 8 : locationsToRender.length > 0 ? 6 : 4;

  // --- Loading State --- (Keep as before)
  if (contextLoading || (isLocationLoading && displayLocations.length === 0)) {
    return <Loader size="medium" message={contextLoading ? "Loading user data..." : "Loading locations..."} />;
  }

  // --- Determine State Name for Title --- (Keep as before)
  const locationStateName = selectedLocation ? extractStateName(selectedLocation.name) : null;
  const alertsTitle = selectedLocation ? `Weather Alerts for ${locationStateName || selectedLocation.name}` : 'Weather Alerts';
  // --- END Title Logic ---

  // --- Render ---
  return (
    <div className="dashboard-container">
      <div className="main-content">
        {/* Controls Container */}
        <div className="controls-container">
            {/* MODIFIED: Explicitly pass the desired labels */}
            <OverviewSwitch
              activeView={activeView}
              onViewChange={setActiveView}
              labelOne="Favorited" // Explicitly set label for 'overview' state
              labelTwo="Unfavorited" // Explicitly set label for 'detailed' state
            />
            <ActionButtons onTimeframeChange={handleTimeframeChange} onAddBase={handleAddBase} timeframe="Week" onLocationAdded={handleLocationAdded} />
        </div>

        {error && <div className="dashboard-error-message" role="alert">{error}</div>}

        {/* Weather Grid - Uses locationsToRender */}
        <div className="weather-grid">
             {locationsToRender.length > 0 ? locationsToRender.map((location) => (
                <div
                className={`weather-card-wrapper ${selectedLocation?.latitude === location.latitude && selectedLocation?.longitude === location.longitude ? 'selected' : ''}`}
                key={`${location.name}-${location.latitude}-${location.longitude}`} onClick={() => handleWeatherCardClick(location)} style={{ cursor: 'pointer' }} title={`Click to view ${location.name} detailed forecast`} >
                <WeatherCard city={location.name || 'Unnamed Location'} state="" latitude={location.latitude} longitude={location.longitude} backgroundColor={location.backgroundColor} onDelete={(e) => { e.stopPropagation(); handleDeleteLocation(location.latitude, location.longitude); }} onToggleFavorite={(e) => { e.stopPropagation(); handleToggleFavorite(location.latitude, location.longitude); }} isFavorite={location.isFavorite} />
                </div>
            )) : (
                 // Keep updated empty state message
                 activeView === 'overview' // "Favorited" view
                 ? <div className="no-locations-message"><p>No locations currently favorited.</p></div>
                 : <div className="no-locations-message"><p>No locations currently unfavorited.</p></div> // "Unfavorited" view
             )}
        </div>
        {/* End Weather Grid */}


        {/* Chart Section - Shows chart only if a location is selected */}
        {selectedLocation && ( <div className="chart-section"><h3 className="chart-title">{`${selectedLocation.name} Weather Forecast (16 Days)`}</h3><GraphCastForecast customLatitude={selectedLocation.latitude} customLongitude={selectedLocation.longitude}/></div> )}
        {/* Message when locations exist in the view, but none is selected */}
        {!selectedLocation && locationsToRender.length > 0 && ( <div className="chart-section no-selection-message"><p>Select a location card above to view its detailed forecast.</p></div> )}

        {/* Bottom Grid */}
        <div className="bottom-grid">

          {/* Weather Alerts Card */}
          <div className="bottom-card">
            <h3 className="card-title"> {alertsTitle} </h3>
            <div className="dashboard-alerts-container">
              {alertsLoading ? (
                 <div className="dashboard-alerts-placeholder">Loading alerts...</div>
              ) : alertError ? (
                 <div className="dashboard-alerts-placeholder error">{alertError}</div>
              ) : !selectedLocation ? (
                <div className="dashboard-alerts-placeholder">
                    {locationsToRender.length > 0 ? "Select a location card to view its alerts." : "No locations to display alerts for."}
                </div>
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert, index) => {
                  const alertId = `${alert.event}-${alert.onset}-${index}`;
                  const isExpanded = !!expandedDashboardAlerts[alertId];
                  const severityClass = `alert-${(alert.severity || 'unknown').toLowerCase()}`;
                  return (
                    <div key={alertId} className={`dashboard-alert-item ${severityClass}`}>
                        <div className="dashboard-alert-header" onClick={() => toggleAlertExpansion(alertId)}>
                           <AlertTriangle className={`dashboard-alert-icon ${severityClass}`} />
                           <div className="dashboard-alert-header-text">
                               <span className="dashboard-alert-event">{alert.event}</span>
                               <span className="dashboard-alert-time">Starts: {formatDateTime(alert.onset)}</span>
                           </div>
                           <span className={`dashboard-severity-badge ${severityClass}`}>
                               {alert.severity}
                           </span>
                           {isExpanded ? <ChevronUp className="dashboard-alert-chevron" /> : <ChevronDown className="dashboard-alert-chevron" />}
                        </div>
                         {isExpanded && (
                             <div className="dashboard-alert-details">
                                 {alert.headline && (<p className="dashboard-alert-headline">{alert.headline}</p>)}
                                 {alert.description && (<div className="dashboard-alert-description">{formatTextWithParagraphs(alert.description)}</div>)}
                                 {alert.instruction && (<div className="dashboard-alert-instruction"><p className="dashboard-alert-instruction-title">Instructions:</p>{formatTextWithParagraphs(alert.instruction)}</div>)}
                                 {!alert.headline && !alert.description && !alert.instruction && (<p className="dashboard-alert-no-details">No additional details available.</p>)}
                             </div>
                         )}
                    </div>
                  );
                })
              ) : (
                 <div className="dashboard-alerts-placeholder">No active alerts for {selectedLocation.name}.</div>
              )}
            </div> {/* End dashboard-alerts-container */}
          </div> {/* End Weather Alerts Card */}

          {/* MiniMap Card - Shows locations currently rendered */}
           <div className="bottom-card bottom-card--map">
                <MiniMap centerLat={initialMapCenter[0]} centerLon={initialMapCenter[1]} zoomLevel={initialMapZoom} locations={locationsToRender} selectedLocation={selectedLocation} />
            </div>

        </div> {/* End Bottom Grid */}
      </div> {/* End Main Content */}
    </div> // End Dashboard Container
  );
};

export default Dashboard;