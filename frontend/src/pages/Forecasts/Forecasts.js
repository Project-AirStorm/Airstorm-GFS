// File: Airstorm-GFS/frontend/src/pages/Forecasts/Forecasts.js

import PropTypes from 'prop-types';
import './Forecasts.css';
import axios from 'axios';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserSession } from '../../utils/UserSession';
import WeatherBox from '../../components/specific/WeatherBox/WeatherBox'; // Import WeatherBox
import { ChevronDown, ChevronUp, MapPin, Plus } from 'lucide-react';
import Loader from '../../components/common/loader';
import AddLocationPopup from '../../components/specific/AddLocationPopup/AddLocationPopup';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// --- LocationSelector Component (Keep as defined previously) ---
const LocationSelector = ({ locations, onSelectLocation, selectedLocation, isPopupOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !isPopupOpen) { // Only listen when dropdown is open AND popup is closed
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isPopupOpen]); // Add isPopupOpen dependency

  const getButtonText = () => {
    if (!locations || locations.length === 0) return 'No Locations';
    if (selectedLocation) return selectedLocation.name || `${selectedLocation.latitude?.toFixed(4)}, ${selectedLocation.longitude?.toFixed(4)}`;
    return 'Select Location';
  };

  return (
    <div className="forecast-location-selector-wrapper" ref={dropdownRef}>
      <button className="forecast-location-selector-button" onClick={toggleDropdown} aria-expanded={isOpen}>
        <MapPin size={16} className="location-icon" />
        <span>{getButtonText()}</span>
        {isOpen ? <ChevronUp size={16} className="dropdown-icon" /> : <ChevronDown size={16} className="dropdown-icon" />}
      </button>
      {isOpen && (
        <div className="forecast-location-selector-menu">
          {locations && locations.length > 0 ? (
            locations.map((loc) => (
              <button
                key={`${loc.latitude}-${loc.longitude}`}
                className={`location-option ${selectedLocation && selectedLocation.latitude === loc.latitude && selectedLocation.longitude === loc.longitude ? 'selected' : ''}`}
                onClick={() => { onSelectLocation(loc); setIsOpen(false); }}
              >
                <div className="location-option-content">
                  <span className="location-name">{loc.name || 'Unnamed Location'}</span>
                  <span className="location-coords">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
                </div>
                {loc.isFavorite && <span className="location-favorite">★</span>}
              </button>
            ))
          ) : <div className="no-locations-message">No saved locations</div>}
        </div>
      )}
    </div>
  );
};

LocationSelector.propTypes = {
    locations: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string, latitude: PropTypes.number.isRequired, longitude: PropTypes.number.isRequired, isFavorite: PropTypes.bool
    })).isRequired,
    onSelectLocation: PropTypes.func.isRequired,
    selectedLocation: PropTypes.shape({ name: PropTypes.string, latitude: PropTypes.number, longitude: PropTypes.number }),
    isPopupOpen: PropTypes.bool.isRequired
};
// --- End LocationSelector Component ---


const Forecasts = ({ setCurrentPage }) => {
  const { user, isLoaded: userSessionLoaded } = UserSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDisplayLocationCoords, setCurrentDisplayLocationCoords] = useState(null);
  const [allSavedLocations, setAllSavedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [fetchingLocations, setFetchingLocations] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [expandAllBoxes, setExpandAllBoxes] = useState(false); // State to control expansion

  // --- Fetching Logic (Keep as is) ---
  const fetchAllLocations = useCallback(async () => {
    if (!user || !user.id) { setAllSavedLocations([]); setLoading(false); return; }
    setFetchingLocations(true); setError(null);
    try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/locations?userId=${user.id}`);
        const locationsData = response.data || [];
        const normalizedLocations = locationsData.map(location => ({
             ...location, name: location.name || 'Unnamed Location', latitude: Number(location.latitude), longitude: Number(location.longitude), isFavorite: Boolean(location.isFavorite)
        }));
        setAllSavedLocations(normalizedLocations);
        if (!selectedLocation && normalizedLocations.length > 0) {
            setSelectedLocation(normalizedLocations[0]);
            setCurrentDisplayLocationCoords({ latitude: normalizedLocations[0].latitude, longitude: normalizedLocations[0].longitude });
        } else if (normalizedLocations.length === 0) {
            setSelectedLocation(null); setCurrentDisplayLocationCoords(null);
        } else if (selectedLocation && !normalizedLocations.some(loc => loc.latitude === selectedLocation.latitude && loc.longitude === selectedLocation.longitude)) {
            const firstLoc = normalizedLocations.length > 0 ? normalizedLocations[0] : null;
            setSelectedLocation(firstLoc); setCurrentDisplayLocationCoords(firstLoc ? { latitude: firstLoc.latitude, longitude: firstLoc.longitude } : null);
        }
    } catch (err) {
        setError(`Could not fetch your saved locations: ${err.message}`); setAllSavedLocations([]); setSelectedLocation(null); setCurrentDisplayLocationCoords(null);
    } finally {
        setFetchingLocations(false); setLoading(false);
    }
  }, [user, selectedLocation]);

  useEffect(() => {
    if (userSessionLoaded) {
      fetchAllLocations();
    }
  }, [userSessionLoaded, fetchAllLocations]);
  // --- End Fetching Logic ---

  const handleLocationSelected = (location) => {
    setSelectedLocation(location);
    setCurrentDisplayLocationCoords({
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

   const handleShowAddLocation = () => {
       setShowLocationPopup(true);
   };

   const handleLocationAdded = () => {
       setShowLocationPopup(false);
       fetchAllLocations();
   };

   // ** Modified onViewChange Handler **
   const handleViewChange = (view) => {
       setActiveView(view);
       // Set expandAllBoxes based on the selected view
       setExpandAllBoxes(view === 'detailed');
   };

  if (!userSessionLoaded || loading) {
    return <Loader size="medium" />;
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="controls-container">
            <OverviewSwitch
              activeView={activeView}
              onViewChange={handleViewChange} // Use the modified handler
            />
            <div className="forecast-controls-right">
              {fetchingLocations ? (
                  <div className="location-loading-placeholder">Loading...</div>
              ) : (
                  <LocationSelector
                      locations={allSavedLocations}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleLocationSelected}
                      isPopupOpen={showLocationPopup}
                  />
              )}
              <ActionButtons
                  onTimeframeChange={() => {}}
                  onAddBase={handleShowAddLocation}
                  onLocationAdded={handleLocationAdded}
               />
            </div>
        </div>

        {error && (
          <div className="alert error-message">
            Error: {error}
          </div>
        )}

        <div>
          <div className="weather-grid-vertical">
            {currentDisplayLocationCoords ? (
              <WeatherBox
                key={`${currentDisplayLocationCoords.latitude}-${currentDisplayLocationCoords.longitude}`}
                latitude={currentDisplayLocationCoords.latitude}
                longitude={currentDisplayLocationCoords.longitude}
                expandAll={expandAllBoxes} // Pass the new prop here
              />
            ) : (
                 !loading && allSavedLocations.length === 0 && (
                    <div className="no-locations-message-center">
                        Please add a location using the 'Add Location' button to view forecasts.
                    </div>
                 )
            )}
          </div>
        </div>
      </div>
       {/* Add Location Popup Modal */}
       <AddLocationPopup
            isOpen={showLocationPopup}
            onClose={() => setShowLocationPopup(false)}
            onLocationAdded={handleLocationAdded}
        />
    </div>
  );
};

Forecasts.propTypes = {
  setCurrentPage: PropTypes.func
};

export default Forecasts;