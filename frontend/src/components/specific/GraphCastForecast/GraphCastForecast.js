// File: Airstorm-GFS/frontend/src/components/specific/GraphCastForecast/GraphCastForecast.js
// *** MODIFIED: Updated default visibility, added null variable disabling, added skeleton loader ***

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useUserProfile } from '../../../contexts/UserContext';
import {
  LineChart, Line, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { IoLocationOutline } from 'react-icons/io5';
import { BsToggleOn, BsToggleOff } from "react-icons/bs";
import { variableStyles } from '../../../config/WeatherConfig';
import './GraphCastForecast.css'; // Ensure CSS is imported

const REACT_APP_API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5001';

// --- Chart Line Configuration --- (Unchanged)
const chartLinesConfig = [
  // ... (Keep the existing chartLinesConfig array - Make sure it includes all potential keys) ...
  // Temperatures
  { key: 'temperature_2m_max', name: 'Max Temp', color: variableStyles.temperature_2m?.color || '#E53E3E', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'temperature_2m_min', name: 'Min Temp', color: variableStyles.temperature_2m?.altColor || '#3182CE', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'temperature_2m_mean', name: 'Mean Temp', color: variableStyles.temperature_2m?.meanColor || '#ECC94B', unit: '°F', yAxisId: 'left', type: 'line' },
  { key: 'dew_point_2m_mean', name: 'Mean Dew Point', color: variableStyles.dew_point_2m?.meanColor || '#68D391', unit: '°F', yAxisId: 'left', type: 'line' },
  // Precipitation
  { key: 'precipitation_probability_max', name: 'Max Precip %', color: variableStyles.precipitation_probability?.color || '#4FD1C5', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'precipitation_probability_min', name: 'Min Precip %', color: variableStyles.precipitation_probability?.altColor || '#81E6D9', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'precipitation_sum', name: 'Precip Sum', color: variableStyles.precipitation?.color || '#4299E1', unit: 'inch', yAxisId: 'left', type: 'line' },
  { key: 'rain_sum', name: 'Rain Sum', color: variableStyles.rain?.color || '#63B3ED', unit: 'inch', yAxisId: 'left', type: 'line' },
  { key: 'snowfall_sum', name: 'Snowfall Sum', color: variableStyles.snowfall?.color || '#EBF8FF', unit: 'inch', yAxisId: 'left', type: 'line' },
  // Wind
  { key: 'wind_speed_10m_max', name: 'Max Wind Speed', color: variableStyles.wind_speed_10m?.color || '#805AD5', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_speed_10m_min', name: 'Min Wind Speed', color: variableStyles.wind_speed_10m?.altColor || '#B794F4', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_speed_10m_mean', name: 'Mean Wind Speed', color: variableStyles.wind_speed_10m?.meanColor || '#9F7AEA', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_gusts_10m_max', name: 'Max Wind Gust', color: variableStyles.wind_gusts_10m?.color || '#718096', unit: 'mph', yAxisId: 'right', type: 'line' },
  { key: 'wind_gusts_10m_min', name: 'Min Wind Gust', color: variableStyles.wind_gusts_10m?.altColor || '#E2E8F0', unit: 'mph', yAxisId: 'right', type: 'line' },
  // Cloud Cover / Humidity / Visibility
  { key: 'cloud_cover_max', name: 'Max Clouds', color: variableStyles.cloud_cover?.color || '#4A5568', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'cloud_cover_min', name: 'Min Clouds', color: variableStyles.cloud_cover?.altColor || '#E2E8F0', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'cloud_cover_mean', name: 'Mean Clouds', color: variableStyles.cloud_cover?.meanColor || '#A0AEC0', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'relative_humidity_2m_max', name: 'Max Humidity', color: variableStyles.relative_humidity_2m?.color || '#48BB78', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'relative_humidity_2m_min', name: 'Min Humidity', color: variableStyles.relative_humidity_2m?.altColor || '#9AE6B4', unit: '%', yAxisId: 'left', type: 'line' },
  { key: 'visibility_max', name: 'Max Visibility', color: variableStyles.visibility?.color || '#718096', unit: 'm', yAxisId: 'left', type: 'line' },
  { key: 'visibility_min', name: 'Min Visibility', color: variableStyles.visibility?.altColor || '#E2E8F0', unit: 'm', yAxisId: 'left', type: 'line' },
  { key: 'visibility_mean', name: 'Mean Visibility', color: variableStyles.visibility?.meanColor || '#A0AEC0', unit: 'm', yAxisId: 'left', type: 'line' },
  // Other Indices / Durations / Advanced
  { key: 'uv_index_max', name: 'UV Index Max', color: variableStyles.uv_index?.color || '#F6E05E', unit: '', yAxisId: 'left', type: 'line' },
  { key: 'uv_index_clear_sky_max', name: 'UV Clear Sky Max', color: variableStyles.uv_index?.altColor || '#FAF089', unit: '', yAxisId: 'left', type: 'line' },
  { key: 'cape_max', name: 'Max CAPE', color: variableStyles.cape?.color || '#F56565', unit: 'J/kg', yAxisId: 'left', type: 'line' },
  { key: 'cape_min', name: 'Min CAPE', color: variableStyles.cape?.altColor || '#FED7D7', unit: 'J/kg', yAxisId: 'left', type: 'line' },
  { key: 'updraft_max', name: 'Max Updraft', color: variableStyles.updraft_max?.color || '#ED64A6', unit: 'm/s', yAxisId: 'right', type: 'line' },
  // Add any other keys returned by either endpoint if needed for processing nulls
];

// Filter config (Unchanged) - This determines which lines *could* be shown if active
const activeChartLinesConfig = chartLinesConfig.filter(line =>
  line.key &&
  !line.key.includes('_mean') && // Example filter - adjust as needed
  line.key !== 'apparent_temperature_max' &&
  line.key !== 'apparent_temperature_min' &&
  line.key !== 'showers_sum'
);

// --- Component ---
const GraphCastForecast = ({ customLatitude = undefined, customLongitude = undefined }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [dailyUnits, setDailyUnits] = useState({});
  const [selectedModel, setSelectedModel] = useState('Model Mix');
  // *** NEW STATE: Track variables that are always null ***
  const [nullableVariables, setNullableVariables] = useState(new Set());

  // State for visibility - *** MODIFIED defaultVisible ***
  const [visibility, setVisibility] = useState(() => {
    const initialVisibility = {};
    // *** Use the new defaultVisible list provided by the user ***
    const defaultVisible = [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_speed_10m_min',
      // 'precipitation_sum', // Default hidden
      'relative_humidity_2m_max', // Example default
      'relative_humidity_2m_min', // Example default
      // Keep most hidden by default
    ];
    // Initialize visibility based on the *active* configuration
    activeChartLinesConfig.forEach(line => {
      initialVisibility[line.key] = defaultVisible.includes(line.key);
    });
    // Ensure min/max pairs start consistently if one is visible
    const checkPairs = ['temperature_2m', 'wind_speed_10m', 'relative_humidity_2m']; // Add other pairs if needed
    checkPairs.forEach(base => {
        if (initialVisibility[`${base}_max`] || initialVisibility[`${base}_min`]) {
            initialVisibility[`${base}_max`] = true;
            initialVisibility[`${base}_min`] = true;
        }
    });
    return initialVisibility;
  });

  const { savedLocations: contextSavedLocations, isLoading: contextLoading } = useUserProfile();

  const fetchLocationName = useCallback(async (latitude, longitude) => {
    // ... existing code ... (Unchanged)
    try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/geocode`, { params: { lat: latitude, lon: longitude } });
        const components = response.data?.components;
        if (components) {
            const city = components.city || components.town || components.village || components.county || 'Unknown Area';
            const state = components.state_code || '';
            setLocationName(state ? `${city}, ${state}` : city);
        } else { setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`); }
    } catch (err) { console.error('Failed to fetch location name:', err); setLocationName(`${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`); }
  }, []);

  // --- fetchForecastData (MODIFIED: Check for all-null variables) ---
  const fetchForecastData = useCallback(async (latitude, longitude, model) => {
     setLoading(true); setError(null); fetchLocationName(latitude, longitude);
     setNullableVariables(new Set()); // Reset null check on new fetch
     const apiUrl = model === 'GraphCast'
       ? `${REACT_APP_API_URL}/api/forecast/daily_extended`
       : `${REACT_APP_API_URL}/api/forecast/detailed`;

     try {
       console.log(`Fetching forecast from: ${apiUrl} for model: ${model}`);
       const response = await axios.get(apiUrl, { params: { latitude, longitude }, timeout: 15000 });
       if (!response.data || response.data.error) { throw new Error(response.data?.error || 'Failed to fetch forecast data'); }
       if (!response.data.daily || !response.data.daily.time) { throw new Error('Invalid data format received from API'); }

       setDailyUnits(response.data.daily_units || {});
       const newNullableVars = new Set();
       const dailyApiResponse = response.data.daily;

       // *** Check for all-null variables ***
       chartLinesConfig.forEach(config => {
         if (config.key && dailyApiResponse[config.key]) {
           const allNull = dailyApiResponse[config.key].every(val => val === null);
           if (allNull) {
             newNullableVars.add(config.key);
           }
         } else if (config.key) {
           // If the key doesn't even exist in the response, treat it as nullable for disabling
           newNullableVars.add(config.key);
         }
       });
       setNullableVariables(newNullableVars); // Update the state

       // Process data for the chart (only needs data, not null check here)
       const dailyData = dailyApiResponse.time.map((time, index) => {
         const dayData = { time: new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isoTime: time };
         chartLinesConfig.forEach(config => {
           if(config.key) dayData[config.key] = dailyApiResponse[config.key]?.[index] ?? null;
         });
         return dayData;
       });

       setForecast({ daily: dailyData });
       setUserLocation({ latitude, longitude });
       setLoading(false);
     } catch (err) {
       console.error(`Error fetching forecast data from ${apiUrl}:`, err);
       setError(err.message || 'Failed to fetch forecast');
       setLoading(false);
       setForecast(null); // Clear potentially stale forecast on error
     }
   }, [fetchLocationName]);

  // --- useEffect (Unchanged from previous version) ---
   useEffect(() => {
     if (contextLoading) { setLoading(true); return; }
     setLoading(true); setError(null); setForecast(null); setLocationName('');

     let targetLat, targetLon;
     if (customLatitude !== undefined && customLongitude !== undefined) {
       targetLat = customLatitude;
       targetLon = customLongitude;
     } else if (contextSavedLocations && contextSavedLocations.length > 0) {
       const firstFavorite = contextSavedLocations.find(loc => loc.isFavorite) || contextSavedLocations[0];
       targetLat = firstFavorite.latitude;
       targetLon = firstFavorite.longitude;
     }

     if (targetLat !== undefined && targetLon !== undefined) {
       fetchForecastData(targetLat, targetLon, selectedModel);
     } else {
       setError('Please select or add a location.');
       setLoading(false);
       setUserLocation(null);
     }
   }, [customLatitude, customLongitude, contextSavedLocations, contextLoading, fetchForecastData, selectedModel]);

  // --- Legend Toggle Handler (MODIFIED: Prevent toggle if disabled) ---
  const handleLegendClick = (dataKey) => {
      // Prevent toggling if the variable is always null
      if (nullableVariables.has(dataKey)) {
          console.log(`Variable ${dataKey} is always null, toggle disabled.`);
          return;
      }
      setVisibility(prevVisibility => ({
          ...prevVisibility,
          [dataKey]: !prevVisibility[dataKey]
      }));
  };

  // --- Custom Legend Renderer (MODIFIED: Add disabled state) ---
  const renderCustomLegend = (props) => {
      const itemsToRenderInLegend = activeChartLinesConfig;
      const numColumns = 6;
      const itemsPerColumn = Math.ceil(itemsToRenderInLegend.length / numColumns);
      const columns = [];
      for (let i = 0; i < numColumns; i++) {
          columns.push(itemsToRenderInLegend.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn));
      }

      return (
          <div className="custom-legend-container multi-column">
              {columns.map((columnItems, colIndex) => (
                  <div key={`col-${colIndex}`} className="legend-column">
                      {columnItems.map((entry) => {
                          if (!entry.key) return null;
                          const dataKey = entry.key;
                          const isActive = visibility[dataKey] ?? false;
                          // *** Check if the variable is nullable ***
                          const isDisabled = nullableVariables.has(dataKey);
                          // *** Dynamically add 'disabled' class ***
                          const itemClassName = `custom-legend-item ${isActive ? 'active' : 'inactive'} ${isDisabled ? 'disabled' : ''}`;

                          return (
                              <div
                                  key={`legend-${dataKey}`}
                                  className={itemClassName}
                                  // Only attach onClick if not disabled
                                  onClick={isDisabled ? undefined : () => handleLegendClick(dataKey)}
                                  style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', marginBottom: '4px' }}
                                  title={isDisabled ? `${entry.name} (Data unavailable)` : entry.name} // Add tooltip for disabled items
                              >
                                  <span className="legend-icon" style={{ backgroundColor: entry.color }}></span>
                                  <span className="legend-text">{entry.name}</span>
                                  {/* *** Visually indicate disabled toggle *** */}
                                  <span className="legend-toggle-icon">
                                      {isDisabled
                                          ? <BsToggleOff size={20} color="#CBD5E0" /> // Use a greyed-out off toggle
                                          : (isActive ? <BsToggleOn size={20} color="#34D399" /> : <BsToggleOff size={20} color="#9CA3AF" />)
                                      }
                                  </span>
                              </div>
                          );
                      })}
                  </div>
              ))}
          </div>
      );
  };


  // --- Custom Tooltip (Unchanged) ---
  const CustomTooltip = ({ active, payload, label }) => {
      // ... existing code ...
      if (active && payload && payload.length) {
        return (
          <div className="custom-tooltip"> <p className="tooltip-label">{label}</p>
            {payload
              .filter(pld => chartLinesConfig.some(c => c.key === pld.dataKey))
              .filter(pld => { const c = chartLinesConfig.find(c => c.key === pld.dataKey); return c && visibility[pld.dataKey]; })
              .map((pld) => {
                  const c = chartLinesConfig.find(c => c.key === pld.dataKey);
                  const v = pld.value !== null ? pld.value.toFixed(c?.unit === 'inch' ? 2 : (c?.unit === '°F' ? 1 : 0)) : 'N/A';
                  return ( <p key={pld.dataKey} className="tooltip-value" style={{ color: pld.color }}> {c?.name || pld.dataKey}: {v} {c?.unit || ''} </p> );
               })
             }
          </div>
        );
      } return null;
  }; //

  // --- Helper Function to Generate Area Pairs (Unchanged) ---
  const renderAreaShading = () => {
      // ... existing code ...
      const areas = [];
      const baseKeys = [...new Set(activeChartLinesConfig.map(item => item.key.replace(/_max$|_min$/, '')))];

      baseKeys.forEach(baseKey => {
          const maxKey = `${baseKey}_max`;
          const minKey = `${baseKey}_min`;

          const maxConfig = activeChartLinesConfig.find(item => item.key === maxKey);
          const minConfig = activeChartLinesConfig.find(item => item.key === minKey);

          // Check if both min and max config exist and are visible AND NOT NULLABLE
          if (maxConfig && minConfig &&
              visibility[maxKey] && visibility[minKey] &&
              !nullableVariables.has(maxKey) && !nullableVariables.has(minKey)) // Check if not nullable
          {
              const shadeColor = maxConfig.color;
              if (maxConfig.yAxisId === minConfig.yAxisId) {
                  areas.push(
                      <React.Fragment key={`area-${baseKey}`}>
                          <Area yAxisId={maxConfig.yAxisId} type="monotone" dataKey={maxKey} fill={shadeColor} stroke="none" fillOpacity={0.2} connectNulls={true} isAnimationActive={false}/>
                          <Area yAxisId={minConfig.yAxisId} type="monotone" dataKey={minKey} fill="#FFFFFF" stroke="none" fillOpacity={1} connectNulls={true} isAnimationActive={false}/>
                      </React.Fragment>
                  );
              }
          }
      });
      return areas;
  }; //


  // --- Render Logic ---
  // *** MODIFIED Loading State ***
  // *** MODIFIED Loading State ***
  if (loading) {
    // Skeleton Loader
    return (
      <div className="graphcast-container graphcast-container--loading">
        {/* Skeleton Header (Keep as is) */}
        <div className="graphcast-header simple">
          <div className="graphcast-location skeleton-line skeleton-line--location"></div>
          <div className="model-selector-container skeleton-line skeleton-line--selector"></div>
        </div>

        {/* Skeleton Chart Area (Inner divs removed) */}
        <div className="chart-container detailed-chart skeleton-chart">
           {/* Inner divs removed - styles applied via CSS */}
        </div>

        {/* Skeleton Legend (Keep as is) */}
        <div className="custom-legend-container multi-column skeleton-legend">
            {Array.from({ length: 18 }).map((_, index) => (
                 <div key={`skel-leg-${index}`} className="custom-legend-item skeleton-line skeleton-line--legend-item"></div>
            ))}
        </div>
      </div>
    );
  }

  if (contextLoading && !userLocation && !(customLatitude !== undefined)) { return <div className="loading-state"><div>Loading user locations...</div></div>; } // Context loading
  if (error && !forecast) { return <div className="error-state"><div>Error: {error}</div></div>; } // Initial error
  if (!forecast) { return <div className="error-state"><div>Forecast data unavailable. Please select or add a location.</div></div>; } // No forecast data

  // --- Normal Render ---
  return (
    <div className="graphcast-container">
      {error && forecast && <div className="info-message">Warning: {error} (Displaying last valid data)</div>}
      <div className="graphcast-header simple">
         <div className="graphcast-location"> <IoLocationOutline className="mr-1 text-red-600" /> <span> {locationName || (userLocation ? `${userLocation.latitude.toFixed(2)}°N, ${userLocation.longitude.toFixed(2)}°W` : 'No location selected')} </span> </div>
         <div className="model-selector-container">
           <label htmlFor="model-select" className="model-selector-label">Model:</label>
           <select id="model-select" className="model-selector-dropdown" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} >
             <option value="Model Mix">Model Mix</option>
             <option value="GraphCast">GraphCast</option>
           </select>
         </div>
      </div>
      <div className="chart-container detailed-chart">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={forecast.daily} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} >
            <CartesianGrid strokeDasharray="3 3" stroke="#d3d5d8" />
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }}/>
            <YAxis yAxisId="left" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Temp (°F) / Precip (inch) / % / Other', angle: -90, position: 'insideLeft', fill: '#6b7280', style: { textAnchor: 'middle' } }} allowDecimals={true} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} label={{ value: 'Wind (mph) / Updraft (m/s)', angle: 90, position: 'insideRight', fill: '#6b7280', style: { textAnchor: 'middle' } }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderCustomLegend} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
            {renderAreaShading()}
            {activeChartLinesConfig.map((item) => {
              // *** Also check nullableVariables here for Lines ***
              if (visibility[item.key] && item.type === 'line' && !nullableVariables.has(item.key)) {
                return ( <Line key={item.key} yAxisId={item.yAxisId} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={false} unit={item.unit} connectNulls={true} isAnimationActive={false}/> );
              }
              return null;
            })}
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

export default GraphCastForecast;