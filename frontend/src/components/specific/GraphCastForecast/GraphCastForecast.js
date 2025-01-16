import React, { useState, useEffect } from 'react';
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

const GraphCastForecast = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast`,
        {
          params: {
            latitude,
            longitude,
            current: [
              'temperature_2m',
              'relative_humidity_2m',
              'precipitation',
              'cloud_cover',
            ],
            hourly: [
              'temperature_2m',
              'precipitation_probability',
              'cloud_cover',
            ],
            temperature_unit: 'fahrenheit',
            wind_speed_unit: 'mph',
            precipitation_unit: 'inch',
            forecast_days: 10,
            models: 'gfs_graphcast025',
          },
        }
      );

      const hourlyData = response.data.hourly;
      const processedData = hourlyData.time.map((time, index) => ({
        time: new Date(time).toLocaleDateString(),
        temperature: hourlyData.temperature_2m[index],
        precipitationProb: hourlyData.precipitation_probability[index],
        cloudCover: hourlyData.cloud_cover[index],
      }));

      const dailyData = processedData.reduce((acc, curr) => {
        const date = curr.time;
        if (!acc[date]) {
          acc[date] = {
            time: date,
            temperature: [],
            precipitationProb: [],
            cloudCover: [],
          };
        }
        acc[date].temperature.push(curr.temperature);
        acc[date].precipitationProb.push(curr.precipitationProb);
        acc[date].cloudCover.push(curr.cloudCover);
        return acc;
      }, {});

      const averagedData = Object.values(dailyData).map((day) => ({
        time: day.time,
        temperature:
          day.temperature.reduce((a, b) => a + b) / day.temperature.length,
        precipitationProb:
          day.precipitationProb.reduce((a, b) => a + b) /
          day.precipitationProb.length,
        cloudCover:
          day.cloudCover.reduce((a, b) => a + b) / day.cloudCover.length,
      }));

      setForecast({
        current: response.data.current,
        daily: averagedData,
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching weather:', err);
      setError('Failed to fetch weather data. Please try again later.');
      setLoading(false);
    }
  };

  const getLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      setError(null);

      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted' || result.state === 'prompt') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ latitude, longitude });
              fetchWeatherData(latitude, longitude);
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Default to New York City
              const defaultLat = 40.7128;
              const defaultLon = -74.006;
              setUserLocation({ latitude: defaultLat, longitude: defaultLon });
              setError(
                'Unable to get your location. Showing weather for New York City.'
              );
              fetchWeatherData(defaultLat, defaultLon);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0,
            }
          );
        } else {
          // Permission denied, use default location
          const defaultLat = 40.7128;
          const defaultLon = -74.006;
          setUserLocation({ latitude: defaultLat, longitude: defaultLon });
          setError(
            'Location access denied. Showing weather for New York City.'
          );
          fetchWeatherData(defaultLat, defaultLon);
        }
      });
    } else {
      const defaultLat = 40.7128;
      const defaultLon = -74.006;
      setUserLocation({ latitude: defaultLat, longitude: defaultLon });
      setError(
        'Geolocation is not supported by your browser. Showing weather for New York City.'
      );
      fetchWeatherData(defaultLat, defaultLon);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div>Loading forecast data...</div>
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
              {entry.name}: {entry.value.toFixed(1)} {entry.unit}
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
          <h2 className="graphcast-title">10-Day GraphCast Forecast</h2>
          <div className="graphcast-location">
            <IoLocationOutline className="mr-1" />
            <span>
              {userLocation?.latitude.toFixed(2)}°N,{' '}
              {userLocation?.longitude.toFixed(2)}°W
            </span>
            {error && (
              <div className="text-yellow-500 text-sm mt-1">{error}</div>
            )}
          </div>
        </div>
        <div className="current-weather">
          <div className="temperature-display">
            <IoThermometerOutline className="mr-1 text-blue-600" />
            <span className="text-xl">
              {forecast.current.temperature_2m.toFixed(1)}°F
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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={forecast.daily}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              domain={['auto', 'auto']}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              domain={[0, 100]}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#A1A7FF"
              name="Temperature"
              unit="°F"
              strokeWidth={2}
              dot={{ fill: '#A1A7FF', r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="precipitationProb"
              stroke="#60a5fa"
              name="Precipitation"
              unit="%"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cloudCover"
              stroke="#94a3b8"
              name="Cloud Cover"
              unit="%"
              strokeWidth={2}
              dot={{ fill: '#94a3b8', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraphCastForecast;
