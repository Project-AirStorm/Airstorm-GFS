// src/components/WeatherCard/WeatherCard.js
import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoThermometerOutline,
  IoLocationOutline,
} from 'react-icons/io5';
import './WeatherCard.css';

/**
 * WeatherCard component displays weather information for a specific location
 * with loading states and error handling.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.city - The name of the city
 * @param {string} props.state - The state abbreviation
 * @param {number} props.latitude - The latitude coordinate
 * @param {number} props.longitude - The longitude coordinate
 * @param {string} props.backgroundColor - The background color for the card
 */
const WeatherCard = ({ city, state, latitude, longitude, backgroundColor }) => {
  const [weatherData, setWeatherData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/weather`, {
          params: { lat: latitude, lon: longitude }
        });
        setWeatherData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather data');
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

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
        className="weather-card"
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
    <div 
      className="weather-card"
      style={{ backgroundColor }}
    >
      <h3 className="weather-title">{city}</h3>
      <p className="weather-subtitle">{city}, {state}</p>
      <p className="weather-description">
        It's {weatherData.current_temperature.toFixed(0)}° and {weatherData.condition}.
      </p>
      <p className="weather-forecast">
        Today's high temperature will be the same as yesterday's
      </p>
      
      <div className="weather-stats-grid">
        <WeatherStat 
          label="Humidity" 
          value={weatherData.humidity} 
          unit="%" 
        />
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

/**
 * WeatherStat component displays a single weather statistic
 * 
 * @component
 * @param {Object} props
 * @param {string} props.label - The label for the statistic
 * @param {number|string} props.value - The value to display
 * @param {string} [props.unit] - Optional unit to display after the value
 * @param {string} [props.description] - Optional description to display below the value
 */
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
  state: PropTypes.string.isRequired,
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

export default WeatherCard;