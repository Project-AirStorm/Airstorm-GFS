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

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

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
                  daily: [
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'precipitation_sum',
                    'precipitation_probability_max',
                    'cloud_cover_mean',
                    'weather_code',
                  ],
                  temperature_unit: 'fahrenheit',
                  precipitation_unit: 'inch',
                  forecast_days: 16,
                  timezone: 'auto',
                  models: 'best_match',
                },
              }
            );

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
                response.data.daily.precipitation_probability_max[index],
              precipitationSum: response.data.daily.precipitation_sum[index],
              cloudCover: response.data.daily.cloud_cover_mean[index],
              weatherCode: response.data.daily.weather_code[index],
            }));

            setForecast({
              current: response.data.current,
              daily: dailyData,
            });
            setLoading(false);
          } catch (err) {
            setError('Failed to fetch weather data');
            setLoading(false);
          }
        },
        () => {
          setError('Unable to access location');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, []);

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
          <h2 className="graphcast-title">16-Day Weather Forecast</h2>
          <div className="graphcast-location">
            <IoLocationOutline className="mr-1" />
            <span>
              {userLocation?.latitude.toFixed(2)}°N,{' '}
              {userLocation?.longitude.toFixed(2)}°W
            </span>
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
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={forecast.daily}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                value: 'Temperature (°F)',
                angle: -90,
                position: 'insideLeft',
                fill: '#6b7280',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{
                value: 'Probability (%) / Precipitation (in)',
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
              yAxisId="right"
              type="monotone"
              dataKey="precipitationProb"
              name="Precipitation Chance"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', r: 4 }}
              unit="%"
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="precipitationSum"
              name="Precipitation Amount"
              stroke="#48bb78"
              strokeWidth={2}
              dot={{ fill: '#48bb78', r: 4 }}
              unit="in"
            />

            <Line
              yAxisId="right"
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

export default GraphCastForecast;
