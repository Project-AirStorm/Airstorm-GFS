import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoThermometerOutline,
  IoTrashOutline,
  IoStarOutline,
  IoStarSharp,
  IoLocationOutline,
} from 'react-icons/io5';
import './WeatherCard.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const WeatherCard = ({
  city,
  state,
  latitude,
  longitude,
  backgroundColor,
  onDelete,
  onToggleFavorite,
  isFavorite,
}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching data for ${city} at ${latitude}, ${longitude}`);

        // This fetches the latitude and longitutde from the the Flask API as JSON data 
        const weatherResponse = await axios.get(
          `${REACT_APP_API_URL}/api/weather`,
          {
            params: { lat: latitude, lon: longitude },
          }
        );
        console.log('Weather response:', weatherResponse.data);
        setWeatherData(weatherResponse.data);

        // Then try to fetch location data
        const locationResponse = await axios.get(
          `${REACT_APP_API_URL}/api/geocode`,
          {
            params: { lat: latitude, lon: longitude },
          }
        );
        console.log('Location response:', locationResponse.data);
        setLocationInfo(locationResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Data fetch error:', err.response?.data || err.message);
        setError(
          `Unable to load data\nLocation: ${city} (${latitude.toFixed(
            4
          )}, ${longitude.toFixed(4)})`
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [latitude, longitude, city]);

  if (loading) {
    return (
      <div
        className="weather-card weather-card--loading"
        style={{ backgroundColor }}
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

  if (error) {
    return (
      <div
        className="weather-card weather-card--error"
        style={{ backgroundColor }}
      >
        <div className="error-container">
          <p className="error-title">Error</p>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-card" style={{ backgroundColor }}>
      <div className="weather-card-header">
        <div>
          <h3 className="weather-title">{city}</h3>
          {locationInfo?.components && (
            <p className="weather-subtitle">
              <IoLocationOutline className="inline-icon" />
              {locationInfo.components.city &&
              locationInfo.components.state_code
                ? `${locationInfo.components.city}, ${locationInfo.components.state_code}`
                : locationInfo.formatted_address}
            </p>
          )}
          {locationInfo?.components?.county && (
            <p className="location-details">
              {locationInfo.components.county}
              {locationInfo.components.state &&
                ` • ${locationInfo.components.state}`}
            </p>
          )}
        </div>
        <div className="weather-card-actions">
          <button
            onClick={onToggleFavorite}
            className="action-button"
            title={
              isFavorite
                ? 'Remove from monitored locations'
                : 'Add to monitored locations'
            }
          >
            {isFavorite ? (
              <IoStarSharp className="w-5 h-5" />
            ) : (
              <IoStarOutline className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="action-button"
            title="Delete location"
          >
            <IoTrashOutline className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="weather-description">
        It's {weatherData.current_temperature.toFixed(0)}° and{' '}
        {weatherData.condition}.
      </p>

      <div className="weather-stats-grid">
        <WeatherStat label="Humidity" value={weatherData.humidity} unit="%" />
        <WeatherStat
          label="Wind"
          value={weatherData.wind_speed.toFixed(0)}
          unit="mph"
        />
        <WeatherStat
          label="Air Quality"
          value={weatherData.air_quality}
          description="(Moderate)"
        />
      </div>
    </div>
  );
};

const WeatherStat = ({ label, value, unit, description }) => (
  <div className="stat-box">
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
  state: PropTypes.string,
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
};

export default WeatherCard;
