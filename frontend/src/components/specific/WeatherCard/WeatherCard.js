// src/components/WeatherCard/WeatherCard.js
import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  IoThermometerOutline,
  IoLocationOutline,
} from 'react-icons/io5';

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
        className="weather-card rounded-xl p-6 animate-pulse"
        style={{ backgroundColor }}
      >
        <div className="h-6 bg-white bg-opacity-30 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-white bg-opacity-30 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white bg-opacity-30 rounded w-2/3 mb-4"></div>
        <div className="h-3 bg-white bg-opacity-30 rounded w-full mb-6"></div>
        
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((index) => (
            <div key={index} className="rounded-lg p-3" style={{ backgroundColor: '#3361E0' }}>
              <div className="h-3 bg-white bg-opacity-30 rounded w-2/3 mb-2"></div>
              <div className="h-6 bg-white bg-opacity-30 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="weather-card rounded-xl p-6"
        style={{ backgroundColor }}
      >
        <div className="flex flex-col items-center justify-center text-white">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="weather-card rounded-xl p-6"
      style={{ backgroundColor }}
    >
      <h3 className="text-lg font-bold text-white">{city}</h3>
      <p className="text-sm mb-2 text-white">{city}, {state}</p>
      <p className="text-sm mb-4 text-white">
        It's {weatherData.current_temperature.toFixed(0)}° and {weatherData.condition}.
      </p>
      <p className="text-xs mb-4 text-white">
        Today's high temperature will be the same as yesterday's
      </p>
      
      <div className="grid grid-cols-3 gap-4">
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
  <div className="rounded-lg p-3" style={{ backgroundColor: '#3361E0' }}>
    <p className="text-xs font-bold mb-1 text-white">{label}</p>
    <p className="text-xl text-white">
      {value}
      {unit && <span className="text-sm">{unit}</span>}
      {description && <span className="text-xs">{description}</span>}
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