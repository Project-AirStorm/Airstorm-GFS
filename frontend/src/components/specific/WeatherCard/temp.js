import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoLocationOutline,
  IoTrashOutline,
  IoStarOutline,
  IoStarSharp,
} from 'react-icons/io5';
import './WeatherCard.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const WeatherCard = ({
  city,
  state, // Now optional
  latitude,
  longitude,
  backgroundColor,
  isFavorite,
  onDelete,
  onToggleFavorite,
}) => {
  const [weatherData, setWeatherData] = React.useState(null);
  const [locationInfo, setLocationInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        //console.log(`Fetching data for ${city} at ${latitude}, ${longitude}`);

        // This fetches the latitude and longitutde from the the Flask API as JSON data
        const weatherResponse = await axios.get(
          `${REACT_APP_API_URL}/api/weather`,
          {
            params: { lat: latitude, lon: longitude },
          }
        );
        //console.log('Weather response:', weatherResponse.data);
        setWeatherData(weatherResponse.data);

        const locationResponse = await axios.get(
          `${REACT_APP_API_URL}/api/geocode`,
          {
            params: { lat: latitude, lon: longitude },
          }
        );
        //console.log('Geocoding API response:', locationResponse.data);
        setLocationInfo(locationResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', {
          city,
          latitude,
          longitude,
          error: err.message,
        });
        setError(
          `Unable to load weather data for ${city} (${latitude}, ${longitude})`
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [latitude, longitude, city]);

  // Function to handle toggling favorite status and save to localStorage
  const handleToggleFavorite = () => {
    // Get the current location details
    const currentLocation = {
      city: city || (locationInfo?.components?.city || 'Unknown City'),
      state: state || (locationInfo?.components?.state_code || 'Unknown'),
      latitude,
      longitude,
      isFavorite: !isFavorite,
    };
    
    try {
      // Get existing saved locations from localStorage
      const savedLocationsStr = localStorage.getItem('savedLocations') || '[]';
      const savedLocations = JSON.parse(savedLocationsStr);
      
      // Check if this location already exists
      const existingLocationIndex = savedLocations.findIndex(
        loc => loc.latitude === latitude && loc.longitude === longitude
      );
      
      if (!isFavorite) {
        // Add to saved locations if it's being favorited
        if (existingLocationIndex === -1) {
          savedLocations.push(currentLocation);
        } else {
          // Update the existing location
          savedLocations[existingLocationIndex] = currentLocation;
        }
      } else {
        // Remove from saved locations if it's being unfavorited
        if (existingLocationIndex !== -1) {
          savedLocations.splice(existingLocationIndex, 1);
        }
      }
      
      // Save back to localStorage
      localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    } catch (error) {
      console.error('Error saving location to localStorage:', error);
    }
    
    // Call the original onToggleFavorite prop
    onToggleFavorite();
  };

  // Loading state with animation
  if (loading) {
    return (
      <div
        className="weather-card weather-card--loading"
        style={{ backgroundColor }}
        aria-busy="true"
      >
        <div className="loading-line loading-line--title"></div>
        <div className="loading-line loading-line--subtitle"></div>
        <div className="loading-line loading-line--text"></div>
        <div className="loading-line loading-line--full"></div>

        <div className="weather-stats-grid">
          {[1, 2, 3].map((index) => (
            <div key={index} className="stat-box stat-box--loading">
              <div className="loading-line loading-line--stat-label"></div>
              <div className="loading-line loading-line--stat-value"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with details
  if (error) {
    return (
      <div className="weather-card" style={{ backgroundColor }} role="alert">
        <div className="error-container">
          <p className="error-title">Unable to Load Weather</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="weather-card"
      style={{ backgroundColor }}
      role="region"
      aria-label={`Weather information for ${city}`}
    >
      <div className="card-header">
        <div className="location-info">
          <h3 className="location-primary">{city}</h3>
          {locationInfo?.components && (
            <>
              <div className="location-secondary">
                <IoLocationOutline className="inline-icon" />
                <span>
                  {locationInfo.components.city},{' '}
                  {locationInfo.components.state_code}
                </span>
              </div>
              <div className="location-details">
                <span>
                  {locationInfo.components.county}
                  <span className="location-details-separator">•</span>
                  {locationInfo.components.state}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="weather-card-actions">
          <button
            onClick={handleToggleFavorite}
            className="action-button"
            title={
              isFavorite
                ? 'Remove from monitored locations'
                : 'Add to monitored locations'
            }
            aria-label={
              isFavorite
                ? 'Remove from monitored locations'
                : 'Add to monitored locations'
            }
          >
            {isFavorite ? (
              <IoStarSharp className="action-icon" />
            ) : (
              <IoStarOutline className="action-icon" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="action-button"
            title="Remove this location"
            aria-label="Remove this location"
          >
            <IoTrashOutline className="action-icon" />
          </button>
        </div>
      </div>

      <p className="weather-description">
        It's {weatherData.current_temperature.toFixed(0)}° and{' '}
        {weatherData.condition}.
      </p>

      <div className="weather-stats-grid">
        <WeatherStat label="Rain" value={weatherData.rain} unit="inches" />
        <WeatherStat
          label="Wind"
          value={weatherData.wind_speed.toFixed(0)}
          unit=" mph"
        />
        <WeatherStat
          label="Wind Direction"
          value={weatherData.wind_direction}
        />
      </div>
    </div>
  );
};

const WeatherStat = ({ label, value, unit, description }) => (
  <div className="stat-box" role="group" aria-label={label}>
    <p className="stat-label">{label}</p>
    <p className="stat-value">
      {value}
      {unit && <span className="stat-unit">{unit}</span>}
      {description && <span className="stat-description">{description}</span>}
    </p>
  </div>
);

WeatherStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  description: PropTypes.string,
};

WeatherCard.propTypes = {
  city: PropTypes.string.isRequired,
  state: PropTypes.string, // Made optional
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
};

export default WeatherCard;