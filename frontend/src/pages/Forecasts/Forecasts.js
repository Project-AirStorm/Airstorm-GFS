// Forecasts.js
import PropTypes from 'prop-types';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import './Forecasts.css';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../../utils/UserSession';
import WeatherBox from '../../components/specific/WeatherBox/WeatherBox';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';


/**
 * Forecasts page component that displays weather forecasts and predictions
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Forecasts component
 */

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Forecasts = ({ setCurrentPage }) => {
  const { user } = UserSession(); // User session
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [fetchingLocations, setFetchingLocations] = useState(false);

  const defaultLocation = {
    latitude: 32.385219,
    longitude: -93.762035,
    city: "Shreveport",
    state: "LA"

  };

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const selectLocation = (location) => {
    setSelectedLocation(location);
    setUserLocation({ 
      latitude: location.latitude, 
      longitude: location.longitude 
    });
    setIsOpen(false);
  };

  useEffect(() => {
    const fetchFavoriteLocations = async () => {
    if(!user || !user.id){
      console.log("No user ID avalible no locations");
    }
    setFetchingLocations(true);
      try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      const favorites = response.data.filter(location => location.isFavorite);

      console.log("Fetched favorite locations:", favorites);
        favorites.forEach((location, index) => {
          console.log(`Location #${index}:`, {
            city: location.city, 
            state: location.state,
            latitude: location.latitude,
            longitude: location.longitude,
            keys: Object.keys(location)
          });
        });

      console.log("Fetched favorite locations", favorites);
      setSavedLocations(favorites);

      // Create normalized locations if needed
      const normalizedLocations = favorites.map(location => {
        // Get the property names that actually exist in the API response
        const cityProp = location.city !== undefined ? 'city' : 
                        (location.name !== undefined ? 'name' : null);
        const stateProp = location.state !== undefined ? 'state' : 
                         (location.region !== undefined ? 'region' : null);
        
        return {
          ...location,
          // Ensure city and state properties exist with appropriate fallbacks
          city: cityProp ? location[cityProp] : 'Unknown Location',
          state: stateProp ? location[stateProp] : '',
          // Ensure latitude and longitude are numbers
          latitude: typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude),
          longitude: typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude)
        };
      });
      
      console.log("Normalized locations:", normalizedLocations);
      setSavedLocations(normalizedLocations);

    } catch (err) {
        console.error('Error fetching favorite locations:', err);
        setError(`Could not fetch your saved locations: ${err.message}`);
    }finally{
      setFetchingLocations(false);
      }
      };

    fetchFavoriteLocations();
  }, [user]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const options = {
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0,   // Don't use cached position
        enableHighAccuracy: false // Don't need high accuracy for weather
      };
      
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setLoading(false);
        },
        
        // Error callback
        (error) => {
          console.error('Error retrieving location:', error);
          // Use default location when geolocation fails
          setUserLocation(defaultLocation);
          setError('Using default location. Could not access your location: ' + error.message);
          setLoading(false);
        },
        options // Pass the options
      );
    } else {
      console.error('Geolocation is not supported by your browser');
      setUserLocation(defaultLocation);
      setError('Geolocation is not supported by your browser. Using default location.');
      setLoading(false);
    }
  }, []); // Empty dependency array to run once on mount

  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="forecast-container">
      <div className="forecasts-body">
        
        {error && (
          <div className="alert" style={{ color: 'orange', margin: '10px 0' }}>
            {error}
          </div>
        )}

        <div className='locationLabel'>
          {selectedLocation ? 
            `Location: ${selectedLocation.city}`:
            `Location: Latitude: ${userLocation?.latitude.toFixed(6)} Longitude: ${userLocation?.longitude.toFixed(6)}`}
        </div>

        <div className="saved-locations-dropdown">
          <button 
            onClick={handleClick} 
            className="dropdown-button"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="font-medium">
              {fetchingLocations? 'Loading locations...':'Select Saved Location'}
            </span>
            {isOpen ? (
              <ChevronUp className="transition-transform duration-300" />
            ) : (
              <ChevronDown className="transition-transform duration-300" />
            )}
          </button>
          
          {isOpen && (
            <div className="dropdown-menu">
              {fetchingLocations ? (
                <div className="dropdown-empty">Loading Locations...</div>
              ) :savedLocations.length > 0 ?(savedLocations.map((location, index) => {
                  const cityDisplay = location.city || 'Unknown Location';
                  const stateDisplay = location.state;
                  const locationDisplay = stateDisplay ? `${cityDisplay}, ${stateDisplay}` : cityDisplay;
                  return (
                    <button
                    key={index}
                    className="dropdown-item"
                    onClick={() => selectLocation(location)}
                  >
                    <MapPin size={16} />
                    <span>{locationDisplay}</span>
                    <span className="location-coordinates">
                      {typeof location.latitude === 'number' && typeof location.longitude ==='number'?
                      `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`: '(Coordinates Unavalible)'}
                    </span>
                  </button>
                  );
                  
                })
              ) : (
                <div className="dropdown-empty">No saved locations</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className= "forecasts-body2">
        {/* Vertical scrolling weather grid */}
        <div className="weather-grid-vertical">    
          {userLocation && (
            <WeatherBox
              key={`${userLocation.latitude}-${userLocation.longitude}`}
              latitude={userLocation.latitude}
              longitude={userLocation.longitude}
            />
          )}
        </div>
      </div>

    </div>
  );
};

Forecasts.propTypes = {
  setCurrentPage: PropTypes.func
};

export default Forecasts;