import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  IoLocationOutline,
  IoThermometerOutline,
  IoWaterOutline,
  IoCloudOutline,
} from 'react-icons/io5';
import './GraphCastForecast.css';

// Use environment variable for API URL
const REACT_APP_API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5001';

const GraphCastForecast = ({ customLatitude, customLongitude }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchLocationName = async (latitude, longitude) => {
    try {
      const locationResponse = await axios.get(
        `${REACT_APP_API_URL}/api/geocode`,
        {
          params: { lat: latitude, lon: longitude },
        }
      );
      // Extract the formatted_address from the response
      if (locationResponse.data && locationResponse.data.formatted_address) {
        setLocationName(locationResponse.data.formatted_address);
      }
    } catch (err) {
      console.error('Error fetching location name:', err);
    }
  };

  const fetchForecastData = async (latitude, longitude) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch location name first (but don't wait for it to complete)
      fetchLocationName(latitude, longitude);

      // Use our backend API instead of calling Open-Meteo directly
      const response = await axios.get(`${REACT_APP_API_URL}/api/forecast`, {
        params: {
          latitude,
          longitude,
        },
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || response.data.error) {
        throw new Error(
          response.data?.error || 'Failed to fetch forecast data'
        );
      }

      // Ensure we have the required data structure
      if (
        !response.data.daily ||
        !response.data.daily.time ||
        !response.data.current
      ) {
        throw new Error('Invalid data format returned from weather service');
      }

      const dailyData = response.data.daily.time.map((time, index) => ({
        time: new Date(time).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        temperature: Math.round(
          (response.data.daily.temperature_2m_max[index] +
            response.data.daily.temperature_2m_min[index]) /
            2
        ),
        precipitationProb:
          response.data.daily.precipitation_probability_max[index] || 0,
        precipitationSum: response.data.daily.precipitation_sum[index] || 0,
        cloudCover: response.data.daily.cloud_cover_mean[index] || 0,
        weatherCode: response.data.daily.weather_code[index] || 0,
      }));

      setForecast({
        current: response.data.current,
        daily: dailyData,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching forecast data:', err);

      // If we haven't retried too many times, try again
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}...`);
        setRetryCount((prev) => prev + 1);
        setError(null);
        return; // Return early to allow effect to retry
      }

      setError(err.message || 'Failed to fetch weather data');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset loading state when coordinates change
    if (customLatitude !== undefined && customLongitude !== undefined) {
      setUserLocation({ latitude: customLatitude, longitude: customLongitude });
      fetchForecastData(customLatitude, customLongitude);
    }
    // Otherwise use geolocation for the user's current location
    else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          fetchForecastData(latitude, longitude);
        },
        (geoError) => {
          setError(`Unable to access location: ${geoError.message}`);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, [customLatitude, customLongitude, retryCount]);

  if (loading) {
    return (
      <div className="loading-state">
        <div>Loading forecast data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div>{error}</div>
        <button
          className="retry-button"
          onClick={() => setRetryCount(0)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!forecast) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="tooltip-value">
              {entry.name}: {entry.value}
              {entry.unit === '°F'
                ? '°F'
                : entry.unit === 'in'
                ? '"'
                : entry.unit === '%'
                ? '%'
                : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="graphcast-container">
      <div className="graphcast-header">
        <div>
          <div className="graphcast-location">
            <IoLocationOutline className="mr-1 text-red-600" />
            <span>
              {locationName ||
                `${userLocation?.latitude.toFixed(
                  2
                )}°N, ${userLocation?.longitude.toFixed(2)}°W`}
            </span>
          </div>
        </div>
        <div className="current-weather">
          <div className="temperature-display">
            <IoThermometerOutline className="mr-1 text-blue-600" />
            <span className="text-xl">
              {forecast.current.temperature_2m?.toFixed(1)}°F
            </span>
          </div>
          <div className="weather-stats">
            <div className="weather-stat">
              <IoWaterOutline className="mr-1" />
              <span>{forecast.current.relative_humidity_2m}%</span>
            </div>
            <div className="weather-stat">
              <IoCloudOutline className="mr-1" />
              <span>{forecast.current.cloud_cover}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={forecast.daily}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="7 7" stroke="#d3d5d8" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Temp. (°F) / Prob. (%) / Precip. (in)',
                offset: 10,
                angle: -90,
                position: 'insideBottomLeft',
                fill: '#6b7280',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: '',
                angle: 90,
                position: 'insideRight',
                fill: '#6b7280',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              name="Avg Temperature"
              stroke="#A1A7FF"
              strokeWidth={2}
              dot={{ fill: '#A1A7FF', r: 4 }}
              unit="°F"
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="precipitationProb"
              name="Precipitation Chance"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 4 }}
              unit="%"
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="precipitationSum"
              name="Precipitation Amount"
              stroke="#48bb78"
              strokeWidth={2}
              dot={{ fill: '#48bb78', r: 4 }}
              unit="in"
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cloudCover"
              name="Cloud Cover"
              stroke="#94a3b8"
              strokeWidth={2}
              dot={{ fill: '#94a3b8', r: 4 }}
              unit="%"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

GraphCastForecast.propTypes = {
  customLatitude: PropTypes.number,
  customLongitude: PropTypes.number,
};

GraphCastForecast.defaultProps = {
  customLatitude: undefined,
  customLongitude: undefined,
};

export default GraphCastForecast;
