// File: Airstorm-GFS/frontend/src/components/specific/GraphCastForecast/GraphCastForecast.js
// Final version: Removes geolocation, uses context fallback, fixes defaultProps warning.

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useUserProfile } from '../../../contexts/UserContext'; // Needed for context fallback
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

const REACT_APP_API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Fix defaultProps warning: Use default parameters in signature
const GraphCastForecast = ({ customLatitude = undefined, customLongitude = undefined }) => { // Defaults set here
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');

  // Get savedLocations and loading state directly from context
  const { savedLocations: contextSavedLocations, isLoading: contextLoading } = useUserProfile(); //

  // --- fetchLocationName (unchanged) ---
  const fetchLocationName = async (latitude, longitude) => {
    try {
      const locationResponse = await axios.get(
        `${REACT_APP_API_URL}/api/geocode`,
        {
          params: { lat: latitude, lon: longitude },
        }
      );
      if (locationResponse.data && locationResponse.data.formatted_address) {
        setLocationName(locationResponse.data.formatted_address);
      } else {
         setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`);
      }
    } catch (err) {
      console.error('Error fetching location name:', err);
      setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`);
    }
  };

  // --- fetchForecastData (unchanged - with internal retry) ---
  const fetchForecastData = async (latitude, longitude) => {
    let currentRetry = 0;
    const maxRetries = 2;

    fetchLocationName(latitude, longitude); // Fetch name concurrently

    while (currentRetry <= maxRetries) {
        setLoading(true); // Ensure loading is true at start of attempt
        setError(null);

        try {
            console.log(`Fetching forecast for ${latitude}, ${longitude} (Attempt ${currentRetry + 1})`);
            const response = await axios.get(`${REACT_APP_API_URL}/api/forecast`, {
                params: { latitude, longitude },
                timeout: 10000,
            });

            if (!response.data || response.data.error) {
                throw new Error(response.data?.error || 'Failed to fetch forecast data');
            }
            if (!response.data.daily || !response.data.daily.time || !response.data.current) {
                throw new Error('Invalid data format returned from weather service');
            }

            const dailyData = response.data.daily.time.map((time, index) => ({
                time: new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                temperature: Math.round((response.data.daily.temperature_2m_max[index] + response.data.daily.temperature_2m_min[index]) / 2),
                precipitationProb: response.data.daily.precipitation_probability_max[index] || 0,
                precipitationSum: response.data.daily.precipitation_sum[index] || 0,
                cloudCover: response.data.daily.cloud_cover_mean[index] || 0,
                weatherCode: response.data.daily.weather_code[index] || 0,
            }));

            setForecast({ current: response.data.current, daily: dailyData });
            setUserLocation({ latitude, longitude }); // Update the location being displayed
            setLoading(false);
            setError(null);
            return; // Exit loop on success

        } catch (err) {
            console.error('Error fetching forecast data:', err);
            currentRetry++;
            if (currentRetry > maxRetries) {
                setError(err.message || 'Failed to fetch weather data after multiple attempts');
                setLoading(false);
            } else {
                console.log(`Retrying forecast fetch (${currentRetry}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
  };

  // --- useEffect (No Geolocation Logic) ---
  useEffect(() => {
    // Wait for user context to finish loading initial locations
    if (contextLoading) {
        console.log("GraphCastForecast: Waiting for user context to load...");
        setLoading(true); // Keep loading indicator on while context loads
        return; // Prevent further execution until context is ready
    }

    setLoading(true); // Assume loading for any potential fetch below
    setError(null);
    setForecast(null); // Clear previous forecast
    setLocationName(''); // Clear previous name

    // Priority 1: Use custom location if provided (selected card)
    if (customLatitude !== undefined && customLongitude !== undefined) {
      console.log("GraphCastForecast: Using custom coordinates from selection.");
      fetchForecastData(customLatitude, customLongitude);
    }
    // Priority 2: Use first saved location from context if available
    else if (contextSavedLocations && contextSavedLocations.length > 0) {
      const fallbackLocation = contextSavedLocations[0];
      console.log(`GraphCastForecast: No custom location, using first saved location from context: ${fallbackLocation.name || 'First Saved Location'}`);
      fetchForecastData(fallbackLocation.latitude, fallbackLocation.longitude);
    }
    // Priority 3: No location available (neither selected nor saved)
    else {
      console.error("GraphCastForecast: No custom location selected and no saved locations in context.");
      setError('Please select or add a location to view the forecast.'); // Set specific error
      setLoading(false); // Stop loading, show error instead
      setUserLocation(null); // Ensure no stale location is displayed
    }
    // NO navigator.geolocation call anywhere in this component.

    // Dependencies: custom coords, the context locations array itself, and context loading state
  }, [customLatitude, customLongitude, contextSavedLocations, contextLoading]);


  // --- Render Logic ---

  // Show context loading state if we haven't determined a location yet and context is loading
  if (contextLoading && !userLocation && !(customLatitude !== undefined)) {
       return <div className="loading-state"><div>Loading user locations...</div></div>;
  }

  // Show main loading state during fetch
  if (loading) {
    return <div className="loading-state"><div>Loading forecast data...</div></div>;
  }

  // Show error if fetching failed or no location was available to fetch
  if (error && !forecast) {
    // This 'error' state now comes ONLY from fetchForecastData failures or the 'No location' case
    return <div className="error-state"><div>Error: {error}</div></div>;
  }

  // Handle case where loading finished but forecast is still null (e.g., initial state before context loads fully)
  if (!forecast) {
       return <div className="error-state"><div>Forecast data unavailable. Please select or add a location.</div></div>;
   }

  // Custom Tooltip Component (unchanged)
   const CustomTooltip = ({ active, payload, label }) => {
     if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="tooltip-value">
                {entry.name}: {entry.value}
                {entry.unit === '°F' ? '°F' : entry.unit === 'in' ? '"' : entry.unit === '%' ? '%' : ''}
              </p>
            ))}
          </div>
        );
      }
      return null;
   };

  // Component Render (unchanged)
  return (
    <div className="graphcast-container">
       {/* Show non-blocking error if fetch failed but previous data exists */}
       {error && <div className="info-message">{error}</div>}

      <div className="graphcast-header">
        {/* Header content */}
         <div>
           <div className="graphcast-location">
             <IoLocationOutline className="mr-1 text-red-600" />
             <span>
               {locationName ||
                 (userLocation ? `${userLocation.latitude.toFixed(2)}°N, ${userLocation.longitude.toFixed(2)}°W` : 'No location selected')}
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
        {/* Chart rendering */}
        <ResponsiveContainer width="100%" height={400}>
           <LineChart data={forecast.daily} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
             <CartesianGrid strokeDasharray="7 7" stroke="#d3d5d8" />
             <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
             <YAxis yAxisId="left" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Temp. (°F) / Prob. (%) / Precip. (in)', offset: 10, angle: -90, position: 'insideBottomLeft', fill: '#6b7280' }} />
             <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: '', angle: 90, position: 'insideRight', fill: '#6b7280' }} />
             <Tooltip content={<CustomTooltip />} />
             <Legend wrapperStyle={{ paddingTop: '20px' }} />
             <Line yAxisId="left" type="monotone" dataKey="temperature" name="Avg Temperature" stroke="#A1A7FF" strokeWidth={2} dot={{ fill: '#A1A7FF', r: 4 }} unit="°F" />
             <Line yAxisId="left" type="monotone" dataKey="precipitationProb" name="Precipitation Chance" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} unit="%" />
             <Line yAxisId="left" type="monotone" dataKey="precipitationSum" name="Precipitation Amount" stroke="#48bb78" strokeWidth={2} dot={{ fill: '#48bb78', r: 4 }} unit="in" />
             <Line yAxisId="left" type="monotone" dataKey="cloudCover" name="Cloud Cover" stroke="#94a3b8" strokeWidth={2} dot={{ fill: '#94a3b8', r: 4 }} unit="%" />
           </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// PropTypes remain the same (no savedLocations prop needed)
GraphCastForecast.propTypes = {
  customLatitude: PropTypes.number,
  customLongitude: PropTypes.number,
};

// DefaultProps block is removed entirely

export default GraphCastForecast;